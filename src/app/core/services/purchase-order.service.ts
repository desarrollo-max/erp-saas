import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ScmPurchaseOrder } from '../models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class PurchaseOrderService {
    private supabase = inject(SupabaseService);

    async createOrder(order: Partial<ScmPurchaseOrder>) {
        const { data, error } = await this.supabase.client
            .from('scm_purchase_orders')
            .insert(order)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async createFromLowStock(tenantId: string, product: any, quantity: number) {
        // Lógica simplificada: Crear orden en estado borrador
        const order = {
            tenant_id: tenantId,
            company_id: product.company_id || 'DEFAULT_COMPANY', // Fallback simplificado
            po_number: `PO-${Date.now()}`,
            po_date: new Date().toISOString(),
            supplier_id: 'UNKNOWN_SUPPLIER', // Debería venir del producto
            status: 'DRAFT',
            total_amount: (product.cost_price || 0) * quantity,
            currency_code: 'MXN',
            created_by: 'SYSTEM',
            notes: `Generado automáticamente por bajo stock: ${product.name}`
        };

        return this.createOrder(order);
    }
}
