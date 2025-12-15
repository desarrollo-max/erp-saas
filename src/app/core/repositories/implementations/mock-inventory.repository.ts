import { Injectable } from '@angular/core';
import { InventoryRepository } from '../inventory.repository';
import { ScmStockLevel, ScmStockMovement, ScmWarehouse } from '../../models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class MockInventoryRepository extends InventoryRepository {

    // Mock Data
    private warehouses: ScmWarehouse[] = [
        {
            id: 'wh1',
            tenant_id: 't1',
            company_id: 'c1',
            code: 'WH-001',
            name: 'Almacén Principal',
            address: 'Calle Industria 123',
            is_active: true,
            is_default: true,
            created_at: new Date().toISOString()
        },
        {
            id: 'wh2',
            tenant_id: 't1',
            company_id: 'c1',
            code: 'WH-002',
            name: 'Almacén Secundario',
            address: 'Av. Logística 55',
            is_active: true,
            is_default: false,
            created_at: new Date().toISOString()
        }
    ];

    private stockLevels: ScmStockLevel[] = [
        {
            id: 'sl1',
            tenant_id: 't1',
            variant_id: 'raw_leather_01', // Example Raw Material
            warehouse_id: 'wh1',
            quantity_on_hand: 500,
            quantity_available: 450,
            quantity_reserved: 50,
            quantity_in_transit: 0,
            last_counted_at: new Date().toISOString(),
            last_movement_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
        },
        {
            id: 'sl2',
            tenant_id: 't1',
            variant_id: 'raw_thread_01',
            warehouse_id: 'wh1',
            quantity_on_hand: 1000,
            quantity_available: 1000,
            quantity_reserved: 0,
            quantity_in_transit: 0,
            last_counted_at: new Date().toISOString(),
            last_movement_date: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    private movements: ScmStockMovement[] = [];

    async getStockLevel(variantId: string, warehouseId: string): Promise<ScmStockLevel | null> {
        return this.stockLevels.find(sl => sl.variant_id === variantId && sl.warehouse_id === warehouseId) || null;
    }

    async getAllStockLevels(tenantId: string): Promise<ScmStockLevel[]> {
        return this.stockLevels.filter(sl => sl.tenant_id === tenantId);
    }

    async createMovement(movement: Partial<ScmStockMovement>): Promise<void> {
        this.movements.push({
            id: Math.random().toString(36).substring(7),
            tenant_id: movement.tenant_id || 't1',
            variant_id: movement.variant_id!,
            warehouse_id: movement.warehouse_id!,
            movement_type: movement.movement_type || 'ADJUSTMENT',
            quantity: movement.quantity || 0,
            reference_id: movement.reference_id || null,
            movement_date: new Date().toISOString(),
            notes: movement.notes || null,
            created_by: 'system',
            created_at: new Date().toISOString()
        } as ScmStockMovement);

        // Update Stock Levels
        // In a real DB this would be transactional.
        let level = this.stockLevels.find(sl => sl.variant_id === movement.variant_id && sl.warehouse_id === movement.warehouse_id);

        if (!level) {
            // Create stock level if not exists
            level = {
                id: 'sl-' + Date.now(),
                tenant_id: movement.tenant_id || 't1',
                variant_id: movement.variant_id!,
                warehouse_id: movement.warehouse_id!,
                quantity_on_hand: 0,
                quantity_available: 0,
                quantity_reserved: 0,
                quantity_in_transit: 0,
                last_counted_at: null,
                last_movement_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            this.stockLevels.push(level);
        }

        if (movement.quantity && level) {
            // Simplified logic: IN increases, OUT decreases
            // PRODUCTION_OUTPUT also increases
            if (['PURCHASE_RECEIPT', 'RETURN_IN', 'ADJUSTMENT_IN', 'PRODUCTION_OUTPUT'].includes(movement.movement_type || '')) {
                level.quantity_on_hand += movement.quantity;
                level.quantity_available += movement.quantity;
            } else {
                level.quantity_on_hand -= movement.quantity;
                level.quantity_available -= movement.quantity;
            }
        }
    }

    async getWarehouses(tenantId: string): Promise<ScmWarehouse[]> {
        return this.warehouses;
    }

    async createWarehouse(warehouse: Partial<ScmWarehouse>): Promise<ScmWarehouse> {
        const newWh = {
            ...warehouse,
            id: 'wh' + Date.now(),
            tenant_id: 't1', // Mock
            created_at: new Date().toISOString()
        } as ScmWarehouse;
        this.warehouses.push(newWh);
        return newWh;
    }

    async updateWarehouse(id: string, warehouse: Partial<ScmWarehouse>): Promise<void> {
        const index = this.warehouses.findIndex(w => w.id === id);
        if (index !== -1) {
            this.warehouses[index] = { ...this.warehouses[index], ...warehouse };
        }
    }

    async deleteWarehouse(id: string): Promise<void> {
        this.warehouses = this.warehouses.filter(w => w.id !== id);
    }
}
