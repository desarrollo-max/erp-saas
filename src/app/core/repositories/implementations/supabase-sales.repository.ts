import { Injectable, inject } from '@angular/core';
import { SalesRepository } from '../sales.repository';
import { SupabaseService } from '../../services/supabase.service';
import { SalesOpportunity, SalesContact, SalesCompany, SalesOrder, SalesOrderLine, SalesStage } from '../../models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class SupabaseSalesRepository extends SalesRepository {
    private supabase = inject(SupabaseService);

    async getStages(tenantId: string): Promise<SalesStage[]> {
        const { data, error } = await this.supabase.client
            .from('sales_stages')
            .select('*')
            .eq('pipeline_id', 'default') // Assuming functionality for multiple pipelines isn't ready, or we join with pipelines. 
            // Actually, let's just fetch all stages for now or filter by a default pipeline if exists.
            // Simplified:
            .order('order_index');

        // MVP: If no stages, return defaults? 
        // Or better, let's query joining pipeline if needed. 
        // For now, let's assume we fetch all stages linked to the tenant's pipelines.

        if (error) {
            // Fallback for MVP if table is empty or missing
            console.warn('Error fetching stages, using defaults', error);
            return [];
        }
        return data as SalesStage[];
    }

    async getOpportunities(tenantId: string): Promise<SalesOpportunity[]> {
        const { data, error } = await this.supabase.client
            .from('sales_opportunities')
            .select('*, sales_companies(name), sales_contacts(first_name, last_name)')
            .eq('tenant_id', tenantId);

        if (error) throw error;
        return data as any[];
    }

    async getOpportunityById(id: string): Promise<SalesOpportunity | null> {
        const { data, error } = await this.supabase.client
            .from('sales_opportunities')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data as SalesOpportunity;
    }

    async createOpportunity(opportunity: Partial<SalesOpportunity>): Promise<void> {
        const { error } = await this.supabase.client
            .from('sales_opportunities')
            .insert(opportunity);
        if (error) throw error;
    }

    async updateOpportunity(id: string, opportunity: Partial<SalesOpportunity>): Promise<void> {
        const { error } = await this.supabase.client
            .from('sales_opportunities')
            .update(opportunity)
            .eq('id', id);
        if (error) throw error;
    }

    async deleteOpportunity(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('sales_opportunities')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    async getContacts(tenantId: string): Promise<SalesContact[]> {
        const { data, error } = await this.supabase.client
            .from('sales_contacts')
            .select('*')
            .eq('tenant_id', tenantId);
        if (error) throw error;
        return data as SalesContact[];
    }

    async getContactById(id: string): Promise<SalesContact | null> {
        const { data, error } = await this.supabase.client
            .from('sales_contacts')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data as SalesContact;
    }

    async createContact(contact: Partial<SalesContact>): Promise<void> {
        const { error } = await this.supabase.client
            .from('sales_contacts')
            .insert(contact);
        if (error) throw error;
    }

    async updateContact(id: string, contact: Partial<SalesContact>): Promise<void> {
        const { error } = await this.supabase.client
            .from('sales_contacts')
            .update(contact)
            .eq('id', id);
        if (error) throw error;
    }

    async deleteContact(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('sales_contacts')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    async getCompanies(tenantId: string): Promise<SalesCompany[]> {
        const { data, error } = await this.supabase.client
            .from('sales_companies')
            .select('*')
            .eq('tenant_id', tenantId);
        if (error) throw error;
        return data as SalesCompany[];
    }

    async getCompanyById(id: string): Promise<SalesCompany | null> {
        const { data, error } = await this.supabase.client
            .from('sales_companies')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data as SalesCompany;
    }

    async createCompany(company: Partial<SalesCompany>): Promise<void> {
        const { error } = await this.supabase.client
            .from('sales_companies')
            .insert(company);
        if (error) throw error;
    }

    async updateCompany(id: string, company: Partial<SalesCompany>): Promise<void> {
        const { error } = await this.supabase.client
            .from('sales_companies')
            .update(company)
            .eq('id', id);
        if (error) throw error;
    }

    async deleteCompany(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('sales_companies')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    // --- Order Implementation ---

    async getOrders(tenantId: string): Promise<SalesOrder[]> {
        const { data, error } = await this.supabase.client
            .from('sales_orders')
            .select('*, sales_companies(name)')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data as any[];
    }

    async getOrderById(id: string): Promise<SalesOrder | null> {
        const { data, error } = await this.supabase.client
            .from('sales_orders')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data as SalesOrder;
    }

    async createOrder(order: Partial<SalesOrder>): Promise<SalesOrder> {
        const { data, error } = await this.supabase.client
            .from('sales_orders')
            .insert(order)
            .select()
            .single();
        if (error) throw error;
        return data as SalesOrder;
    }

    async updateOrder(id: string, order: Partial<SalesOrder>): Promise<void> {
        const { error } = await this.supabase.client
            .from('sales_orders')
            .update(order)
            .eq('id', id);
        if (error) throw error;
    }

    async deleteOrder(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('sales_orders')
            .delete()
            .eq('id', id);
        if (error) throw error;
    }

    async getOrderLines(orderId: string): Promise<SalesOrderLine[]> {
        const { data, error } = await this.supabase.client
            .from('sales_order_lines')
            .select('*, scm_products(name, sku)')
            .eq('sales_order_id', orderId);
        if (error) throw error;
        return data as any[];
    }

    async createOrderLine(line: Partial<SalesOrderLine>): Promise<SalesOrderLine> {
        const { data, error } = await this.supabase.client
            .from('sales_order_lines')
            .insert(line)
            .select()
            .single();
        if (error) throw error;
        return data as SalesOrderLine;
    }

    async deleteOrderLines(orderId: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('sales_order_lines')
            .delete()
            .eq('sales_order_id', orderId);
        if (error) throw error;
    }
}
