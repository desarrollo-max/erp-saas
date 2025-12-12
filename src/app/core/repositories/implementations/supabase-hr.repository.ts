import { Injectable, inject } from '@angular/core';
import { HRRepository } from '../hr.repository';
import { SupabaseService } from '../../services/supabase.service';
import { HrEmployee } from '../../models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class SupabaseHRRepository extends HRRepository {
    private supabase = inject(SupabaseService);

    async getEmployees(tenantId: string): Promise<HrEmployee[]> {
        const { data, error } = await this.supabase.client
            .from('hr_employees')
            .select('*')
            .eq('tenant_id', tenantId);

        if (error) {
            // If table doesn't exist yet, return empty to avoid breaking app
            console.warn('Error fetching employees (table might be missing):', error);
            return [];
        }
        return data as HrEmployee[];
    }

    async getEmployeeById(id: string): Promise<HrEmployee | null> {
        const { data, error } = await this.supabase.client
            .from('hr_employees')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data as HrEmployee;
    }

    async createEmployee(employee: Partial<HrEmployee>): Promise<void> {
        const { error } = await this.supabase.client
            .from('hr_employees')
            .insert(employee);
        if (error) throw error;
    }

    async updateEmployee(id: string, employee: Partial<HrEmployee>): Promise<void> {
        const { error } = await this.supabase.client
            .from('hr_employees')
            .update(employee)
            .eq('id', id);
        if (error) throw error;
    }
}
