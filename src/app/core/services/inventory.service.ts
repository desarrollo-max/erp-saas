import { Injectable, inject } from '@angular/core';
import { InventoryRepository } from '../repositories/inventory.repository';
import { ProductRepository } from '../repositories/product.repository'; // If needed for product details
import { ScmStockLevel, ScmStockMovement, ScmWarehouse } from '../models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class InventoryService {
    private repo = inject(InventoryRepository);

    // Warehouse Management
    async getWarehouses(tenantId: string): Promise<ScmWarehouse[]> {
        return this.repo.getWarehouses(tenantId);
    }

    async createWarehouse(warehouse: Partial<ScmWarehouse>): Promise<ScmWarehouse> {
        return this.repo.createWarehouse(warehouse);
    }

    async updateWarehouse(id: string, warehouse: Partial<ScmWarehouse>): Promise<void> {
        return this.repo.updateWarehouse(id, warehouse);
    }

    async deleteWarehouse(id: string): Promise<void> {
        return this.repo.deleteWarehouse(id);
    }

    // Stock Management
    async getStockLevel(productId: string, warehouseId: string): Promise<ScmStockLevel | null> {
        return this.repo.getStockLevel(productId, warehouseId);
    }

    async getAllStockLevels(tenantId: string): Promise<ScmStockLevel[]> {
        return this.repo.getAllStockLevels(tenantId);
    }

    async createMovement(movement: Partial<ScmStockMovement>): Promise<void> {
        return this.repo.createMovement(movement);
    }
}
