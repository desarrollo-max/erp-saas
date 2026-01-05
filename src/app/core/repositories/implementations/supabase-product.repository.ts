import { Injectable, inject } from "@angular/core";
import { ScmProduct, ScmProductImage } from "@core/models/erp.types";
import { SupabaseService } from "@core/services/supabase.service";
import { ProductRepository } from "@core/repositories/product.repository";
import { SessionService } from "@core/services/session.service";

/**
 * @class SupabaseProductRepository
 * @description Repositorio basado en Supabase para la gestión de productos dentro del ERP.
 * Implementa la interfaz ProductRepository con soporte para multi-tenancy y filtrado por compañía.
 */
@Injectable({
    providedIn: 'root'
})
export class SupabaseProductRepository extends ProductRepository {
    private supabase = inject(SupabaseService);
    private session = inject(SessionService);

    /**
     * Obtiene el ID de la compañía activa desde el contexto de sesión.
     * @returns ID único de la compañía.
     * @throws Error si no hay una compañía activa en sesión.
     * @private
     */
    private getCompanyId(): string {
        const id = this.session.currentCompanyId();
        if (!id) throw new Error('No se ha detectado una compañía activa en la sesión.');
        return id;
    }

    /**
     * Crea un nuevo producto en la base de datos.
     * @param product Datos parciales del producto a crear.
     * @async
     */
    async create(product: Partial<ScmProduct>): Promise<void> {
        const tenant_id = this.session.currentTenantId();
        const company_id = this.getCompanyId();

        if (!tenant_id) throw new Error("ID de Tenant no disponible en la sesión.");

        const dataToInsert = {
            ...product,
            tenant_id,
            company_id
        };

        const { error } = await this.supabase.client
            .from('scm_products')
            .insert([dataToInsert]);
        if (error) {
            throw new Error(`Error al crear el producto: ${error.message}`);
        }
    }

    /**
     * Crea o actualiza múltiples productos en lote.
     * @param products Lista de productos a procesar.
     * @param updateIfExists Indica si se debe actualizar el registro si el SKU ya existe (Upsert).
     * @returns Estadísticas de productos añadidos, actualizados y fallidos.
     * @async
     */
    async createBulk(products: Partial<ScmProduct>[], updateIfExists: boolean = false): Promise<{ added: number; updated: number; failed: number; errors: any[] }> {
        let added = 0;
        let updated = 0;
        let failed = 0;
        const errors: string[] = [];

        const tenant_id = this.session.currentTenantId();
        const company_id = this.getCompanyId();

        if (!tenant_id) throw new Error("ID de Tenant no disponible en la sesión.");

        for (const product of products) {
            try {
                const productWithContext = {
                    ...product,
                    tenant_id,
                    company_id
                };

                if (updateIfExists) {
                    const { data, error } = await this.supabase.client
                        .from('scm_products')
                        .upsert(productWithContext, { onConflict: 'tenant_id, sku', ignoreDuplicates: false })
                        .select('created_at, updated_at')
                        .single();

                    if (error) throw error;

                    if (data) {
                        const createdAt = new Date(data.created_at).getTime();
                        const updatedAt = new Date(data.updated_at).getTime();

                        // Determinamos si es nuevo comparando fechas de creación y actualización (margen < 100ms)
                        if (Math.abs(updatedAt - createdAt) < 100) {
                            added++;
                        } else {
                            updated++;
                        }
                    }
                } else {
                    const { error } = await this.supabase.client
                        .from('scm_products')
                        .insert(productWithContext);

                    if (error) throw error;
                    added++;
                }
            } catch (err: any) {
                failed++;
                let errorMessage = err.message || 'Error desconocido';

                // Mapeo detallado de códigos de error de base de datos
                if (err.code === '23503') {
                    errorMessage = 'Violación de clave externa: La categoría o unidad no existe.';
                } else if (err.code === '23505') {
                    errorMessage = 'Violación de restricción: Producto duplicado (SKU ya existe).';
                }

                errors.push(`SKU ${product.sku}: ${errorMessage}`);
            }
        }

        return { added, updated, failed, errors };
    }

    /**
     * Recupera todos los productos asociados al tenant y compañía activa.
     * Incluye desgloses de variantes y niveles de stock por almacén.
     * @param tenantId ID único del tenant.
     * @returns Lista completa de productos.
     * @async
     */
    async getAll(tenantId: string): Promise<ScmProduct[]> {
        const company_id = this.getCompanyId();

        const { data, error } = await this.supabase.client
            .from('scm_products')
            .select(`
                *,
                variants:scm_product_variants(
                    id,
                    attribute_value,
                    stock_levels:scm_stock_levels(
                        quantity_on_hand,
                        warehouse:scm_warehouses(name)
                    )
                )
            `)
            .eq('tenant_id', tenantId)
            .eq('company_id', company_id);

        if (error) {
            throw new Error(`Error al obtener los productos: ${error.message}`);
        }
        return data as ScmProduct[];
    }

