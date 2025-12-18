import { Injectable, inject } from '@angular/core';
import { WorkOrder } from '../models/work-order.model';
import { ManufacturingRepository } from '@core/repositories/manufacturing.repository';
import { SessionService } from '@core/services/session.service';
import { from, map, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WorkOrderService {
    private mfgRepo = inject(ManufacturingRepository);
    private session = inject(SessionService);

    getWorkOrders(): Observable<WorkOrder[]> {
        const tenantId = this.session.currentTenantId();
        if (!tenantId) return from([[]]);

        return from(this.mfgRepo.getProductionOrders(tenantId)).pipe(
            map(orders => orders.map(o => ({
                id: o.id,
                orderNumber: o.order_number,
                productName: o.product_id, // For now displaying ID, should join in real scenario
                quantity: o.quantity,
                status: (o.status as any) || 'planned',
                priority: 'medium',
                dueDate: o.due_date ? new Date(o.due_date) : undefined
            })))
        );
    }

    updateStatus(id: string, newStatus: WorkOrder['status']): Observable<any> {
        // En un ERP real, el status se actualiza mediante un stage
        return from(this.mfgRepo.updateOrderStatus(id, 'manual-stage', newStatus));
    }
}
