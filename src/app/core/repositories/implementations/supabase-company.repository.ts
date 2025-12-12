import { Injectable, inject } from "@angular/core";
import { Company } from "@core/models/erp.types";
import { SupabaseService } from "@core/services/supabase.service";
import { CompanyRepository } from "@core/repositories/company.repository";

@Injectable({
    providedIn: 'root'
})
export class SupabaseCompanyRepository extends CompanyRepository {
    private supabase = inject(SupabaseService);

    async getAllByTenant(tenantId: string): Promise<Company[]> {
        const { data, error } = await this.supabase.client
            .from('companies')
            .select('*')
            .eq('tenant_id', tenantId);

        if (error) {
            throw new Error(`Error fetching companies: ${error.message}`);
        }
        return data || [];
    }

    async create(company: Partial<Company>): Promise<void> {
        const { error } = await this.supabase.insert('companies', [company]);
        if (error) {
            throw new Error(`Error creating company: ${error.message}`);
        }
    }
}
