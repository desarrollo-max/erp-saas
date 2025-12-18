import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SalesRepository } from '@core/repositories/sales.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { SalesOrder } from '@core/models/erp.types';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 animate-fade-in">
      
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div class="p-2 bg-pink-500 rounded-lg shadow-lg shadow-pink-200 dark:shadow-none">
              <ng-icon name="heroPresentationChartLineSolid" class="text-white w-6 h-6"></ng-icon>
            </div>
            <h1 class="text-3xl font-black tracking-tight">Gestión de Pedidos</h1>
          </div>
          <p class="text-slate-500 dark:text-slate-400 font-medium">Visualiza y gestiona todas las órdenes de venta del sistema.</p>
        </div>
        
        <div class="flex gap-3 w-full md:w-auto">
          <button [routerLink]="['/ventas/mayoreo/nuevo']" 
                  class="flex-grow md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none font-bold flex items-center justify-center gap-2 transform active:scale-95">
            <ng-icon name="heroPlusSolid" class="w-5 h-5"></ng-icon>
            Nuevo Pedido
          </button>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="flex-grow p-8 overflow-y-auto">
        
        <!-- STATS (Optional but adds value) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
           <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pedidos</p>
              <h3 class="text-2xl font-black">{{ orders().length }}</h3>
           </div>
           <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Confirmados</p>
              <h3 class="text-2xl font-black text-green-500">{{ getCountByStatus('CONFIRMED') }}</h3>
           </div>
           <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Cotizaciones</p>
              <h3 class="text-2xl font-black text-yellow-500">{{ getCountByStatus('QUOTE') }}</h3>
           </div>
           <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Ventas</p>
              <h3 class="text-2xl font-black text-indigo-600">{{ getTotalSales() | currency }}</h3>
           </div>
        </div>
        
        <!-- LOADING -->
        <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-32 opacity-50">
          <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p class="font-bold tracking-widest uppercase text-xs">Cargando datos maestros...</p>
        </div>

        <!-- EMPTY -->
        <div *ngIf="!isLoading() && orders().length === 0" class="flex flex-col items-center justify-center py-32 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div class="p-6 bg-slate-50 dark:bg-slate-800 rounded-full mb-6">
            <ng-icon name="heroDocumentTextSolid" class="w-16 h-16 text-slate-300"></ng-icon>
          </div>
          <h3 class="text-xl font-black mb-2">Sin actividad comercial</h3>
          <p class="text-slate-500 dark:text-slate-400 mb-8 max-w-xs text-center">No se han registrado pedidos en este periodo. Comienza creando una nueva cotización.</p>
          <button [routerLink]="['/ventas/mayoreo/nuevo']" class="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95">
             Generar Primer Pedido
          </button>
        </div>

        <!-- LIST -->
        <div *ngIf="!isLoading() && orders().length > 0" class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead class="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th scope="col" class="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Folio</th>
                  <th scope="col" class="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Cliente / Empresa</th>
                  <th scope="col" class="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Fecha Emisión</th>
                  <th scope="col" class="px-8 py-5 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                  <th scope="col" class="px-8 py-5 text-right text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Importe Total</th>
                  <th scope="col" class="relative px-8 py-5"><span class="sr-only">Control</span></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                <tr *ngFor="let order of orders()" class="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-200">
                  <td class="px-8 py-6 whitespace-nowrap">
                    <span class="text-sm font-black text-indigo-600 dark:text-indigo-400">#{{ order.order_number }}</span>
                  </td>
                  <td class="px-8 py-6 whitespace-nowrap text-sm">
                    <div class="flex flex-col">
                      <span class="font-bold text-slate-900 dark:text-white">{{ order.sales_companies?.name || 'Venta General' }}</span>
                      <span class="text-xs text-slate-400">{{ order.customer_id ? 'Cuenta Corporativa' : 'Consumidor Final' }}</span>
                    </div>
                  </td>
                  <td class="px-8 py-6 whitespace-nowrap text-sm font-medium text-slate-500">{{ order.order_date | date:'dd MMM, yyyy' }}</td>
                  <td class="px-8 py-6 whitespace-nowrap">
                    <span [ngClass]="{
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50': order.status === 'QUOTE',
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50': order.status === 'CONFIRMED',
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400': order.status === 'DRAFT',
                      'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50': order.status === 'CANCELLED'
                    }" class="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full">
                      {{ order.status === 'QUOTE' ? 'Cotización' : (order.status === 'CONFIRMED' ? 'Confirmado' : order.status) }}
                    </span>
                  </td>
                  <td class="px-8 py-6 whitespace-nowrap text-right">
                    <span class="text-sm font-black text-slate-900 dark:text-white">{{ order.total_amount | currency }}</span>
                  </td>
                  <td class="px-8 py-6 whitespace-nowrap text-right text-sm">
                    <button [routerLink]="['/ventas/mayoreo/editar', order.id]" class="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                       <ng-icon name="heroChevronRightSolid" class="w-6 h-6"></ng-icon>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class OrdersComponent implements OnInit {
  private salesRepo = inject(SalesRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);

  orders = signal<SalesOrder[]>([]);
  isLoading = signal(true);

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    this.isLoading.set(true);
    try {
      const tenantId = this.session.currentTenantId();
      if (tenantId) {
        const data = await this.salesRepo.getOrders(tenantId);
        this.orders.set(data);
      }
    } catch (error) {
      console.error(error);
      this.notification.error('Error al sincronizar con el departamento de ventas');
    } finally {
      this.isLoading.set(false);
    }
  }

  getCountByStatus(status: string): number {
    return this.orders().filter(o => o.status === status).length;
  }

  getTotalSales(): number {
    return this.orders()
      .filter(o => o.status === 'CONFIRMED')
      .reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
  }
}
