import { Warehouse, StockOnHand } from '../models/erp.types';

export abstract class WarehouseRepository {
    abstract getAll(tenantId: string): Promise<Warehouse[]>;
    abstract getById(id: string): Promise<Warehouse | null>;
    abstract create(warehouse: Partial<Warehouse>): Promise<Warehouse>;
    abstract update(id: string, warehouse: Partial<Warehouse>): Promise<Warehouse>;
    abstract delete(id: string): Promise<void>;

    /**
     * Retrieves the calculated stock on hand for a tenant.
     * Optionally filters by a specific product.
     */
    abstract getStockOnHand(tenantId: string, productId?: string): Promise<StockOnHand[]>;
}
