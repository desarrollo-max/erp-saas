import { Injectable, signal } from '@angular/core';
import { WorkOrder } from '../models/work-order.model';
import { of } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WorkOrderService {
    // Mock data specifically for verifying the Kanban board
    private mockOrders: WorkOrder[] = [
        {
            id: '1',
            orderNumber: 'WO-2023-001',
            productName: 'Bota Vaquera Clásica',
            quantity: 50,
            status: 'planned',
            priority: 'high',
            dueDate: new Date('2023-12-10')
        },
        {
            id: '2',
            orderNumber: 'WO-2023-002',
            productName: 'Bota Industrial Pro',
            quantity: 120,
            status: 'in_progress',
            currentStep: 'Montado',
            priority: 'medium',
            dueDate: new Date('2023-12-15')
        },
        {
            id: '3',
            orderNumber: 'WO-2023-003',
            productName: 'Zapato Casual',
            quantity: 30,
            status: 'quality_check',
            priority: 'low',
            dueDate: new Date('2023-12-08')
        },
        {
            id: '4',
            orderNumber: 'WO-2023-004',
            productName: 'Bota Exótica',
            quantity: 10,
            status: 'completed',
            priority: 'high',
            dueDate: new Date('2023-12-01')
        }
    ];

    getWorkOrders() {
        return of(this.mockOrders);
    }

    updateStatus(id: string, newStatus: WorkOrder['status']) {
        const order = this.mockOrders.find(o => o.id === id);
        if (order) {
            order.status = newStatus;
        }
        return of(order);
    }
}
