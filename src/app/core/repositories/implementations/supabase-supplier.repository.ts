import { Injectable, inject } from '@angular/core';
import { SupplierRepository } from '../supplier.repository';
import { SupabaseService } from '@core/services/supabase.service';
import { SessionService } from '@core/services/session.service';
import { Supplier } from '@core/models/erp.types';

/**
 * @class SupabaseSupplierRepository
 * @description Repositorio para la gestión de proveedores en el módulo de cadena de suministro.
 * Implementa las operaciones CRUD básicas con soporte para aislamiento por compañía y tenant.
 */
@Injectable({
    providedIn: 'root'
})
export class SupabaseSupplierRepository extends SupplierRepository {
    private supabase = inject(SupabaseService);
    private session = inject(SessionService);

    /**
     * Obtiene el ID de la compañía activa para garantizar el filtrado correcto de datos.
     * @returns ID de la compañía.
     * @throws Error si no hay una compañía activa en la sesión.
     * @private
     */
    private getCompanyId(): string {
        const id = this.session.currentCompanyId();
        if (!id) throw new Error('No se ha detectado una compañía activa en la sesión.');
        return id;
    }

    /**
     * Recupera todos los proveedores activos para el tenant y compañía especificados.
     * @param tenantId ID único del tenant.
     * @returns Lista de proveedores activos ordenados por nombre.
     * @async
     */
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

        if (error) throw new Error(`Error al obtener proveedores: ${error.message}`);
        return data as Supplier[];
    }

    async getById(id: string): Promise<Supplier | null> {
        const companyId = this.getCompanyId();
        const { data, error } = await this.supabase.client
            .from('scm_suppliers')
            .select('*')
            .eq('id', id)
            .eq('company_id', companyId)
            .single();

        if (error) return null;
        return data as Supplier;
    }

    /**
     * Registra un nuevo proveedor en el sistema.
     * @param supplier Datos parciales del proveedor.
     * @returns El objeto del proveedor creado.
     * @async
     */
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

        if (error) throw new Error(`Error al crear el proveedor: ${error.message}`);
        return data as Supplier;
    }

    async update(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
        const companyId = this.getCompanyId();
        const { data, error } = await this.supabase.client
            .from('scm_suppliers')
            .update({
                ...supplier,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) throw error;
        return data as Supplier;
    }

    async delete(id: string): Promise<void> {
        const companyId = this.getCompanyId();
        const { error } = await this.supabase.client
            .from('scm_suppliers')
            .update({ is_active: false })
            .eq('id', id)
            .eq('company_id', companyId);

        if (error) throw error;
    }
}
