import { Injectable, inject } from "@angular/core";
import { ScmProduct } from "../../models/erp.types";
import { SupabaseService } from "../../services/supabase.service";
import { ProductRepository } from "../product.repository";

@Injectable({
    providedIn: 'root'
})
export class SupabaseProductRepository extends ProductRepository {
    private supabase = inject(SupabaseService);

    async create(product: Partial<ScmProduct>): Promise<void> {
        const { error } = await this.supabase.insert('scm_products', [product]);
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
                    const { data, error } = await this.supabase.client
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
                    const { error } = await this.supabase.client
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
}
