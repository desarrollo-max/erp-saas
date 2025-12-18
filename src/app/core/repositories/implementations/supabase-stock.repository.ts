import { Injectable, inject } from "@angular/core";
import { StockRepository } from "../stock.repository";
import { ScmStockLevel, ScmStockMovement } from "@core/models/erp.types";
import { SupabaseService } from "@core/services/supabase.service";
import { SessionService } from "@core/services/session.service";

@Injectable({
    providedIn: 'root'
})
export class SupabaseStockRepository extends StockRepository {
    private supabase = inject(SupabaseService);
    private session = inject(SessionService);

    private getCompanyId(): string {
        const id = this.session.currentCompanyId();
        if (!id) throw new Error('No active Company Context found.');
        return id;
    }

    async getStockByVariantAndWarehouse(variantId: string, warehouseId: string): Promise<ScmStockLevel | null> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();

        const { data, error } = await this.supabase.client
            .from('scm_stock_levels')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId)
            .eq('variant_id', variantId)
            .eq('warehouse_id', warehouseId)
            .single();

        if (error) {
            // Code PGRST116 means no rows found, suggesting 0 stock or record doesn't exist yet
            if (error.code !== 'PGRST116') {
                console.error('Error fetching stock level:', error);
            }
            return null;
        }

        return data as ScmStockLevel;
    }

    async getAggregatedStockByVariant(variantId: string): Promise<number> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();

        // Sum quantity_on_hand for this variant across all warehouses of the company
        const { data, error } = await this.supabase.client
            .from('scm_stock_levels')
            .select('quantity_on_hand')
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId)
            .eq('variant_id', variantId);

        if (error) {
            console.error('Error fetching aggregated stock:', error);
            return 0;
        }

        if (!data || data.length === 0) return 0;

        return data.reduce((acc, curr) => acc + (curr.quantity_on_hand || 0), 0);
    }

    async createMovement(movement: Partial<ScmStockMovement>): Promise<void> {
        await this.createStockMovement(movement);
    }

    async createStockMovement(movement: Partial<ScmStockMovement>): Promise<ScmStockMovement> {
        console.group('Stock Transaction Debug');
        console.log('1. Initiating Stock Movement:', movement);

        const tenant_id = this.session.currentTenantId();
        const company_id = this.getCompanyId(); // Context validation

        // 1. Validate
        if (!movement.variant_id || !movement.warehouse_id || !movement.quantity) {
            console.groupEnd();
            throw new Error('Datos incompletos para el movimiento de inventario.');
        }

        // 2. Prepare Data
        const userId = this.session.currentUserId();
        console.log('2. User Context:', userId);

        if (!userId) {
            console.groupEnd();
            throw new Error('Usuario no identificado. No se puede registrar el movimiento de stock sin un usuario autenticado válido.');
        }

        const dataToInsert = {
            // Strictly whitelist columns to prevent "column not found" errors
            tenant_id,
            company_id,
            created_by: userId,
            warehouse_id: movement.warehouse_id,
            variant_id: movement.variant_id,
            quantity: movement.quantity,
            movement_type: movement.movement_type,
            movement_date: movement.movement_date || new Date().toISOString(),
            notes: movement.notes || null,
            reference_type: movement.reference_type || null,
            reference_id: movement.reference_id || null
            // Do NOT spread ...movement here. This ensures we don't send 'product_id' or 'id' if mistakenly passed.
        };

        // 3. Insert Movement
        console.log('3. Inserting Movement Record...');
        const { data: insertedMovement, error: moveError } = await this.supabase.client
            .from('scm_stock_movements')
            .insert(dataToInsert)
            .select()
            .single();

        if (moveError) {
            console.error('Movement Insert Failed:', moveError);
            console.groupEnd();
            throw new Error(`Error registrando movimiento: ${moveError.message}`);
        }
        console.log('   Movement Record Created:', insertedMovement?.id);

        // 4. Update Stock Level (Atomic-like operation via Supabase Logic or Manual Upsert)
        // Fetch current level to be safe
        console.log('4. Fetching Current Stock Level...');
        const { data: currentLevel, error: fetchError } = await this.supabase.client
            .from('scm_stock_levels')
            .select('*')
            .eq('tenant_id', tenant_id)
            .eq('company_id', company_id) // Security Constraint: Strict Company Isolation
            .eq('warehouse_id', movement.warehouse_id!)
            .eq('variant_id', movement.variant_id!)
            .maybeSingle(); // Use maybeSingle to avoid 406/errors on empty

        if (fetchError) {
            console.error('Stock Level Fetch Error:', fetchError);
        }

        console.log('   Current Level Found:', currentLevel);

        let newOnHand = 0;
        let newAvailable = 0;

        if (currentLevel) {
            newOnHand = currentLevel.quantity_on_hand;
            newAvailable = currentLevel.quantity_available;
        }

        console.log(`   Baseline Stock: OnHand=${newOnHand}, Available=${newAvailable}`);

        // Apply Logic
        const isPositive = movement.movement_type === 'IN' ||
            movement.movement_type === 'PRODUCTION_OUTPUT' ||
            (movement.movement_type === 'ADJUSTMENT' && movement.quantity! > 0);

        if (isPositive) {
            newOnHand += movement.quantity!;
            newAvailable += movement.quantity!;
        } else {
            // OUT, PRODUCTION_CONSUMPTION, TRANSFER (Source), ADJUSTMENT (Negative)
            newOnHand -= movement.quantity!;
            newAvailable -= movement.quantity!;
        }

        console.log(`   Calculated New Stock: OnHand=${newOnHand}, Available=${newAvailable}, Change=${isPositive ? '+' : '-'}${movement.quantity}`);

        // Prevent negative stock
        if (newOnHand < 0) {
            console.error('Logic Error: Negative Stock Result');
            console.groupEnd();
            throw new Error(`Operación rechazada: El stock resultante sería negativo (${newOnHand}).`);
        }

        const levelData = {
            id: currentLevel?.id || crypto.randomUUID(), // Ensure UUID for new rows
            tenant_id,
            company_id, // Ensure company context is set on level
            warehouse_id: movement.warehouse_id,
            variant_id: movement.variant_id,
            quantity_on_hand: newOnHand,
            quantity_available: newAvailable,
            last_movement_date: new Date().toISOString()
        };

        console.log('5. Executing Stock Level Upsert:', levelData);

        const { error: levelError, data: upsertData } = await this.supabase.client
            .from('scm_stock_levels')
            .upsert(levelData, { onConflict: 'variant_id, warehouse_id, tenant_id' })
            .select()
            .single();

        if (levelError) {
            console.error('CRITICAL: Stock movement recorded but level update failed.', levelError);
            console.groupEnd();
            throw new Error(`CRITICAL SYSTEM ERROR: Stock consistency failed. ${levelError.message}`);
        }

        console.log('   Stock Level Updated Successfully:', upsertData);
        console.groupEnd();

        return insertedMovement as ScmStockMovement;
    }

    async getAllStockByWarehouse(warehouseId: string): Promise<ScmStockLevel[]> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();

        const { data, error } = await this.supabase.client
            .from('scm_stock_levels')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId)
            .eq('warehouse_id', warehouseId);

        if (error) {
            console.error('Error fetching warehouse stock:', error);
            return [];
        }
        return data as ScmStockLevel[];
    }

    async getMovementHistory(): Promise<ScmStockMovement[]> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();

        const { data, error } = await this.supabase.client
            .from('scm_stock_movements')
            .select('id, tenant_id, company_id, warehouse_id, variant_id, movement_type, quantity, movement_date, notes, reference_type, reference_id, created_by, created_at')
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching movement history:', error);
            return [];
        }

        return data as ScmStockMovement[];
    }
}
