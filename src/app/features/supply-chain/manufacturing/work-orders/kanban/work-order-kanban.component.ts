
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrder } from '../../models/work-order.model';
import { WorkOrderService } from '../../services/work-order.service';

@Component({
    selector: 'app-work-order-kanban',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex gap-4 p-6 overflow-x-auto h-full">
      <div class="flex-1 min-w-[300px] bg-gray-100 rounded-lg p-4">
        <h3 class="font-bold mb-4 text-gray-700">Planned</h3>
        <div *ngFor="let order of planned" class="bg-white p-3 rounded shadow mb-3">
          <div class="font-semibold">{{ order.orderNumber }}</div>
          <div class="text-sm text-gray-600">{{ order.productName }}</div>
        </div>
      </div>
      
      <div class="flex-1 min-w-[300px] bg-blue-50 rounded-lg p-4">
        <h3 class="font-bold mb-4 text-blue-800">In Progress</h3>
        <div *ngFor="let order of inProgress" class="bg-white p-3 rounded shadow mb-3 border-l-4 border-blue-500">
           <div class="font-semibold">{{ order.orderNumber }}</div>
           <div class="text-sm text-gray-600">{{ order.productName }}</div>
        </div>
      </div>
      
      <div class="flex-1 min-w-[300px] bg-yellow-50 rounded-lg p-4">
        <h3 class="font-bold mb-4 text-yellow-800">Quality Check</h3>
        <div *ngFor="let order of quality" class="bg-white p-3 rounded shadow mb-3 border-l-4 border-yellow-500">
           <div class="font-semibold">{{ order.orderNumber }}</div>
           <div class="text-sm text-gray-600">{{ order.productName }}</div>
        </div>
      </div>
      
       <div class="flex-1 min-w-[300px] bg-green-50 rounded-lg p-4">
        <h3 class="font-bold mb-4 text-green-800">Completed</h3>
        <div *ngFor="let order of completed" class="bg-white p-3 rounded shadow mb-3 border-l-4 border-green-500">
           <div class="font-semibold">{{ order.orderNumber }}</div>
           <div class="text-sm text-gray-600">{{ order.productName }}</div>
        </div>
      </div>
    </div>
  `
})
export class WorkOrderKanbanComponent implements OnInit {
    planned: WorkOrder[] = [];
    inProgress: WorkOrder[] = [];
    quality: WorkOrder[] = [];
    completed: WorkOrder[] = [];

    constructor(private workOrderService: WorkOrderService) { }

    ngOnInit() {
        this.workOrderService.getWorkOrders().subscribe(orders => {
            this.planned = orders.filter(o => o.status === 'planned');
            this.inProgress = orders.filter(o => o.status === 'in_progress');
            this.quality = orders.filter(o => o.status === 'quality_check');
            this.completed = orders.filter(o => o.status === 'completed');
        });
    }
}
