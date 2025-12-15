import { Injectable } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { Tenant } from '../models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class TenantRepository {
    private readonly TABLE_NAME = 'tenants';

    constructor(private supabase: SupabaseService) { }

    async getById(id: string): Promise<Tenant | null> {
        const { data, error } = await this.supabase.client
            .from(this.TABLE_NAME)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching tenant:', error);
            return null;
        }
        return data as Tenant;
    }

    async update(id: string, updates: Partial<Tenant>): Promise<Tenant | null> {
        const { data: result, error } = await this.supabase.update<Tenant>(this.TABLE_NAME, id, updates);

        if (error) {
            console.error('Error updating tenant:', error);
            throw error;
        }
        return result ? result[0] : null;
    }
}
