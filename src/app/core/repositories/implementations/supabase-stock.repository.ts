import { Injectable, inject } from "@angular/core";
import { StockRepository } from "../stock.repository";
import { ScmStockLevel, ScmStockMovement } from "@core/models/erp.types";
import { SupabaseService } from "@core/services/supabase.service";
import { SessionService } from "@core/services/session.service";

/**
 * @class SupabaseStockRepository
 * @description Repositorio para la gestión de existencias y movimientos de almacén.
 * Maneja la lógica transaccional de entrada/salida de stock y la integridad de los niveles de inventario.
 */
@Injectable({
    providedIn: 'root'
})
export class SupabaseStockRepository extends StockRepository {
    private supabase = inject(SupabaseService);
    private session = inject(SessionService);

    /**
     * Obtiene el ID de la compañía activa garantizando el aislamiento de datos.
     * @returns ID único de la compañía seleccionada.
     * @throws Error si no hay contexto de compañía.
     * @private
     */
    private getCompanyId(): string {
        const id = this.session.currentCompanyId();
        if (!id) throw new Error('No se ha detectado una compañía activa en la sesión.');
        return id;
    }

    /**
     * Recupera el nivel de stock actual para una variante específica en un almacén determinado.
     * @param variantId ID de la variante del producto.
     * @param warehouseId ID del almacén.
     * @returns Objeto ScmStockLevel o null si no existe registro (stock 0).
     * @async
     */
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
            // El código PGRST116 indica que no hay filas, lo cual es un estado válido (sin stock inicial)
            return null;
        }

        return data as ScmStockLevel;
    }

    /**
     * Calcula la suma agregada de stock disponible para una variante en todos los almacenes de la compañía.
     * @param variantId ID único de la variante.
     * @returns Cantidad total disponible.
     * @async
     */
    async getAggregatedStockByVariant(variantId: string): Promise<number> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();

        const { data, error } = await this.supabase.client
            .from('scm_stock_levels')
            .select('quantity_on_hand')
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId)
            .eq('variant_id', variantId);

        if (error) {
            return 0;
        }

        if (!data || data.length === 0) return 0;

        return data.reduce((acc, curr) => acc + (curr.quantity_on_hand || 0), 0);
    }

    async createMovement(movement: Partial<ScmStockMovement>): Promise<void> {
        await this.createStockMovement(movement);
    }

    /**
     * Registra un nuevo movimiento de stock y actualiza automáticamente los niveles de inventario.
     * Esta función actúa como una "pseudo-transacción" asegurando que el stock no sea negativo.
     * @param movement Datos del movimiento (origen, destino, cantidad, tipo).
     * @returns El objeto de movimiento persistido.
     * @async
     */
    async createStockMovement(movement: Partial<ScmStockMovement>): Promise<ScmStockMovement> {
        const tenant_id = this.session.currentTenantId();
        const company_id = this.getCompanyId();

        // Validación inicial de datos obligatorios
        if (!movement.variant_id || !movement.warehouse_id || !movement.quantity) {
            throw new Error('Datos incompletos para procesar el movimiento de inventario.');
        }

        const userId = this.session.currentUserId();
        if (!userId) {
            throw new Error('Operación denegada: Se requiere un usuario autenticado para registrar movimientos.');
        }

        // 1. Preparación del registro de movimiento para auditoría
        const dataToInsert = {
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
        };

        const { data: insertedMovement, error: moveError } = await this.supabase.client
            .from('scm_stock_movements')
            .insert(dataToInsert)
            .select()
            .single();

        if (moveError) {
            throw new Error(`Error al registrar el movimiento en la base de datos: ${moveError.message}`);
        }

        // 2. Consulta de niveles de stock actuales para el ajuste
        const { data: currentLevel, error: fetchError } = await this.supabase.client
            .from('scm_stock_levels')
            .select('*')
            .eq('tenant_id', tenant_id)
            .eq('company_id', company_id)
            .eq('warehouse_id', movement.warehouse_id!)
            .eq('variant_id', movement.variant_id!)
            .maybeSingle();

        if (fetchError) {
            // Log de error interno pero intentamos continuar con lo recolectado
        }

        let newOnHand = 0;
        let newAvailable = 0;

        if (currentLevel) {
            newOnHand = currentLevel.quantity_on_hand;
            newAvailable = currentLevel.quantity_available;
        }

        // 3. Lógica de incremento o decremento según el tipo de movimiento
        const isPositive = movement.movement_type === 'IN' ||
            movement.movement_type === 'PRODUCTION_OUTPUT' ||
            (movement.movement_type === 'ADJUSTMENT' && movement.quantity! > 0);

        if (isPositive) {
            newOnHand += movement.quantity!;
            newAvailable += movement.quantity!;
        } else {
            newOnHand -= movement.quantity!;
            newAvailable -= movement.quantity!;
        }

        // Mantenimiento de integridad: El stock no puede ser negativo en el sistema físico
        if (newOnHand < 0) {
            throw new Error(`Operación rechazada: Stock insuficiente. El resultado sería negativo (${newOnHand}).`);
        }

        // 4. Actualización atómica del nivel de stock (Sincronización de existencia real)
        const levelData = {
            id: currentLevel?.id || crypto.randomUUID(),
            tenant_id,
            company_id,
            warehouse_id: movement.warehouse_id,
            variant_id: movement.variant_id,
            quantity_on_hand: newOnHand,
            quantity_available: newAvailable,
            last_movement_date: new Date().toISOString()
        };

        const { error: levelError } = await this.supabase.client
            .from('scm_stock_levels')
            .upsert(levelData, { onConflict: 'variant_id, warehouse_id, tenant_id, company_id' });

        if (levelError) {
            throw new Error(`ERROR CRÍTICO: Movimiento registrado pero fallo en actualización de niveles. ${levelError.message}`);
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

    /**
     * Obtiene el historial completo de movimientos de stock para la compañía actual.
     * Ordenados por fecha de creación descendente.
     * @returns Lista de movimientos de stock.
     * @async
     */
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
            return [];
        }

        return data as ScmStockMovement[];
    }

    /**
     * Cuenta cuántos productos tienen un nivel de stock crítico (por debajo o igual al límite).
     * @param limit Cantidad máxima para considerar un stock como crítico.
     * @returns Promesa con el conteo de registros críticos.
     */
    async getCriticalStockCount(limit: number): Promise<number> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();

        const { count, error } = await this.supabase.client
            .from('scm_stock_levels')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId)
            .lte('quantity_on_hand', limit);

        if (error) {
            console.error('Error counting critical stock:', error);
            return 0;
        }

        return count || 0;
    }
}
