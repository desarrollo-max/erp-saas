
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrderKanbanComponent } from '../kanban/work-order-kanban.component';

@Component({
  selector: 'app-work-order-list',
  standalone: true,
  imports: [CommonModule, WorkOrderKanbanComponent],
  template: `
    <div class="p-6 h-full flex flex-col">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Órdenes de Trabajo</h2>
        <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
          Nueva Orden
        </button>
      </div>
      <app-work-order-kanban class="flex-1"></app-work-order-kanban>
    </div>
  `
})
export class WorkOrderListComponent { }
