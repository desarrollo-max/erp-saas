import { Injectable, inject } from "@angular/core";
import { ScmProduct, ScmProductImage } from "@core/models/erp.types";
import { SupabaseService } from "@core/services/supabase.service";
import { ProductRepository } from "@core/repositories/product.repository";

@Injectable({
    providedIn: 'root'
})
export class SupabaseProductRepository extends ProductRepository {
    private supabase = inject(SupabaseService);

    async create(product: Partial<ScmProduct>): Promise<void> {
        const { error } = await this.supabase.adminClient
            .from('scm_products')
            .insert([product]);
        if (error) {
            throw new Error(`Error creating product: ${error.message}`);
        }
    }

    async createBulk(products: Partial<ScmProduct>[], updateIfExists: boolean = false): Promise<{ added: number; updated: number; failed: number; errors: any[] }> {
        let added = 0;
        let updated = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const product of products) {
            try {
                if (updateIfExists) {
                    // Upsert individual
                    const { data, error } = await this.supabase.adminClient
                        .from('scm_products')
                        .upsert(product, { onConflict: 'tenant_id, sku', ignoreDuplicates: false })
                        .select('created_at, updated_at')
                        .single();

                    if (error) throw error;

                    if (data) {
                        const createdAt = new Date(data.created_at).getTime();
                        const updatedAt = new Date(data.updated_at).getTime();

                        // Si created_at es igual a updated_at (margen < 100ms), es nuevo.
                        if (Math.abs(updatedAt - createdAt) < 100) {
                            added++;
                        } else {
                            updated++;
                        }
                    }
                } else {
                    // Insert individual
                    const { error } = await this.supabase.adminClient
                        .from('scm_products')
                        .insert(product);

                    if (error) throw error;
                    added++;
                }
            } catch (err: any) {
                failed++;
                let errorMessage = err.message || 'Error desconocido';

                // Manejo de errores específicos de Postgres
                if (err.code === '23503') {
                    errorMessage = 'La categoría o unidad no existe';
                } else if (err.code === '23505') {
                    errorMessage = 'Producto duplicado (SKU ya existe)';
                }

                errors.push(`SKU ${product.sku}: ${errorMessage}`);
            }
        }

        return { added, updated, failed, errors };
    }

    async getAll(tenantId: string): Promise<ScmProduct[]> {
        const { data, error } = await this.supabase.getTable<ScmProduct>('scm_products', tenantId);
        if (error) {
            throw new Error(`Error fetching products: ${error.message}`);
        }
        return data || [];
    }

    async getById(id: string): Promise<ScmProduct | null> {
        const { data, error } = await this.supabase.client
            .from('scm_products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching product by ID:', error);
            return null;
        }
        return data as ScmProduct;
    }

    async update(id: string, product: Partial<ScmProduct>): Promise<void> {
        const { error } = await this.supabase.adminClient
            .from('scm_products')
            .update(product)
            .eq('id', id);

        if (error) {
            throw new Error(`Error updating product: ${error.message}`);
        }
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.supabase.adminClient
            .from('scm_products')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Error deleting product: ${error.message}`);
        }
    }

    // ==========================================
    // Image Management Implementation
    // ==========================================

    async getImages(productId: string): Promise<ScmProductImage[]> {
        const { data, error } = await this.supabase.adminClient
            .from('scm_product_media')
            .select('*')
            .eq('product_id', productId)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('Error fetching product images:', error);
            return [];
        }
        return data as ScmProductImage[];
    }

    async addImage(image: Partial<ScmProductImage>): Promise<ScmProductImage> {
        const { data, error } = await this.supabase.adminClient
            .from('scm_product_media')
            .insert(image)
            .select()
            .single();

        if (error) {
            throw new Error(`Error adding image: ${error.message}`);
        }
        return data as ScmProductImage;
    }

    async deleteImage(id: string): Promise<void> {
        const { error } = await this.supabase.adminClient
            .from('scm_product_media')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Error deleting image: ${error.message}`);
        }
    }

    async getCategories(tenantId: string): Promise<any[]> {
        const { data, error } = await this.supabase.client
            .from('scm_product_categories')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name');

        if (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
        return data || [];
    }
}
