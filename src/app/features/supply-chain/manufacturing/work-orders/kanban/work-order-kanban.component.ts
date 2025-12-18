import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkOrder } from '../../models/work-order.model';
import { WorkOrderService } from '../../services/work-order.service';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
  selector: 'app-work-order-kanban',
  standalone: true,
  imports: [CommonModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="flex gap-8 p-8 overflow-x-auto h-full bg-slate-50 dark:bg-slate-950/20 rounded-[2rem]">
      
      <!-- COLUMNS -->
      <div *ngFor="let col of columns" class="flex-1 min-w-[320px] flex flex-col group/col">
        <div class="flex items-center justify-between mb-6 px-2">
            <div class="flex items-center gap-3">
                <div [class]="col.colorClass + ' w-2 h-6 rounded-full'"></div>
                <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400group-hover/col:text-slate-600 transition-colors">{{ col.label }}</h3>
                <span class="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-500">{{ getOrdersForColumn(col.id).length }}</span>
            </div>
            <button class="text-slate-300 hover:text-indigo-500 transition-colors">
                <ng-icon name="heroPlusSolid" class="w-4 h-4"></ng-icon>
            </button>
        </div>

        <div class="flex-grow space-y-4 min-h-[500px] border-2 border-transparent group-hover/col:border-indigo-500/10 rounded-[2.5rem] p-2 transition-all duration-500">
            <div *ngFor="let order of getOrdersForColumn(col.id)" 
                 class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-grab active:cursor-grabbing group">
                
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[10px] font-black tracking-widest text-indigo-500 uppercase">#{{ order.orderNumber }}</span>
                    <div [ngClass]="{
                        'text-rose-500': order.priority === 'high',
                        'text-amber-500': order.priority === 'medium',
                        'text-slate-300': order.priority === 'low'
                    }">
                        <ng-icon name="heroFlagSolid" class="w-4 h-4"></ng-icon>
                    </div>
                </div>

                <h4 class="text-sm font-black text-slate-800 dark:text-slate-100 mb-2 line-clamp-2 leading-relaxed">{{ order.productName }}</h4>
                
                <div class="flex items-center gap-4 text-[10px] font-bold text-slate-400 mb-6">
                    <div class="flex items-center gap-1">
                        <ng-icon name="heroSquares2x2Solid" class="w-3.5 h-3.5"></ng-icon>
                        {{ order.quantity }} unidades
                    </div>
                    <div class="flex items-center gap-1" *ngIf="order.dueDate">
                        <ng-icon name="heroCalendarDaysSolid" class="w-3.5 h-3.5"></ng-icon>
                        {{ order.dueDate | date:'shortDate' }}
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                    <div class="flex -space-x-2">
                        <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black">OP</div>
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button (click)="moveOrder(order.id, col.nextId)" *ngIf="col.nextId" class="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all">
                             <ng-icon name="heroChevronRightSolid" class="w-4 h-4"></ng-icon>
                         </button>
                    </div>
                </div>
            </div>

            <!-- EMPTY STATE FOR COLUMN -->
            <div *ngIf="getOrdersForColumn(col.id).length === 0" class="h-32 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center">
                <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Vaciando...</p>
            </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
    ::-webkit-scrollbar { height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .dark ::-webkit-scrollbar-thumb { background: #1e293b; }
  `]
})
export class WorkOrderKanbanComponent implements OnInit {
  private workOrderService = inject(WorkOrderService);

  orders = signal<WorkOrder[]>([]);

  columns = [
    { id: 'planned', label: 'Planeado', colorClass: 'bg-slate-300', nextId: 'in_progress' },
    { id: 'in_progress', label: 'En Curso', colorClass: 'bg-indigo-500', nextId: 'quality_check' },
    { id: 'quality_check', label: 'Control Calidad', colorClass: 'bg-amber-500', nextId: 'completed' },
    { id: 'completed', label: 'Terminado', colorClass: 'bg-emerald-500', nextId: null }
  ];

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.workOrderService.getWorkOrders().subscribe(data => {
      this.orders.set(data);
      // Fallback if empty for WOW effect during demo/dev
      if (data.length === 0) {
        this.orders.set([
          { id: '1', orderNumber: 'WO-882', productName: 'Bota Cowboy Piel Exótica', quantity: 24, status: 'planned', priority: 'high', dueDate: new Date() },
          { id: '2', orderNumber: 'WO-883', productName: 'Zapato Ejecutivo Oxford', quantity: 150, status: 'in_progress', priority: 'medium', dueDate: new Date() },
          { id: '3', orderNumber: 'WO-884', productName: 'Sandalia Confort Premium', quantity: 500, status: 'quality_check', priority: 'low', dueDate: new Date() }
        ]);
      }
    });
  }

  getOrdersForColumn(status: string) {
    return this.orders().filter(o => o.status === status);
  }

  async moveOrder(id: string, nextStatus: string | null) {
    if (!nextStatus) return;

    // Optimistic UI update
    this.orders.update(all => all.map(o => o.id === id ? { ...o, status: nextStatus as any } : o));

    // Persistence
    this.workOrderService.updateStatus(id, nextStatus as any).subscribe({
      error: () => {
        // Rollback on error
        this.loadOrders();
      }
    });
  }
}
