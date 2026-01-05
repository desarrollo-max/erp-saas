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
        const id = this.session.currentCompanyId();
        if (!id) throw new Error('No active company found.');
        return id;
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
        const companyId = this.getCompanyId();
        const { data, error } = await this.supabase.client
            .from('scm_purchase_orders')
            .select('*')
            .eq('id', id)
            .eq('company_id', companyId)
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
        const companyId = this.getCompanyId();
        const { data, error } = await this.supabase.client
            .from('scm_purchase_orders')
            .update({
                ...po,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) throw error;
        return data as PurchaseOrder;
    }

    async delete(id: string): Promise<void> {
        const companyId = this.getCompanyId();
        const { error } = await this.supabase.client
            .from('scm_purchase_orders')
            .delete()
            .eq('id', id)
            .eq('company_id', companyId);

        if (error) throw error;
    }

    // --- LINES ---

    async getLines(purchaseOrderId: string): Promise<PurchaseOrderLine[]> {
        const companyId = this.getCompanyId();
        const { data, error } = await this.supabase.client
            .from('scm_po_lines')
            .select('*')
            .eq('purchase_order_id', purchaseOrderId)
            .eq('company_id', companyId)
            .order('line_number');

        if (error) throw error;
        return data as PurchaseOrderLine[];
    }

    async addLine(line: Partial<PurchaseOrderLine>): Promise<PurchaseOrderLine> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();

        const { data, error } = await this.supabase.client
            .from('scm_po_lines')
            .insert({
                ...line,
                tenant_id: tenantId,
                company_id: companyId,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data as PurchaseOrderLine;
    }

    async updateLine(id: string, line: Partial<PurchaseOrderLine>): Promise<PurchaseOrderLine> {
        const companyId = this.getCompanyId();
        const { data, error } = await this.supabase.client
            .from('scm_po_lines')
            .update(line)
            .eq('id', id)
            .eq('company_id', companyId)
            .select()
            .single();

        if (error) throw error;
        return data as PurchaseOrderLine;
    }

    async deleteLine(id: string): Promise<void> {
        const companyId = this.getCompanyId();
        const { error } = await this.supabase.client
            .from('scm_po_lines')
            .delete()
            .eq('id', id)
            .eq('company_id', companyId);

        if (error) throw error;
    }

    async updateLineQuantity(lineId: string, receivedNow: number): Promise<void> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();

        // 1. Fetch current received quantity
        const { data: line, error: fetchError } = await this.supabase.client
            .from('scm_po_lines')
            .select('quantity_received')
            .eq('id', lineId)
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId)
            .single();

        if (fetchError) throw fetchError;

        const newReceived = (line.quantity_received || 0) + receivedNow;

        // 2. Update with the new total
        const { error: updateError } = await this.supabase.client
            .from('scm_po_lines')
            .update({ quantity_received: newReceived })
            .eq('id', lineId)
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId);

        if (updateError) throw updateError;
    }

    async receivePo(poId: string): Promise<void> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();

        // 1. Fetch all lines for this Purchase Order
        const { data: lines, error: linesError } = await this.supabase.client
            .from('scm_po_lines')
            .select('quantity_ordered, quantity_received')
            .eq('purchase_order_id', poId)
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId);

        if (linesError) throw linesError;

        // 2. Check if all lines are fully received
        const allCompleted = lines.length > 0 && lines.every(
            line => (line.quantity_received || 0) >= line.quantity_ordered
        );

        // 3. Update PO status if all items are received
        if (allCompleted) {
            const { error: poError } = await this.supabase.client
                .from('scm_purchase_orders')
                .update({
                    status: 'RECEIVED',
                    updated_at: new Date().toISOString()
                })
                .eq('id', poId)
                .eq('tenant_id', tenantId)
                .eq('company_id', companyId);

            if (poError) throw poError;
        }
    }

    /**
     * Cuenta las órdenes de compra pendientes (APPROVED o PENDING_APPROVAL).
     * @returns Promesa con el conteo de órdenes pendientes.
     */
    async getPendingOrdersCount(): Promise<number> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();

        const { count, error } = await this.supabase.client
            .from('scm_purchase_orders')
            .select('*', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId)
            .in('status', ['APPROVED', 'PENDING_APPROVAL']);

        if (error) {
            console.error('Error counting pending orders:', error);
            return 0;
        }

        return count || 0;
    }
}
