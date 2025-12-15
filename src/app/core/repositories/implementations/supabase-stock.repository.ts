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
        const tenant_id = this.session.currentTenantId();
        const company_id = this.getCompanyId(); // Context validation

        // 1. Validate
        if (!movement.variant_id || !movement.warehouse_id || !movement.quantity) {
            throw new Error('Datos incompletos para el movimiento de inventario.');
        }

        // 2. Prepare Data
        const userId = this.session.currentUserId();
        
        if (!userId) {
            throw new Error('Usuario no identificado. No se puede registrar el movimiento de stock sin un usuario autenticado válido.');
        }

        const dataToInsert = {
            ...movement,
            tenant_id,
            company_id,
            created_by: userId
        };

        // 3. Insert Movement
        const { data: insertedMovement, error: moveError } = await this.supabase.client
            .from('scm_stock_movements')
            .insert(dataToInsert)
            .select()
            .single();

        if (moveError) {
            throw new Error(`Error registrando movimiento: ${moveError.message}`);
        }

        // 4. Update Stock Level (Atomic-like operation via Supabase Logic or Manual Upsert)
        // Since we don't have a specific stored procedure for this yet, we do read-modify-write or smart upsert.
        // But stock level math depends on 'quantity_on_hand' logic.

        // Fetch current level to be safe
        const { data: currentLevel } = await this.supabase.client
            .from('scm_stock_levels')
            .select('*')
            .eq('tenant_id', tenant_id)
            .eq('company_id', company_id) // Security Constraint: Strict Company Isolation
            .eq('warehouse_id', movement.warehouse_id!)
            .eq('variant_id', movement.variant_id!)
            .single();

        let newOnHand = 0;
        let newAvailable = 0;

        if (currentLevel) {
            newOnHand = currentLevel.quantity_on_hand;
            newAvailable = currentLevel.quantity_available;
        }

        // Apply Logic
        if (movement.movement_type === 'IN' || movement.movement_type === 'PRODUCTION_OUTPUT' || movement.movement_type === 'ADJUSTMENT' && movement.quantity > 0) {
            newOnHand += movement.quantity;
            newAvailable += movement.quantity;
        } else {
            // OUT, PRODUCTION_CONSUMPTION, TRANSFER (Source), ADJUSTMENT (Negative)
            newOnHand -= movement.quantity;
            newAvailable -= movement.quantity;
        }

        // Prevent negative stock
        if (newOnHand < 0) {
            throw new Error(`Operación rechazada: El stock resultante sería negativo (${newOnHand}).`);
        }

        const levelData = {
            id: currentLevel?.id || crypto.randomUUID(),
            tenant_id,
            company_id, // Ensure company context is set on level
            warehouse_id: movement.warehouse_id,
            variant_id: movement.variant_id,
            quantity_on_hand: newOnHand,
            quantity_available: newAvailable,
            last_movement_date: new Date().toISOString()
        };

        const { error: levelError } = await this.supabase.client
            .from('scm_stock_levels')
            .upsert(levelData, { onConflict: 'variant_id, warehouse_id, tenant_id' });

        if (levelError) {
            console.error('CRITICAL: Stock movement recorded but level update failed.', levelError);
            // In real world, we might want to rollback movement here.
        }

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
}
