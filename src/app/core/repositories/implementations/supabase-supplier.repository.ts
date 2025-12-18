import { Injectable, inject } from '@angular/core';
import { SupplierRepository } from '../supplier.repository';
import { SupabaseService } from '@core/services/supabase.service';
import { SessionService } from '@core/services/session.service';
import { Supplier } from '@core/models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class SupabaseSupplierRepository extends SupplierRepository {
    private supabase = inject(SupabaseService);
    private session = inject(SessionService);

    private getCompanyId(): string {
        return this.session.currentCompany()?.id || '';
    }

    async getAll(tenantId: string): Promise<Supplier[]> {
        const companyId = this.getCompanyId();
        if (!tenantId || !companyId) return [];

        const { data, error } = await this.supabase.client
            .from('scm_suppliers')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId)
            .eq('is_active', true)
            .order('name');

        if (error) throw error;
        return data as Supplier[];
    }

    async getById(id: string): Promise<Supplier | null> {
        const { data, error } = await this.supabase.client
            .from('scm_suppliers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data as Supplier;
    }

    async create(supplier: Partial<Supplier>): Promise<Supplier> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();

        const { data, error } = await this.supabase.client
            .from('scm_suppliers')
            .insert({
                ...supplier,
                tenant_id: tenantId,
                company_id: companyId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data as Supplier;
    }

    async update(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
        const { data, error } = await this.supabase.client
            .from('scm_suppliers')
            .update({
                ...supplier,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Supplier;
    }

    async delete(id: string): Promise<void> {
        // Soft delete usually, but here calling update to set active=false is better pattern if delete strictly means remove.
        // User asked for CRUD, often delete means soft delete in ERPs.
        // Spec doesn't say. I will assume soft delete via update is better, but the method says 'delete'. 
        // I will implement standard delete for now (or soft delete toggling is_active if that's preferred, but let's stick to simple delete or soft delete).
        // Actually, looking at other repos (if I could) would help.
        // `WarehouseRepository` usually does soft delete.
        // Let's do update is_active = false.
        const { error } = await this.supabase.client
            .from('scm_suppliers')
            .update({ is_active: false })
            .eq('id', id);

        if (error) throw error;
    }
}
