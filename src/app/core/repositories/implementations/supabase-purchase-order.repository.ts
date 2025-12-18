import { Injectable, inject } from '@angular/core';
import { PurchaseOrderRepository } from '../purchase-order.repository';
import { SupabaseService } from '@core/services/supabase.service';
import { SessionService } from '@core/services/session.service';
import { PurchaseOrder, PurchaseOrderLine } from '@core/models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class SupabasePurchaseOrderRepository extends PurchaseOrderRepository {
    private supabase = inject(SupabaseService);
    private session = inject(SessionService);

    private getCompanyId(): string {
        return this.session.currentCompany()?.id || '';
    }

    // --- HEADERS ---

    async getAll(tenantId: string): Promise<PurchaseOrder[]> {
        const companyId = this.getCompanyId();
        if (!tenantId || !companyId) return [];

        const { data, error } = await this.supabase.client
            .from('scm_purchase_orders')
            .select(`
        *,
        supplier:scm_suppliers (name)
      `)
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as any[];
    }

    async getById(id: string): Promise<PurchaseOrder | null> {
        const { data, error } = await this.supabase.client
            .from('scm_purchase_orders')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return null;
        return data as PurchaseOrder;
    }

    async create(po: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();
        const userId = this.session.user()?.id;

        const { data, error } = await this.supabase.client
            .from('scm_purchase_orders')
            .insert({
                ...po,
                tenant_id: tenantId,
                company_id: companyId,
                created_by: userId,
                status: po.status || 'DRAFT',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data as PurchaseOrder;
    }

    async update(id: string, po: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
        const { data, error } = await this.supabase.client
            .from('scm_purchase_orders')
            .update({
                ...po,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as PurchaseOrder;
    }

    async delete(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('scm_purchase_orders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    // --- LINES ---

    async getLines(purchaseOrderId: string): Promise<PurchaseOrderLine[]> {
        const { data, error } = await this.supabase.client
            .from('scm_po_lines')
            .select('*')
            .eq('purchase_order_id', purchaseOrderId)
            .order('line_number');

        if (error) throw error;
        return data as PurchaseOrderLine[];
    }

    async addLine(line: Partial<PurchaseOrderLine>): Promise<PurchaseOrderLine> {
        // Basic implementation without fancy logic like auto-line-number for now, unless needed.
        const { data, error } = await this.supabase.client
            .from('scm_po_lines')
            .insert({
                ...line,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data as PurchaseOrderLine;
    }

    async updateLine(id: string, line: Partial<PurchaseOrderLine>): Promise<PurchaseOrderLine> {
        const { data, error } = await this.supabase.client
            .from('scm_po_lines')
            .update(line)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as PurchaseOrderLine;
    }

    async deleteLine(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('scm_po_lines')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
