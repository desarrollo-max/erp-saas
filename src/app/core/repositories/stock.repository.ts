import { ScmStockLevel, ScmStockMovement } from "@core/models/erp.types";

export abstract class StockRepository {
    abstract getStockByVariantAndWarehouse(variantId: string, warehouseId: string): Promise<ScmStockLevel | null>;
    abstract getAggregatedStockByVariant(variantId: string): Promise<number>;
    abstract createMovement(movement: Partial<ScmStockMovement>): Promise<void>;
    abstract createStockMovement(movement: Partial<ScmStockMovement>): Promise<ScmStockMovement>;

    // Also useful methods likely needed
    abstract getAllStockByWarehouse(warehouseId: string): Promise<ScmStockLevel[]>;
}
