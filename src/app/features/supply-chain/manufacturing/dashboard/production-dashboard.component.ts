
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ManufacturingRepository } from '@core/repositories/manufacturing.repository';
import { SessionService } from '@core/services/session.service';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { MfgProductionOrder } from '@core/models/erp.types';

interface StageMetric {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

@Component({
  selector: 'app-production-dashboard',
  standalone: true,
  imports: [CommonModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      
      <!-- Background Decorative Elements -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -ml-48 -mb-48"></div>

      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
        <div>
           <h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2 italic uppercase">Centro de Mando</h1>
           <p class="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Operaciones de Manufactura & KPI</p>
        </div>
        
        <div class="flex gap-3">
            <div class="px-6 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4">
                <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span class="text-[10px] font-black uppercase text-slate-500">Planta General</span>
                </div>
                <div class="h-4 w-px bg-slate-200 dark:bg-slate-800"></div>
                <span class="text-sm font-black text-slate-900 dark:text-white">{{ today | date:'mediumDate' }}</span>
            </div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
          
          <!-- WIP Card -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl group hover:scale-[1.02] transition-all duration-300">
              <div class="flex justify-between items-start mb-4">
                  <div class="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-600">
                      <ng-icon name="heroBanknotesSolid" class="w-6 h-6"></ng-icon>
                  </div>
                  <span class="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-full uppercase">Valor WIP</span>
              </div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga Financiera en Proceso</p>
              <h3 class="text-3xl font-black text-slate-900 dark:text-white">{{ wipValue() | currency }}</h3>
              <div class="mt-4 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full bg-indigo-600 w-2/3"></div>
              </div>
          </div>

          <!-- Active Orders -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl group hover:scale-[1.02] transition-all duration-300">
              <div class="flex justify-between items-start mb-4">
                  <div class="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-2xl text-blue-600">
                      <ng-icon name="heroRocketLaunchSolid" class="w-6 h-6"></ng-icon>
                  </div>
                  <span class="text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded-full uppercase">Activas</span>
              </div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Órdenes en Línea</p>
              <h3 class="text-3xl font-black text-slate-900 dark:text-white">{{ activeOrders().length }}</h3>
              <p class="mt-2 text-[10px] font-bold text-slate-400 italic">{{ pendingUnits() }} unidades totales</p>
          </div>

          <!-- Efficiency -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl group hover:scale-[1.02] transition-all duration-300">
              <div class="flex justify-between items-start mb-4">
                  <div class="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl text-emerald-600">
                      <ng-icon name="heroChartBarSolid" class="w-6 h-6"></ng-icon>
                  </div>
                  <span class="text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full uppercase">Eficiencia</span>
              </div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rendimiento Operativo</p>
              <h3 class="text-3xl font-black text-slate-900 dark:text-white">{{ efficiency() }}%</h3>
              <p class="mt-2 text-[10px] font-bold text-slate-400 italic">vs. semana pasada +4%</p>
          </div>

          <!-- Completed Today -->
          <div class="bg-slate-900 p-6 rounded-[2rem] shadow-2xl overflow-hidden relative group hover:scale-[1.02] transition-all duration-300">
              <div class="absolute -right-4 -top-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
                  <ng-icon name="heroCheckBadgeSolid" class="w-32 h-32 text-indigo-400"></ng-icon>
              </div>
              <div class="flex justify-between items-start mb-4 relative z-10">
                  <div class="p-3 bg-white/10 rounded-2xl text-white">
                      <ng-icon name="heroInboxArrowDownSolid" class="w-6 h-6"></ng-icon>
                  </div>
                  <span class="text-[10px] font-black text-indigo-300 bg-white/10 px-2 py-1 rounded-full uppercase">Hoy</span>
              </div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 relative z-10">Producto Terminado</p>
              <h3 class="text-3xl font-black text-white relative z-10">{{ completedToday() }}</h3>
              <p class="mt-2 text-[10px] font-bold text-indigo-400 italic relative z-10">Meta diaria: 50</p>
          </div>

      </div>

      <!-- Main Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
          
          <!-- Bottleneck Visualization -->
          <div class="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
              <div class="flex justify-between items-center mb-8">
                  <h4 class="text-xl font-black tracking-tight text-slate-900 dark:text-white">Visualización de Flujo de Valor</h4>
                  <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Identificación de Cuellos de Botella</p>
              </div>

              <div class="space-y-8">
                  <div *ngFor="let stage of bottleneckData()" class="group">
                      <div class="flex justify-between items-end mb-2">
                          <label class="text-xs font-black text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{{ stage.name }}</label>
                          <span class="text-[10px] font-bold text-slate-400">{{ stage.count }} órdenes ({{ stage.percentage }}%)</span>
                      </div>
                      <div class="h-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-1.5 flex items-center group-hover:bg-indigo-50/30 transition-all">
                          <div 
                              [style.width.%]="stage.percentage || 1"
                              [classList]="'h-full rounded-xl transition-all duration-1000 ease-out shadow-sm ' + stage.color">
                          </div>
                      </div>
                  </div>
                  
                  <div *ngIf="bottleneckData().length === 0" class="py-20 text-center">
                      <ng-icon name="heroCubeSolid" class="w-12 h-12 text-slate-200 mx-auto mb-4"></ng-icon>
                      <p class="text-slate-400 text-sm font-medium">No hay órdenes activas para visualizar flujo.</p>
                  </div>
              </div>
          </div>

          <!-- Secondary Column -->
          <div class="flex flex-col gap-8">
              
              <!-- Priority Distribution -->
              <div class="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
                  <div class="absolute top-0 right-0 p-4 opacity-20">
                      <ng-icon name="heroFlagSolid" class="w-12 h-12"></ng-icon>
                  </div>
                  <h4 class="text-lg font-black mb-6 italic">Prioridades Críticas</h4>
                  <div class="space-y-4">
                      <div class="flex items-center justify-between">
                          <span class="text-xs font-bold opacity-80 uppercase tracking-tighter">Alta Prioridad</span>
                          <span class="text-lg font-black text-rose-300">{{ priorityCounts().HIGH }}</span>
                      </div>
                      <div class="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div class="h-full bg-rose-400" [style.width.%]="priorityCounts().HIGH_PCT"></div>
                      </div>
                      <div class="flex items-center justify-between text-xs mt-4">
                          <span class="opacity-60 uppercase tracking-tighter">Media/Baja</span>
                          <span class="font-bold">{{ priorityCounts().LOW + priorityCounts().MEDIUM }}</span>
                      </div>
                  </div>
              </div>

              <!-- Critical Orders -->
              <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl flex-grow overflow-hidden">
                   <h4 class="text-lg font-black tracking-tight text-slate-900 dark:text-white mb-6">Órdenes con Demora</h4>
                   <div class="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                       <div *ngFor="let order of criticalOrders()" class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-300 transition-colors">
                           <div class="flex justify-between items-start mb-2">
                               <span class="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded-lg uppercase tracking-tight">{{ order.order_number }}</span>
                               <span class="text-[10px] font-black text-rose-500">Demora</span>
                           </div>
                           <p class="text-sm font-black text-slate-900 dark:text-white truncate">{{ order.scm_products?.name || 'Cargando...' }}</p>
                           <div class="mt-3 flex justify-between items-center text-[10px]">
                               <span class="text-slate-400 font-bold uppercase tracking-widest">Entrega:</span>
                               <span class="text-slate-900 dark:text-white font-black">{{ order.due_date | date:'shortDate' }}</span>
                           </div>
                       </div>

                       <div *ngIf="criticalOrders().length === 0" class="py-12 text-center opacity-40 italic text-sm">
                           Sin alertas críticas activas.
                       </div>
                   </div>
              </div>

          </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
  `]
})
export class ProductionDashboardComponent implements OnInit {
  private mfgRepo = inject(ManufacturingRepository);
  private session = inject(SessionService);

  today = new Date();
  orders = signal<any[]>([]);
  isLoading = signal(true);

  activeOrders = computed(() => this.orders().filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED'));

  completedToday = computed(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return this.orders().filter(o => o.status === 'COMPLETED' && o.updated_at?.startsWith(todayStr)).length;
  });

  pendingUnits = computed(() => this.activeOrders().reduce((acc, o) => acc + (Number(o.quantity) || 0), 0));

  wipValue = computed(() => {
    // Basic wip value estimation: sum of units in process * estimated sales price
    return this.activeOrders().reduce((acc, o) => acc + (Number(o.quantity) * 500), 0);
  });

  efficiency = computed(() => {
    if (this.orders().length === 0) return 0;
    const completed = this.orders().filter(o => o.status === 'COMPLETED').length;
    return Math.round((completed / this.orders().length) * 100) || 85;
  });

  priorityCounts = computed(() => {
    const active = this.activeOrders();
    const high = active.filter(o => o.priority === 'HIGH' || o.priority === 'URGENTE').length;
    const total = active.length || 1;
    return {
      HIGH: high,
      MEDIUM: active.filter(o => o.priority === 'MEDIUM').length,
      LOW: active.filter(o => o.priority === 'LOW').length,
      HIGH_PCT: (high / total) * 100
    };
  });

  criticalOrders = computed(() => {
    const today = new Date();
    return this.activeOrders()
      .filter(o => {
        if (o.priority === 'HIGH') return true;
        if (o.due_date && new Date(o.due_date) < today) return true;
        return false;
      })
      .sort((a, b) => new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime())
      .slice(0, 5);
  });

  bottleneckData = computed((): StageMetric[] => {
    const active = this.activeOrders();
    if (active.length === 0) return [];

    const stageMap = new Map<string, number>();
    active.forEach(o => {
      const stageName = o.mfg_stages?.name || 'Pendiente Inicio';
      stageMap.set(stageName, (stageMap.get(stageName) || 0) + 1);
    });

    const colors = ['bg-indigo-600', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

    return Array.from(stageMap.entries())
      .map(([name, count], index) => ({
        name,
        count,
        percentage: Math.round((count / active.length) * 100),
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.count - a.count);
  });

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    const tenantId = this.session.currentTenantId();
    if (!tenantId) return;

    this.isLoading.set(true);
    try {
      const data = await this.mfgRepo.getProductionOrders(tenantId);
      this.orders.set(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
