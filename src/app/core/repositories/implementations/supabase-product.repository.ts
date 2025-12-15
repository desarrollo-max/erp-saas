import { Injectable, inject } from "@angular/core";
import { ScmProduct, ScmProductImage } from "@core/models/erp.types";
import { SupabaseService } from "@core/services/supabase.service";
import { ProductRepository } from "@core/repositories/product.repository";
import { SessionService } from "@core/services/session.service";

@Injectable({
    providedIn: 'root'
})
export class SupabaseProductRepository extends ProductRepository {
    private supabase = inject(SupabaseService);
    private session = inject(SessionService);

    private getCompanyId(): string {
        const id = this.session.currentCompanyId();
        if (!id) throw new Error('No active Company Context found.');
        return id;
    }

    async create(product: Partial<ScmProduct>): Promise<void> {
        const tenant_id = this.session.currentTenantId();
        const company_id = this.getCompanyId();

        if (!tenant_id) throw new Error("No tenant_id");

        const dataToInsert = {
            ...product,
            tenant_id,
            company_id
        };

        const { error } = await this.supabase.client
            .from('scm_products')
            .insert([dataToInsert]);
        if (error) {
            throw new Error(`Error creating product: ${error.message}`);
        }
    }

    async createBulk(products: Partial<ScmProduct>[], updateIfExists: boolean = false): Promise<{ added: number; updated: number; failed: number; errors: any[] }> {
        let added = 0;
        let updated = 0;
        let failed = 0;
        const errors: string[] = [];

        const tenant_id = this.session.currentTenantId();
        const company_id = this.getCompanyId();

        if (!tenant_id) throw new Error("No tenant_id");

        for (const product of products) {
            try {
                const productWithContext = {
                    ...product,
                    tenant_id,
                    company_id
                };

                if (updateIfExists) {
                    // Upsert individual (removed client_id from flow)
                    const { data, error } = await this.supabase.client
                        .from('scm_products')
                        .upsert(productWithContext, { onConflict: 'tenant_id, sku', ignoreDuplicates: false })
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
                        .insert(productWithContext);

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
        const company_id = this.getCompanyId();

        // Double Context Filter (Tenant + Company only)
        const { data, error } = await this.supabase.client
            .from('scm_products')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('company_id', company_id);

        if (error) {
            throw new Error(`Error fetching products: ${error.message}`);
        }
        return data as ScmProduct[];
    }

    async getById(id: string): Promise<ScmProduct | null> {
        const company_id = this.getCompanyId();

        const { data, error } = await this.supabase.client
            .from('scm_products')
            .select('*')
            .eq('id', id)
            .eq('company_id', company_id)
            .single();

        if (error) {
            console.error('Error fetching product by ID:', error);
            return null;
        }
        return data as ScmProduct;
    }

    async update(id: string, product: Partial<ScmProduct>): Promise<void> {
        const company_id = this.getCompanyId();

        const { error } = await this.supabase.client
            .from('scm_products')
            .update(product)
            .eq('id', id)
            .eq('company_id', company_id);

        if (error) {
            throw new Error(`Error updating product: ${error.message}`);
        }
    }

    async delete(id: string): Promise<void> {
        const company_id = this.getCompanyId();

        const { error } = await this.supabase.client
            .from('scm_products')
            .delete()
            .eq('id', id)
            .eq('company_id', company_id);

        if (error) {
            throw new Error(`Error deleting product: ${error.message}`);
        }
    }

    // ==========================================
    // Image Management Implementation
    // ==========================================

    async getImages(productId: string): Promise<ScmProductImage[]> {
        const { data, error } = await this.supabase.client
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
        const { data, error } = await this.supabase.client
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
        const { error } = await this.supabase.client
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
    // ==========================================
    // Variants Management Implementation
    // ==========================================

    async getVariantsByProductId(productId: string): Promise<any[]> {
        const { data, error } = await this.supabase.client
            .from('scm_product_variants')
            .select('*')
            .eq('product_id', productId)
            .order('attribute_value');

        if (error) {
            console.error('Error fetching variants:', error);
            return [];
        }
        return data || [];
    }

    /**
     * Generates hypothetical variants based on configuration.
     * Does NOT save to DB directly, returns them for preview or batch saving.
     */
    async generateVariants(productId: string, config: any): Promise<any[]> {
        const variants: any[] = [];
        const tenant_id = this.session.currentTenantId();

        if (!config || !tenant_id) return [];

        // CASE 1: Numeric Range (Shoes, etc)
        if (config.min && config.max) {
            const min = parseFloat(config.min);
            const max = parseFloat(config.max);
            const step = parseFloat(config.step) || 1;

            let currentSize = min;
            while (currentSize <= max) {
                const sizeLabel = currentSize.toFixed(1).replace('.0', ''); // 25.0 -> 25, 25.5 -> 25.5

                variants.push({
                    id: crypto.randomUUID(), // Temp ID
                    product_id: productId,
                    tenant_id: tenant_id,
                    company_id: this.getCompanyId(),
                    sku: `${productId}-${sizeLabel.replace('.', '')}`, // Temp SKU Pattern
                    attribute_name: 'Size',
                    attribute_value: `${sizeLabel} MX`, // e.g., "25.5 MX"
                    is_active: true
                });

                currentSize += step;
            }
        }
        // CASE 2: Explicit List (S, M, L, XL)
        else if (Array.isArray(config.sizes)) {
            config.sizes.forEach((size: string) => {
                variants.push({
                    id: crypto.randomUUID(),
                    product_id: productId,
                    tenant_id: tenant_id,
                    company_id: this.getCompanyId(),
                    sku: `${productId}-${size}`,
                    attribute_name: 'Size',
                    attribute_value: size,
                    is_active: true
                });
            });
        }

        return variants;
    }

    async saveVariants(variants: any[]): Promise<void> {
        if (!variants || variants.length === 0) return;

        const company_id = this.getCompanyId();
        const variantsWithContext = variants.map(v => ({
            ...v,
            company_id,
            variant_sku: v.sku
        }));

        // Clean up data before insert if needed, e.g. remove undefined fields to let DB defaults work
        const { error } = await this.supabase.client
            .from('scm_product_variants')
            .upsert(variantsWithContext, { onConflict: 'sku, tenant_id' });

        if (error) {
            throw new Error(`Error saving variants: ${error.message}`);
        }
    }

    async createVariant(variant: any): Promise<any> {
        const company_id = this.getCompanyId();

        // DEBUG: Log the variant being created to diagnose null values
        console.log('Creating Variant Payload:', variant);

        const variantWithContext = {
            ...variant,
            company_id,
            // Priority: Existing variant_sku -> mapped from sku -> fallback to generated
            variant_sku: variant.variant_sku || variant.sku || `${variant.product_id}-${Math.floor(Math.random() * 1000)}`
        };

        const { data, error } = await this.supabase.client
            .from('scm_product_variants')
            .upsert(variantWithContext, { onConflict: 'sku, tenant_id' })
            .select()
            .single();

        if (error) {
            throw new Error(`Error creating variant: ${error.message}`);
        }
        return data;
    }
}
