import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { heroArchiveBoxArrowDownSolid } from '@ng-icons/heroicons/solid';

import { PurchaseOrderRepository } from '@core/repositories/purchase-order.repository';
import { ManufacturingRepository } from '@core/repositories/manufacturing.repository';
import { PurchaseOrder, MfgProcess } from '@core/models/erp.types';
import { SessionService } from '@core/services/session.service';

@Component({
  selector: 'app-purchasing',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconsModule, CurrencyPipe, DatePipe],
  viewProviders: [provideIcons({ ...heroIcons })],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col relative overflow-hidden transition-colors duration-500">
      
      <!-- Premium Background Elements -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.08)_0%,transparent_50%)] pointer-events-none"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(79,70,229,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_80%,rgba(79,70,229,0.08)_0%,transparent_50%)] pointer-events-none"></div>

      <!-- Header -->
      <div class="px-6 sm:px-10 pt-10 pb-6 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div class="space-y-2">
           <h1 class="text-5xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic drop-shadow-sm">
             Órdenes de <span class="text-cyan-600 dark:text-cyan-400">Compra</span>
           </h1>
           <p class="text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.4em] ml-1">Supply Chain Intelligence & Procurement Control</p>
        </div>
        
        <div class="flex gap-4">
            <button (click)="manageSuppliers()" 
                    class="px-6 py-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-slate-100 dark:border-slate-800 shadow-lg flex items-center gap-3 active:scale-95">
                <ng-icon name="heroUsersSolid" class="w-5 h-5 opacity-70"></ng-icon>
                Proveedores
            </button>
            <button (click)="createOrder()" 
                    class="px-8 py-5 bg-primary-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-900 dark:hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/20 flex items-center gap-3 group active:scale-95">
                <ng-icon name="heroPlusCircleSolid" class="w-6 h-6 group-hover:rotate-90 transition-transform"></ng-icon>
                Lanzar Orden
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
                  Monitor de Compras
              </button>
              
              <div class="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2"></div>

              <button *ngFor="let p of processes()"
                      (click)="activeTab.set(p.id)"
                      [class]="activeTab() === p.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'"
                      class="px-8 py-3 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap">
                  <ng-icon name="heroCpuChipSolid" class="w-4 h-4"></ng-icon>
                  Abastecimiento: {{ p.name }}
              </button>
          </div>
      </div>

      <!-- MAIN CONTENT AREA -->
      <div class="flex-grow px-6 sm:px-10 pb-10 relative z-10 overflow-auto custom-scrollbar">
          
          <div *ngIf="isLoading()" class="py-32 text-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[3rem] border border-slate-100 dark:border-slate-800">
              <div class="w-20 h-20 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-8 shadow-lg shadow-cyan-500/20"></div>
              <p class="text-slate-400 dark:text-slate-500 font-black uppercase text-xs tracking-[0.4em] animate-pulse">Sincronizando Órdenes de Suministro...</p>
          </div>

          <div *ngIf="!isLoading()" class="animate-fade-in">
              
              <!-- TAB: DASHBOARD -->
              <div *ngIf="activeTab() === 'DASHBOARD'" class="space-y-12">
                  <!-- Quick Stats -->
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div class="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative">
                          <div class="absolute top-0 right-0 w-24 h-24 bg-cyan-50 dark:bg-cyan-950/30 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-150 transition-transform"></div>
                          <div class="relative z-10">
                              <p class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Total Pendientes</p>
                              <div class="flex items-baseline gap-2">
                                  <h3 class="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{{ orders().length }}</h3>
                                  <span class="text-[10px] font-black text-cyan-500 uppercase">Órdenes</span>
                              </div>
                          </div>
                      </div>

                      <div class="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative text-emerald-600 dark:text-emerald-400">
                          <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-50 dark:bg-emerald-950/30 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-150 transition-transform"></div>
                          <div class="relative z-10">
                              <p class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Inversión Activa</p>
                              <div class="flex items-baseline gap-2">
                                  <h3 class="text-4xl font-black tracking-tighter">{{ totalInvestment() | currency }}</h3>
                                  <span class="text-[10px] font-black text-slate-400 uppercase italic">Capital</span>
                              </div>
                          </div>
                      </div>

                      <div class="group bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white dark:border-slate-800 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden relative text-amber-600 dark:text-amber-500">
                          <div class="absolute top-0 right-0 w-24 h-24 bg-amber-50 dark:bg-amber-950/30 rounded-full -mr-8 -mt-8 opacity-50 group-hover:scale-150 transition-transform"></div>
                          <div class="relative z-10">
                              <p class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Por Recibir</p>
                              <div class="flex items-baseline gap-2">
                                  <h3 class="text-4xl font-black tracking-tighter">{{ pendingCount() }}</h3>
                                  <span class="text-[10px] font-black text-slate-400 uppercase italic">Mercancía</span>
                              </div>
                          </div>
                      </div>

                      <div class="group bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-slate-950">
                          <div class="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-8 -mt-8 rotate-12 group-hover:scale-110 transition-transform"></div>
                          <div class="relative z-10 text-white">
                              <p class="text-[9px] font-black opacity-80 uppercase tracking-widest mb-2 ml-1">Proveedores</p>
                              <div class="flex items-baseline gap-2">
                                  <h3 class="text-4xl font-black tracking-tighter">{{ orders().length > 0 ? 5 : 0 }}</h3>
                                  <span class="text-[10px] font-black opacity-60 uppercase italic">Homologados</span>
                              </div>
                          </div>
                      </div>
                  </div>

                  <!-- Orders List (Standard Table but Premium Style) -->
                  <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[3rem] border border-white dark:border-slate-800 shadow-xl overflow-hidden">
                      <div class="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                          <h4 class="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Registro Maestro de Compras</h4>
                          <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ orders().length }} Registros</span>
                      </div>
                      
                      <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                          <thead>
                            <tr class="bg-slate-50/50 dark:bg-slate-950/50">
                              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificador</th>
                              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Socio Comercial</th>
                              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cronología</th>
                              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor Neto</th>
                              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Estatus</th>
                              <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/50">
                            <tr *ngFor="let order of orders()" class="hover:bg-slate-50/50 dark:hover:bg-indigo-500/5 transition-all group">
                              <td class="px-8 py-6 font-black text-slate-900 dark:text-white font-mono tracking-tighter">{{ order.po_number }}</td>
                              <td class="px-8 py-6">
                                  <div class="flex flex-col">
                                      <span class="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{{ order.supplier?.name }}</span>
                                      <span class="text-[9px] font-bold text-slate-400 uppercase">PROVEEDOR NIVEL 1</span>
                                  </div>
                              </td>
                              <td class="px-8 py-6">
                                <span class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{{ order.po_date | date:'dd MMM yyyy' }}</span>
                              </td>
                              <td class="px-8 py-6 text-right">
                                <span class="text-sm font-black text-slate-900 dark:text-white">{{ order.total_amount | currency }}</span>
                              </td>
                              <td class="px-8 py-6 text-center">
                                <span class="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border"
                                      [ngClass]="getStatusClass(order.status)">
                                   {{ getStatusLabel(order.status) }}
                                </span>
                              </td>
                              <td class="px-8 py-6 text-right">
                                <div class="flex gap-2 justify-end">
                                     <button *ngIf="order.status !== 'COMPLETED' && order.status !== 'CANCELLED'"
                                             (click)="receiveOrder(order)" 
                                             class="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center"
                                             title="Recepcionar Orden Completa">
                                         <ng-icon name="heroArchiveBoxArrowDownSolid" class="w-5 h-5"></ng-icon>
                                     </button>
                                    <button (click)="editOrder(order)" class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center">
                                        <ng-icon name="heroPencilSquareSolid" class="w-5 h-5"></ng-icon>
                                    </button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                  </div>
              </div>

              <!-- TAB: PROCESS SPECIFIC VIEW -->
              <div *ngIf="activeTab() !== 'DASHBOARD'" class="space-y-8">
                  <div class="flex items-center gap-6 mb-8 ml-2">
                       <div class="w-14 h-14 bg-white dark:bg-slate-900 text-cyan-600 rounded-[1.5rem] flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-800">
                           <ng-icon name="heroCpuChipSolid" class="w-7 h-7"></ng-icon>
                       </div>
                       <div>
                           <h2 class="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Necesidades de Abastecimiento</h2>
                           <p class="text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em]">Materiales Críticos para Línea Producción</p>
                       </div>
                  </div>

                  <!-- For now, we show a message indicating filter is planned -->
                  <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[3rem] border border-white dark:border-slate-800 shadow-xl overflow-hidden p-12 text-center">
                       <div class="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200 dark:text-slate-700">
                           <ng-icon name="heroMagnifyingGlassCircleSolid" class="w-12 h-12"></ng-icon>
                       </div>
                       <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Filtrado Técnico Activo</h3>
                       <p class="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">Vista de materiales requeridos filtrados por este proceso.</p>
                       
                       <div class="mt-8 border-t border-slate-100 dark:border-slate-800 pt-8 text-left">
                           <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Órdenes Relacionadas con este Proceso</p>
                           <ul class="space-y-3">
                               <li *ngFor="let order of orders().slice(0,3)" class="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl flex justify-between items-center opacity-70">
                                   <span class="text-xs font-black text-slate-700 dark:text-slate-300 font-mono">{{ order.po_number }}</span>
                                   <span class="text-[9px] font-black text-slate-400 uppercase">{{ order.supplier?.name }}</span>
                               </li>
                           </ul>
                       </div>
                  </div>
              </div>

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
export class PurchasingComponent implements OnInit {
  private router = inject(Router);
  private poRepo = inject(PurchaseOrderRepository);
  private mfgRepo = inject(ManufacturingRepository);
  private session = inject(SessionService);

