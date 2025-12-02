import { ScmProduct } from "../models/erp.types";

export abstract class ProductRepository {
    abstract create(product: Partial<ScmProduct>): Promise<void>;
    abstract createBulk(products: Partial<ScmProduct>[], updateIfExists?: boolean): Promise<{ added: number; updated: number; failed: number; errors: any[] }>;
    abstract getAll(tenantId: string): Promise<ScmProduct[]>;
}
