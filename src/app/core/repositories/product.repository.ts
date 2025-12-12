import { ScmProduct, ScmProductImage } from "@core/models/erp.types";

export abstract class ProductRepository {
    abstract create(product: Partial<ScmProduct>): Promise<void>;
    abstract createBulk(products: Partial<ScmProduct>[], updateIfExists?: boolean): Promise<{ added: number; updated: number; failed: number; errors: any[] }>;
    abstract getAll(tenantId: string): Promise<ScmProduct[]>;
    abstract getById(id: string): Promise<ScmProduct | null>;
    abstract update(id: string, product: Partial<ScmProduct>): Promise<void>;
    abstract delete(id: string): Promise<void>;

    // Image Management
    abstract getImages(productId: string): Promise<ScmProductImage[]>;
    abstract addImage(image: Partial<ScmProductImage>): Promise<ScmProductImage>;
    abstract deleteImage(id: string): Promise<void>;

    // Categories
    abstract getCategories(tenantId: string): Promise<any[]>;
}
