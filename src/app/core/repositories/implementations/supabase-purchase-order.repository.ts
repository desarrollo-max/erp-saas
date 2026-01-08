import { Injectable, inject } from '@angular/core';
import { PurchaseOrderRepository } from '../purchase-order.repository';
import { SupabaseService } from '@core/services/supabase.service';
import { SessionService } from '@core/services/session.service';
import { PurchaseOrder, PurchaseOrderLine, ScmStockMovement } from '@core/models/erp.types';

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
        const userId = this.session.user()?.id;

        // 1. Fetch current received quantity and line details
        const { data: line, error: fetchError } = await this.supabase.client
            .from('scm_po_lines')
            .select('id, quantity_received, quantity_ordered, product_id, variant_id, purchase_order_id')
            .eq('id', lineId)
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId)
            .single();

        if (fetchError) throw fetchError;
        if (!line) throw new Error('Línea de orden de compra no encontrada');

        // 2. Fetch PO details for warehouse
        const { data: po, error: poError } = await this.supabase.client
            .from('scm_purchase_orders')
            .select('warehouse_id, po_number')
            .eq('id', line.purchase_order_id)
            .single();

        if (poError) throw poError;
        if (!po?.warehouse_id) throw new Error('La orden no tiene un almacén asignado.');

        const newReceived = (line.quantity_received || 0) + receivedNow;
        const now = new Date().toISOString();

        // 3. Insert Stock Movement (IN)
        const movement: ScmStockMovement = {
             id: crypto.randomUUID(),
             tenant_id: tenantId,
             company_id: companyId,
             warehouse_id: po.warehouse_id,
             product_id: line.product_id,
             variant_id: line.variant_id || line.product_id,
             movement_type: 'IN',
             quantity: receivedNow,
             movement_date: now,
             reference_type: 'purchase_order',
             reference_id: line.purchase_order_id,
             notes: `Recepción Parcial PO ${po.po_number}`,
             created_by: userId!,
             created_at: now
        } as any;

        const { error: moveError } = await this.supabase.client
             .from('scm_stock_movements')
             .insert(movement);

        if (moveError) throw moveError;

        // 4. Update with the new total
        const { error: updateError } = await this.supabase.client
            .from('scm_po_lines')
            .update({ quantity_received: newReceived })
            .eq('id', lineId)
            .eq('tenant_id', tenantId)
            .eq('company_id', companyId);

        if (updateError) throw updateError;
    }

    async receiveAll(poId: string): Promise<void> {
        const tenantId = this.session.currentTenantId();
        const companyId = this.getCompanyId();
        const userId = this.session.user()?.id;

        // 1. Get PO Header to find warehouse
        const { data: po, error: poError } = await this.supabase.client
            .from('scm_purchase_orders')
            .select('warehouse_id, status, po_number')
            .eq('id', poId)
            .single();

        if (poError || !po) throw new Error('Orden de compra no encontrada');
        if (!po.warehouse_id) throw new Error('La orden no tiene un almacén de destino asignado. Edite la orden para asignar uno.');
        if (po.status === 'COMPLETED' || po.status === 'RECEIVED') throw new Error('La orden ya ha sido recibida.');

        // 2. Get Lines
        const { data: lines, error: linesError } = await this.supabase.client
            .from('scm_po_lines')
            .select('*')
            .eq('purchase_order_id', poId);

        if (linesError) throw linesError;

        const movements: ScmStockMovement[] = [];
        const now = new Date().toISOString();
        const updates: PromiseLike<any>[] = [];

        // 3. Process Lines
        for (const line of lines) {
            const received = line.quantity_received || 0;
            const pending = line.quantity_ordered - received;

            if (pending > 0) {
                 // Create Stock Movement (IN)
                 // Note: We use product_id as variant_id fallback. Ensure DB supports this or all products have variants.
                 movements.push({
                     id: crypto.randomUUID(), // Client-side ID generation if needed, or let DB handle it (but we are inserting) -> usually DB handles ID if omitted, but interface requires it?
                     // Interface ScmStockMovement has 'id'. If DB auto-generates, we might need to omit it or use partial.
                     // Since we use strict typing, let's see if we can use Partial or if we need to generate UUID.
                     // Supabase usually handles UUID default. Let's cast to any to avoid TS error on ID if we don't generate it, 
                     // OR generate it. Let's generate it to be safe if we are sending it.
                     // Actually, better to use Omit<ScmStockMovement, 'id'> if inserting.
                     // But let's check the code I read. It pushed an object.
                     // The object didn't have 'id'. So likely the DB handles it.
                     // I will type it as Partial<ScmStockMovement> or similar.
                     tenant_id: tenantId,
                     company_id: companyId,
                     warehouse_id: po.warehouse_id,
                     product_id: line.product_id,
                     variant_id: line.variant_id || line.product_id, 
                     movement_type: 'IN', 
                     quantity: pending,
                     movement_date: now,
                     reference_type: 'purchase_order',
                     reference_id: poId,
                     // reference_number: po.po_number, // ScmStockMovement interface does NOT have reference_number in the version I read!
                     // I need to check ScmStockMovement interface again. It has reference_type, reference_id, notes. No reference_number.
                     // So the previous code had a bug or extra field 'reference_number'.
                     notes: `Recepción Completa PO ${po.po_number}`,
                     created_by: userId,
                     created_at: now
                 } as any); // Casting to any to avoid strict ID/field checks for now, but keeping the structure clean.

                // Prepare update for Line Quantity Received (execute later)
                updates.push(
                    this.supabase.client

                       .from('scm_po_lines')
                       .update({ quantity_received: line.quantity_ordered })
                       .eq('id', line.id)
                       .then(() => null)
                );
            }
        }

        if (movements.length > 0) {
            // Insert movements
             const { error: movError } = await this.supabase.client
                .from('scm_stock_movements')
                .insert(movements);
            
             if (movError) throw movError;

            // Apply line updates
            for (const u of updates) {
                await u;
            }
        }

        // 4. Update PO Status to COMPLETED
        const { error: statusError } = await this.supabase.client
            .from('scm_purchase_orders')
            .update({ status: 'COMPLETED', updated_at: now })
            .eq('id', poId);

        if (statusError) throw statusError;
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
                    status: 'COMPLETED',
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
