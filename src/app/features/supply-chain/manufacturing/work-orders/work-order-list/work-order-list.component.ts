
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { WorkOrderKanbanComponent } from '../kanban/work-order-kanban.component';
import { ManufacturingRepository } from '@core/repositories/manufacturing.repository';
import { SessionService } from '@core/services/session.service';
import { MfgProcess, MfgProductionOrder } from '@core/models/erp.types';

@Component({
  selector: 'app-work-order-list',
  standalone: true,
  imports: [CommonModule, NgIconsModule, WorkOrderKanbanComponent],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 animate-fade-in flex flex-col">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
           <h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2 italic uppercase">Control de Producción</h1>
           <p class="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Gestión de Órdenes de Trabajo & Kanban</p>
        </div>
        
        <button (click)="createOrder()" 
                class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2">
            <ng-icon name="heroPlusCircleSolid" class="w-5 h-5"></ng-icon>
            Lanzar Producción
        </button>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Activas</p>
              <h3 class="text-2xl font-black text-slate-900 dark:text-white">{{ activeCount() }}</h3>
          </div>
          <div class="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">En Cola</p>
              <h3 class="text-2xl font-black text-indigo-500">{{ plannedCount() }}</h3>
          </div>
          <div class="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">En Proceso</p>
              <h3 class="text-2xl font-black text-blue-500">{{ inProgressCount() }}</h3>
          </div>
          <div class="bg-emerald-500 p-6 rounded-[2.5rem] shadow-xl text-white">
              <p class="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Completadas Hoy</p>
              <h3 class="text-2xl font-black italic">{{ completedToday() }}</h3>
          </div>
      </div>

      <!-- Kanban Boards per Process -->
      <div class="flex-grow space-y-12">
          <div *ngIf="isLoading()" class="py-20 text-center">
              <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p class="text-slate-400 font-black uppercase text-[10px] tracking-widest">Sincronizando Plantas...</p>
          </div>

          <div *ngFor="let group of processesWithOrders()" class="animate-fade-in group/board">
              <div class="flex items-center gap-4 mb-6">
                  <div class="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none">
                      <ng-icon name="heroCpuChipSolid" class="w-5 h-5"></ng-icon>
                  </div>
                  <div>
                      <h2 class="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{{ group.process.name }}</h2>
                      <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Línea de Producción Aktiva</p>
                  </div>
              </div>

              <div class="min-h-[400px]">
                  <app-work-order-kanban 
                      [processId]="group.process.id"
                      [initialOrders]="group.orders"
                      (ordersChanged)="onOrdersChanged()">
                  </app-work-order-kanban>
              </div>
          </div>

          <div *ngIf="!isLoading() && processesWithOrders().length === 0" class="py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
               <ng-icon name="heroInboxSolid" class="w-12 h-12 text-slate-200 mx-auto mb-4"></ng-icon>
               <p class="text-slate-400 font-bold text-sm">No hay órdenes de trabajo activas en ninguna línea.</p>
               <button (click)="createOrder()" class="mt-4 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline">Crear Nueva Orden</button>
          </div>
      </div>
      
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; overflow: hidden; }
    .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class WorkOrderListComponent implements OnInit {
  private mfgRepo = inject(ManufacturingRepository);
  private session = inject(SessionService);
  private router = inject(Router);

  processesWithOrders = signal<{ process: MfgProcess, orders: MfgProductionOrder[] }[]>([]);
  isLoading = signal(true);

  activeCount = signal(0);
  plannedCount = signal(0);
  inProgressCount = signal(0);
  completedToday = signal(0);

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const tenantId = this.session.currentTenantId();
      if (!tenantId) return;

      const [processes, orders] = await Promise.all([
        this.mfgRepo.getProcesses(tenantId),
        this.mfgRepo.getProductionOrders(tenantId)
      ]);

      // Filtrar solo procesos que tengan órdenes activas (no completadas ni canceladas)
      const grouped = processes.map(p => ({
        process: p,
        orders: orders.filter(o => o.process_id === p.id && o.status !== 'COMPLETED' && o.status !== 'CANCELLED')
      })).filter(group => group.orders.length > 0);

      this.processesWithOrders.set(grouped);
      this.updateStats(orders);
    } catch (error) {
      console.error('Error loading work orders list:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  updateStats(allOrders: MfgProductionOrder[]) {
    const todayStr = new Date().toISOString().split('T')[0];
    this.activeCount.set(allOrders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length);
    this.plannedCount.set(allOrders.filter(o => o.status === 'PLANNED' || o.status === 'DRAFT').length);
    this.inProgressCount.set(allOrders.filter(o => o.status === 'IN_PROGRESS' || o.status === 'QUALITY_CHECK').length);
    this.completedToday.set(allOrders.filter(o => o.status === 'COMPLETED' && o.updated_at?.startsWith(todayStr)).length);
  }

  onOrdersChanged() {
    // Recargar todo cuando hay un cambio en el Kanban para mantener consistencia
    this.loadData();
  }

  createOrder() {
    this.router.navigate(['/produccion/work-orders/nuevo']);
  }
}
