import { Injectable, inject } from '@angular/core';
import { WarehouseRepository } from '../warehouse.repository';
import { SupabaseService } from '../../services/supabase.service';
import { SessionService } from '../../services/session.service';
import { Warehouse, StockOnHand } from '../../models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class SupabaseWarehouseRepository extends WarehouseRepository {
    private supabase = inject(SupabaseService);
    private session = inject(SessionService);
    private readonly TABLE_NAME = 'scm_warehouses';

    /**
     * Helper to retrieve the current Company ID from the Session context.
     * Guaranteed to return a value or throw if the architectural context is invalid.
     */
    private getCompanyId(): string {
        const companyId = this.session.currentCompanyId();
        if (!companyId) {
            throw new Error('Transaction Blocked: No active Company Context found in Session.');
        }
        return companyId;
    }

    async getAll(tenantId: string): Promise<Warehouse[]> {
        const companyId = this.getCompanyId();

        const { data, error } = await this.supabase.client
            .from(this.TABLE_NAME)
            .select('*')
            // Double Filter Verification: Tenant & Company
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId)
            .order('name');

        if (error) throw error;
        return data as Warehouse[];
    }

    async getById(id: string): Promise<Warehouse | null> {
        const companyId = this.getCompanyId();

        const { data, error } = await this.supabase.client
            .from(this.TABLE_NAME)
            .select('*')
            .eq('id', id)
            .eq('company_id', companyId)
            .single();

        if (error) return null;
        return data as Warehouse;
    }

    async create(warehouse: Partial<Warehouse>): Promise<Warehouse> {
        const tenantId = this.session.currentTenantId();
        if (!tenantId) throw new Error('Transaction Blocked: No session tenant found.');

        const companyId = this.getCompanyId();

        const warehouseData = {
            ...warehouse,
            tenant_id: tenantId,
            company_id: companyId,
            // Ensure boolean defaults
            is_active: warehouse.is_active ?? true,
            is_default: warehouse.is_default ?? false
        };

        // Remove empty id if present to allow DB to generate it
        if (!warehouseData.id) {
            delete warehouseData.id;
        }

        const { data, error } = await this.supabase.client
            .from(this.TABLE_NAME)
            .insert(warehouseData)
            .select()
            .single();

        if (error) throw error;
        return data as Warehouse;
    }

    async update(id: string, warehouse: Partial<Warehouse>): Promise<Warehouse> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();

        if (!tenantId) throw new Error('Transaction Blocked: No session tenant found.');

        const warehouseData = {
            ...warehouse,
            tenant_id: tenantId,
            company_id: companyId
        };
        // Safety: Do not allow ID updates
        delete warehouseData.id;

        const { data, error } = await this.supabase.client
            .from(this.TABLE_NAME)
            .update(warehouseData)
            .eq('id', id)
            .eq('company_id', companyId) // Security Constraint
            .select()
            .single();

        if (error) throw error;
        return data as Warehouse;
    }

    async delete(id: string): Promise<void> {
        const companyId = this.getCompanyId();

        const { error } = await this.supabase.client
            .from(this.TABLE_NAME)
            .delete()
            .eq('id', id)
            .eq('company_id', companyId); // Security Constraint

        if (error) throw error;
    }

    async getStockOnHand(tenantId: string, productId?: string): Promise<StockOnHand[]> {
        const companyId = this.getCompanyId();

        let query = this.supabase.client
            .from('scm_stock_levels')
            .select(`
        warehouse_id,
        quantity_on_hand,
        quantity_reserved,
        quantity_available,
        warehouses:scm_warehouses!inner(name, company_id),
        products:scm_products!inner(id, name, sku)
      `)
            .eq('tenant_id', tenantId)
            .eq('warehouses.company_id', companyId);

        if (productId) {
            query = query.eq('product_id', productId);
        }

        const { data, error } = await query;

        if (error) throw error;

        return (data as any[]).map(item => ({
            warehouse_id: item.warehouse_id,
            warehouse_name: item.warehouses?.name,
            product_id: item.products?.id,
            product_name: item.products?.name,
            product_sku: item.products?.sku,
            quantity_on_hand: item.quantity_on_hand,
            quantity_reserved: item.quantity_reserved,
            quantity_available: item.quantity_available
        }));
    }
    // Alias for getWarehouses to satisfy InventoryRepository interface if needed
    async getWarehouses(tenantId: string): Promise<Warehouse[]> {
        return this.getAll(tenantId);
    }
}
