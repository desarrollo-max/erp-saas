import { ScmStockLevel, ScmStockMovement, ScmWarehouse } from "../models/erp.types";

export abstract class InventoryRepository {
    abstract getStockLevel(productId: string, warehouseId: string): Promise<ScmStockLevel | null>;
    abstract getAllStockLevels(tenantId: string): Promise<ScmStockLevel[]>;
    abstract createMovement(movement: Partial<ScmStockMovement>): Promise<void>;

    // Warehouse Management
    abstract getWarehouses(tenantId: string): Promise<ScmWarehouse[]>;
    abstract createWarehouse(warehouse: Partial<ScmWarehouse>): Promise<ScmWarehouse>;
    abstract updateWarehouse(id: string, warehouse: Partial<ScmWarehouse>): Promise<void>;
    abstract deleteWarehouse(id: string): Promise<void>;
}
