
import { Component, OnInit, inject, signal, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManufacturingRepository } from '@core/repositories/manufacturing.repository';
import { MfgProductionOrder, MfgStage } from '@core/models/erp.types';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
  selector: 'app-work-order-kanban',
  standalone: true,
  imports: [CommonModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="flex gap-8 p-0 overflow-x-auto h-full bg-transparent scrollbar-hide">
      
      <!-- COLUMNS dynamically loaded based on stages -->
      <div *ngFor="let stage of stages(); let i = index" class="flex-1 min-w-[280px] flex flex-col group/col">
        <div class="flex items-center justify-between mb-4 px-4">
            <div class="flex items-center gap-2">
                <div class="w-1.5 h-5 rounded-full shadow-sm" [ngClass]="getStageColor(i)"></div>
                <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/col:text-slate-600 transition-colors">{{ stage.name }}</h3>
                <span class="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-md text-[9px] font-black text-slate-500">{{ getOrdersForStage(stage.id).length }}</span>
            </div>
        </div>

        <div class="flex-grow space-y-3 min-h-[300px] border-2 border-transparent group-hover/col:bg-slate-100/30 dark:group-hover/col:bg-slate-900/30 rounded-[2rem] p-3 transition-all duration-500 overflow-y-auto custom-scrollbar">
            <div *ngFor="let order of getOrdersForStage(stage.id)" 
                 class="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg hover:translate-y-[-2px] transition-all group/card">
                
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[9px] font-black tracking-widest text-indigo-500 uppercase">#{{ order.order_number }}</span>
                    <div [ngClass]="getPriorityClass(order.priority)">
                        <ng-icon name="heroFlagSolid" class="w-3.5 h-3.5"></ng-icon>
                    </div>
                </div>

                <h4 class="text-xs font-black text-slate-800 dark:text-slate-100 mb-1 line-clamp-2 leading-tight">{{ order.scm_products?.name || 'Producto Desconocido' }}</h4>
                
                <div class="flex items-center gap-3 text-[9px] font-bold text-slate-400 mb-3 font-mono">
                    <div class="flex items-center gap-1">
                        <ng-icon name="heroSquares2x2Solid" class="w-3 h-3"></ng-icon>
                        {{ order.quantity }} unid.
                    </div>
                </div>

                <div class="pt-2 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center mt-2">
                    <!-- Backward button -->
                    <button *ngIf="i > 0" (click)="moveOrder(order, stages()[i-1])" 
                            class="p-1.5 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-0 group-hover/card:opacity-100"
                            title="Retroceder para reproceso">
                        <ng-icon name="heroArrowUturnLeftSolid" class="w-3.5 h-3.5"></ng-icon>
                    </button>
                    
                    <div class="flex-grow"></div>

                    <!-- Forward button -->
                    <button (click)="moveOrder(order, stages()[i+1], i === stages().length - 1)" 
                            class="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all opacity-0 group-hover/card:opacity-100"
                            [title]="i === stages().length - 1 ? 'Finalizar Orden' : 'Avanzar Etapa'">
                        <ng-icon [name]="i === stages().length - 1 ? 'heroCheckCircleSolid' : 'heroArrowRightSolid'" class="w-3.5 h-3.5"></ng-icon>
                    </button>
                </div>
            </div>

            <div *ngIf="getOrdersForStage(stage.id).length === 0" class="h-16 border-2 border-dashed border-slate-50 dark:border-slate-800 rounded-2xl flex items-center justify-center text-center">
                <p class="text-[9px] font-black text-slate-200 dark:text-slate-800 uppercase tracking-widest italic">Vacía</p>
            </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class WorkOrderKanbanComponent implements OnInit, OnChanges {
  private mfgRepo = inject(ManufacturingRepository);

  @Input() processId!: string;
  @Input() initialOrders: MfgProductionOrder[] = [];
  @Output() ordersChanged = new EventEmitter<void>();

  stages = signal<MfgStage[]>([]);
  orders = signal<MfgProductionOrder[]>([]);

  async ngOnInit() {
    await this.loadStages();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['initialOrders']) {
      this.orders.set(this.initialOrders);
    }
  }

  async loadStages() {
    if (!this.processId) return;
    try {
      const data = await this.mfgRepo.getProcessStages(this.processId);
      this.stages.set(data);
    } catch (error) {
      console.error('Error loading stages:', error);
    }
  }

  getOrdersForStage(stageId: string) {
    return this.orders().filter(o => o.current_stage_id === stageId);
  }

  async moveOrder(order: MfgProductionOrder, targetStage: MfgStage | undefined, isCompleting: boolean = false) {
    try {
      if (isCompleting) {
        // Si es la última etapa y se avanza, completar orden
        await this.mfgRepo.updateOrderStatus(order.id, order.current_stage_id, 'COMPLETED');
      } else if (targetStage) {
        // Mover a la etapa destino (adelante o atrás)
        // El estado principal se mantiene IN_PROGRESS normalmente
        await this.mfgRepo.updateOrderStatus(order.id, targetStage.id, 'IN_PROGRESS');
      }
      this.ordersChanged.emit();
    } catch (error) {
      console.error('Error moving order:', error);
    }
  }

  getStageColor(index: number): string {
    const colors = ['bg-slate-300', 'bg-indigo-400', 'bg-blue-400', 'bg-purple-400', 'bg-amber-400', 'bg-emerald-400'];
    return colors[index % colors.length];
  }

  getPriorityClass(priority: string | undefined): string {
    const p = (priority || '').toUpperCase();
    if (p === 'HIGH' || p === 'URGENT' || p === 'URGENTE') return 'text-rose-500';
    if (p === 'MEDIUM') return 'text-amber-500';
    return 'text-slate-300';
  }
}