    /**
     * Obtiene una lista paginada de productos con soporte para búsquedas y filtros de estado.
     * @param tenantId ID único del tenant.
     * @param page Número de página solicitado.
     * @param pageSize Cantidad de registros por página.
     * @param filters Criterios de búsqueda (nombre, sku, estado).
     * @returns Objeto con los datos de la página y el conteo total.
     * @async
     */
    async getPaginated(tenantId: string, page: number, pageSize: number, filters?: any): Promise<{ data: ScmProduct[], totalCount: number }> {
        const company_id = this.getCompanyId();
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = this.supabase.client
            .from('scm_products')
            .select(`
                *,
                variants:scm_product_variants(
                    id,
                    attribute_value,
                    stock_levels:scm_stock_levels(
                        quantity_on_hand,
                        warehouse:scm_warehouses(name)
                    )
                )
            `, { count: 'exact' })
            .eq('tenant_id', tenantId)
            .eq('company_id', company_id);

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
        }

        if (filters?.status && filters.status !== 'all') {
            query = query.eq('is_active', filters.status === 'active');
        }

        const { data, error, count } = await query
            .order('name', { ascending: true })
            .range(from, to);

        if (error) {
            throw new Error(`Error al obtener productos paginados: ${error.message}`);
        }

        return {
            data: data as ScmProduct[],
            totalCount: count || 0
        };
    }

    /**
     * Obtiene una versión simplificada de los productos (solo campos esenciales).
     * Ideal para su uso en selectores y buscadores rápidos.
     * @param tenantId ID único del tenant.
     * @returns Lista parcial de productos activos.
     * @async
     */
    async getLightweightList(tenantId: string): Promise<Partial<ScmProduct>[]> {
        const company_id = this.getCompanyId();

        const { data, error } = await this.supabase.client
            .from('scm_products')
            .select('id, name, sku, cost_price, sale_price, is_active, size_config')
            .eq('tenant_id', tenantId)
            .eq('company_id', company_id)
            .eq('is_active', true)
            .order('name');

        if (error) {
            throw new Error(`Error al obtener lista simplificada de productos: ${error.message}`);
        }
        return data as Partial<ScmProduct>[];
    }

    /**
     * Recupera un producto específico por su ID único.
     * @param id ID del producto.
     * @returns El producto encontrado o null si no existe.
     * @async
     */
    async getById(id: string): Promise<ScmProduct | null> {
        const company_id = this.getCompanyId();

        const { data, error } = await this.supabase.client
            .from('scm_products')
            .select('*')
            .eq('id', id)
            .eq('company_id', company_id)
            .single();

        if (error) {
            return null;
        }
        return data as ScmProduct;
    }

    /**
     * Actualiza los datos de un producto existente.
     * @param id ID único del producto.
     * @param product Conjunto de datos parciales a actualizar.
     * @async
     */
    async update(id: string, product: Partial<ScmProduct>): Promise<void> {
        const company_id = this.getCompanyId();

        const { error } = await this.supabase.client
            .from('scm_products')
            .update(product)
            .eq('id', id)
            .eq('company_id', company_id);

        if (error) {
            throw new Error(`Error al actualizar el producto: ${error.message}`);
        }
    }

    /**
     * Elimina un producto de la base de datos de forma permanente.
     * @param id ID único del producto.
     * @async
     */
    async delete(id: string): Promise<void> {
        const company_id = this.getCompanyId();

        const { error } = await this.supabase.client
            .from('scm_products')
            .delete()
            .eq('id', id)
            .eq('company_id', company_id);

        if (error) {
            throw new Error(`Error al eliminar el producto: ${error.message}`);
        }
    }

    // ==========================================
    // Image Management Implementation
    // ==========================================

    /**
     * Obtiene todas las imágenes asociadas a un producto.
     * @param productId ID único del producto.
     * @returns Lista de imágenes del producto.
     * @async
     */
    async getImages(productId: string): Promise<ScmProductImage[]> {
        const { data, error } = await this.supabase.client
            .from('scm_product_media')
            .select('*')
            .eq('product_id', productId)
            .order('sort_order', { ascending: true });

        if (error) {
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

    /**
     * Obtiene las categorías de productos disponibles para el tenant.
     * @param tenantId ID único del tenant.
     * @returns Lista de categorías.
     * @async
     */
    async getCategories(tenantId: string): Promise<any[]> {
        const { data, error } = await this.supabase.client
            .from('scm_product_categories')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('name');

        if (error) {
            return [];
        }
        return data || [];
    }

    /**
     * Recupera las variantes registradas para un producto específico.
     * @param productId ID único del producto.
     * @returns Lista de variantes.
     * @async
     */
    async getVariantsByProductId(productId: string): Promise<any[]> {
        const { data, error } = await this.supabase.client
            .from('scm_product_variants')
            .select('*')
            .eq('product_id', productId)
            .order('attribute_value');

        if (error) {
            return [];
        }
        return data || [];
    }

    /**
     * Genera variantes hipotéticas basadas en la configuración de tallas del producto.
     * No persiste los datos, solo retorna la estructura para previsualización.
     * @param productId ID del producto.
     * @param config Configuración de tallas (rango numérico o lista explícita).
     * @returns Lista de variantes generadas.
     * @async
     */
    async generateVariants(productId: string, config: any): Promise<any[]> {
        const variants: any[] = [];
        const tenant_id = this.session.currentTenantId();

        if (!config || !tenant_id) return [];

        // CASO 1: Rango Numérico (Calzado, etc.)
        if (config.min && config.max) {
            const min = parseFloat(config.min);
            const max = parseFloat(config.max);
            const step = parseFloat(config.step) || 1;

            let currentSize = min;
            while (currentSize <= max) {
                const sizeLabel = currentSize.toFixed(1).replace('.0', '');

                variants.push({
                    id: crypto.randomUUID(),
                    product_id: productId,
                    tenant_id: tenant_id,
                    company_id: this.getCompanyId(),
                    sku: `${productId}-${sizeLabel.replace('.', '')}`,
                    attribute_name: 'Size',
                    attribute_value: `${sizeLabel} MX`,
                    is_active: true
                });

                currentSize += step;
            }
        }
        // CASO 2: Lista Explícita (S, M, L, XL, etc.)
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

    /**
     * Crea una variante individual. Si ya existe, se actualiza (Upsert).
     * @param variant Datos de la variante a crear.
     * @returns La variante creada o actualizada.
     * @async
     */
    async createVariant(variant: any): Promise<any> {
        const company_id = this.getCompanyId();

        const variantWithContext = {
            ...variant,
            company_id,
            variant_sku: variant.variant_sku || variant.sku || `${variant.product_id}-${Math.floor(Math.random() * 1000)}`
        };

        const { data, error } = await this.supabase.client
            .from('scm_product_variants')
            .upsert(variantWithContext, { onConflict: 'sku, tenant_id' })
            .select()
            .single();

        if (error) {
            throw new Error(`Error al crear la variante: ${error.message}`);
        }
        return data;
    }

    /**
     * Recupera todas las variantes registradas para el tenant y compañía actual.
     * @param tenantId ID único del tenant.
     * @returns Lista de todas las variantes.
     * @async
     */
    async getAllVariants(tenantId: string): Promise<any[]> {
        const company_id = this.getCompanyId();

        const { data, error } = await this.supabase.client
            .from('scm_product_variants')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('company_id', company_id);

        if (error) {
            return [];
        }
        return data || [];
    }
    /**
     * Sincroniza y genera variantes faltantes para todos los productos con configuración de tallas.
     * @returns Cantidad total de variantes generadas.
     * @async
     */
    async syncMissingVariants(): Promise<number> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();

        const { data: products } = await this.supabase.client
            .from('scm_products')
            .select('id, sku, size_config')
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId)
            .not('size_config', 'is', null);

        if (!products || products.length === 0) return 0;

        let totalGenerated = 0;
        const allNewVariants: any[] = [];

        for (const p of products) {
            const config = p.size_config as any;
            const generated = await this.generateVariants(p.id, config);

            if (generated.length > 0) {
                generated.forEach(g => {
                    // Generación robusta de SKU para la variante
                    if (p.sku) {
                        const sizeLabel = g.attribute_value.replace(' MX', '').replace('.', '');
                        g.sku = `${p.sku}-${sizeLabel}`;
                        g.variant_sku = g.sku;
                    }
                    allNewVariants.push(g);
                });
            }
        }

        // Persistencia en lotes de 50 para evitar exceder límites de parámetros
        const chunkSize = 50;
        for (let i = 0; i < allNewVariants.length; i += chunkSize) {
            const chunk = allNewVariants.slice(i, i + chunkSize);
            await this.saveVariants(chunk);
            totalGenerated += chunk.length;
        }

        return totalGenerated;
    }
}