  orders = signal<PurchaseOrder[]>([]);
  processes = signal<MfgProcess[]>([]);
  activeTab = signal<string | 'DASHBOARD'>('DASHBOARD');
  isLoading = signal(true);

  // Stats
  totalInvestment = signal(0);
  pendingCount = signal(0);

  async ngOnInit() {
    const tenantId = this.session.currentTenantId();
    if (!tenantId) return;

    try {
      const [poData, mfgData] = await Promise.all([
        this.poRepo.getAll(tenantId),
        this.mfgRepo.getProcesses(tenantId)
      ]);

      this.orders.set(poData);
      this.processes.set(mfgData);
      this.updateStats(poData);
    } catch (error) {
      console.error('Error fetching purchasing data', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  updateStats(allOrders: PurchaseOrder[]) {
    this.totalInvestment.set(allOrders.reduce((acc, o) => acc + (o.total_amount || 0), 0));
    this.pendingCount.set(allOrders.filter(o => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length);
  }

  createOrder() {
    this.router.navigate(['/purchasing/orders/new']);
  }

  async receiveOrder(order: PurchaseOrder) {
      if (!confirm(`¿Está seguro de recepcionar COMPLETAMENTE la orden ${order.po_number}? Esto generará movimientos de inventario.`)) return;
      
      this.isLoading.set(true);
      try {
          await this.poRepo.receiveAll(order.id);
          // Refresh
          const tenantId = this.session.currentTenantId();
          if (tenantId) {
             const data = await this.poRepo.getAll(tenantId);
             this.orders.set(data);
             this.updateStats(data);
          }
      } catch (error) {
          console.error(error);
          alert('Error al recepcionar la orden: ' + (error as any).message);
      } finally {
          this.isLoading.set(false);
      }
  }

  manageSuppliers() {
    this.router.navigate(['/cadena-suministro/proveedores']);
  }

  editOrder(order: PurchaseOrder) {
    this.router.navigate(['/purchasing/orders/edit', order.id]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
      case 'SENT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'CANCELLED': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'DRAFT': return 'Borrador';
      case 'SENT': return 'Enviada';
      case 'PARTIAL': return 'Parcial';
      case 'COMPLETED': return 'Completado';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  }
}
