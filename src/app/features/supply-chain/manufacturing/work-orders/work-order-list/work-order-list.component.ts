
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { WorkOrderKanbanComponent } from '../kanban/work-order-kanban.component';
import { ManufacturingRepository } from '@core/repositories/manufacturing.repository';
import { SessionService } from '@core/services/session.service';
import { ThemeService } from '@core/services/theme.service';
import { MfgProcess, MfgProductionOrder } from '@core/models/erp.types';

@Component({
  selector: 'app-work-order-list',
  standalone: true,
  imports: [CommonModule, NgIconsModule, WorkOrderKanbanComponent],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden transition-colors duration-500">
      
      <!-- Premium Background Elements -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.08)_0%,transparent_50%)] pointer-events-none"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.08)_0%,transparent_50%)] pointer-events-none"></div>

      <!-- Header -->
      <div class="px-6 sm:px-10 pt-10 pb-6 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div class="space-y-2">
           <h1 class="text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic drop-shadow-sm">
             Control de <span class="text-primary-600 dark:text-primary-400">Producción</span>
           </h1>
           <p class="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] ml-1">Advanced Manufacturing Core & Real-time Kanban</p>
        </div>
        
        <div class="flex items-center gap-3">

        
          <button (click)="createOrder()" 
                  class="px-8 py-5 bg-primary-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-900 dark:hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 flex items-center gap-3 group active:scale-95">
              <ng-icon name="heroPlusCircleSolid" class="w-6 h-6 group-hover:rotate-90 transition-transform"></ng-icon>
              Lanzar Nueva Orden
          </button>
        </div>
      </div>

      <!-- PREMIUM TAB NAVIGATION -->
      <div class="px-6 sm:px-10 mb-8 relative z-20 overflow-x-auto no-scrollbar">
          <div class="flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-2 rounded-[2.5rem] border border-white dark:border-slate-800 w-max">
              <button (click)="activeTab.set('DASHBOARD')"
                      [class]="activeTab() === 'DASHBOARD' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'"
                      class="px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3">
                  <ng-icon name="heroChartBarSolid" class="w-4 h-4"></ng-icon>
                  Monitor Global
              </button>
              
              <div class="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2"></div>

              <button *ngFor="let group of processesWithOrders()"
                      (click)="activeTab.set(group.process.id)"
                      [class]="activeTab() === group.process.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'"
                      class="px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap">
                  <ng-icon name="heroCpuChipSolid" class="w-4 h-4"></ng-icon>
                  {{ group.process.name }}
              </button>
          </div>
      </div>

      <!-- MAIN CONTENT AREA -->
      <div class="flex-grow px-6 sm:px-10 pb-10 relative z-10 overflow-auto custom-scrollbar">
          
          <!-- TAB: DASHBOARD -->
          <div *ngIf="activeTab() === 'DASHBOARD'" class="animate-fade-in space-y-12">
              <!-- Quick Stats -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div class="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                      <div class="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-150 transition-transform"></div>
                      <div class="relative z-10">
                          <p class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Órdenes Activas</p>
                          <div class="flex items-baseline gap-2">
                              <h3 class="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{{ activeCount() }}</h3>
                              <span class="text-[10px] font-black text-indigo-500 uppercase">En Planta</span>
                          </div>
                      </div>
                  </div>

                  <div class="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                      <div class="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-150 transition-transform"></div>
                      <div class="relative z-10">
                          <p class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Planificadas</p>
                          <div class="flex items-baseline gap-2">
                              <h3 class="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{{ plannedCount() }}</h3>
                              <span class="text-[10px] font-black text-slate-400 uppercase italic">Backlog</span>
                          </div>
                      </div>
                  </div>

                  <div class="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                      <div class="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 dark:bg-blue-950/30 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-150 transition-transform"></div>
                      <div class="relative z-10">
                          <p class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">En Ejecución</p>
                          <div class="flex items-baseline gap-2">
                              <h3 class="text-4xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">{{ inProgressCount() }}</h3>
                              <span class="text-[10px] font-black text-slate-400 uppercase italic">Live</span>
                          </div>
                      </div>
                  </div>

                  <div class="group bg-emerald-600 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-emerald-700">
                      <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 rotate-12 group-hover:scale-110 transition-transform"></div>
                      <div class="relative z-10 text-white">
                          <p class="text-[9px] font-black opacity-80 uppercase tracking-widest mb-2 ml-1">Completadas (24h)</p>
                          <div class="flex items-baseline gap-2">
                              <h3 class="text-4xl font-black tracking-tighter">{{ completedToday() }}</h3>
                              <span class="text-[10px] font-black opacity-60 uppercase italic">Éxito</span>
                          </div>
                      </div>
                      <div class="absolute bottom-4 right-8 opacity-20">
                          <ng-icon name="heroCheckBadgeSolid" class="w-12 h-12"></ng-icon>
                      </div>
                  </div>
              </div>

              <!-- Dashboard Overview List (Simple summary) -->
              <div class="bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-[3rem] p-10 border border-white dark:border-slate-800">
                  <div class="flex items-center gap-4 mb-8">
                      <h4 class="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Estado de Líneas</h4>
                  </div>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div *ngFor="let group of processesWithOrders()" 
                           (click)="activeTab.set(group.process.id)"
                           class="flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all cursor-pointer group">
                          <div class="flex items-center gap-4">
                              <div class="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  <ng-icon name="heroCpuChipSolid" class="w-6 h-6"></ng-icon>
                              </div>
                              <div>
                                  <p class="text-sm font-black text-slate-900 dark:text-white uppercase italic">{{ group.process.name }}</p>
                                  <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ group.orders.length }} Órdenes en curso</p>
                              </div>
                          </div>
                          <ng-icon name="heroChevronRightSolid" class="text-slate-300 group-hover:text-indigo-500 transition-colors"></ng-icon>
                      </div>
                  </div>
              </div>
          </div>

          <!-- TAB: PROCESS KANBAN -->
          <div *ngFor="let group of processesWithOrders()">
              <div *ngIf="activeTab() === group.process.id" class="animate-fade-in h-full flex flex-col">
                  <div class="flex items-center gap-6 mb-8 ml-2">
                      <div class="w-14 h-14 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 rounded-[1.5rem] flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-800">
                          <ng-icon name="heroCpuChipSolid" class="w-7 h-7"></ng-icon>
                      </div>
                      <div>
                          <h2 class="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{{ group.process.name }}</h2>
                          <div class="flex items-center gap-2">
                              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              <p class="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em]">Gestión de Flujo &bull; Tiempo Real</p>
                          </div>
                      </div>
                  </div>

                  <app-work-order-kanban 
                      [processId]="group.process.id"
                      [initialOrders]="group.orders"
                      (ordersChanged)="onOrdersChanged()">
                  </app-work-order-kanban>
              </div>
          </div>

          <!-- Loading & Empty States -->
          <div *ngIf="isLoading()" class="py-32 text-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-slate-100 dark:border-slate-800">
              <div class="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-8 shadow-lg shadow-indigo-500/20"></div>
              <p class="text-slate-400 dark:text-slate-500 font-black uppercase text-xs tracking-[0.4em] animate-pulse">Sincronizando Terminales de Planta...</p>
          </div>

          <div *ngIf="!isLoading() && processesWithOrders().length === 0" class="py-32 text-center bg-white/30 dark:bg-slate-900/30 backdrop-blur-xl rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
               <div class="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8">
                   <ng-icon name="heroInboxSolid" class="w-10 h-10 text-slate-300 dark:text-slate-600"></ng-icon>
               </div>
               <h4 class="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-2 tracking-tight">Capacidad Disponible</h4>
               <p class="text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-widest max-w-xs mx-auto mb-8">No se han detectado procesos activos con órdenes de trabajo pendientes.</p>
               <button (click)="createOrder()" class="px-10 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-slate-800 dark:hover:bg-indigo-700 transition-all shadow-2xl">
                   Lanzar Nueva Línea
               </button>
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
  public themeService = inject(ThemeService);

  processesWithOrders = signal<{ process: MfgProcess, orders: MfgProductionOrder[] }[]>([]);
  activeTab = signal<string | 'DASHBOARD'>('DASHBOARD');
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
    this.inProgressCount.set(allOrders.filter(o => o.status === 'IN_PROGRESS').length);
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
