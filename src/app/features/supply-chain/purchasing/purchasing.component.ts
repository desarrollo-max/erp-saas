import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import { APP_ICONS } from '@core/constants/app-icons';
import * as heroIcons from '@ng-icons/heroicons/solid';

import { PurchaseOrderRepository } from '@core/repositories/purchase-order.repository';
import { PurchaseOrder } from '@core/models/erp.types';
import { SessionService } from '@core/services/session.service';

@Component({
  selector: 'app-purchasing',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconsModule, CurrencyPipe, DatePipe],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="flex flex-col h-full bg-gray-50 dark:bg-slate-900">
      
      <!-- HEADER -->
      <div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-5 flex items-center justify-between shadow-sm sticky top-0 z-10">
         <div>
           <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
             <div class="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg text-cyan-600 dark:text-cyan-400">
                <ng-icon name="heroShoppingBagSolid" class="w-6 h-6"></ng-icon>
             </div>
             Ordenes de Compra
           </h1>
           <p class="text-sm text-gray-500 mt-1">Gestione sus pedidos a proveedores, recepciones y facturas.</p>
         </div>
         <div class="flex gap-3">
           <button (click)="manageSuppliers()" class="bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 px-4 py-2.5 rounded-lg font-medium shadow-sm transition flex items-center gap-2">
             <ng-icon name="heroUsersSolid" class="w-5 h-5"></ng-icon>
             Proveedores
           </button>
           <button (click)="createOrder()" class="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition flex items-center gap-2">
             <ng-icon name="heroPlusCircleSolid" class="w-5 h-5"></ng-icon>
             Nueva Orden
           </button>
         </div>
      </div>

      <!-- CONTENT -->
      <div class="flex-1 overflow-auto p-6">
         
         <div *ngIf="isLoading()" class="flex flex-col items-center justify-center h-64">
             <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mb-4"></div>
             <p class="text-gray-500">Cargando órdenes...</p>
         </div>

         <div *ngIf="!isLoading()" class="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-200 dark:border-slate-700 overflow-hidden">
             
             <!-- Empty State -->
             <div *ngIf="orders().length === 0" class="flex flex-col items-center justify-center py-20 text-gray-400">
                 <ng-icon name="heroDocumentTextSolid" class="w-16 h-16 mb-4 opacity-50"></ng-icon>
                 <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-200">No hay órdenes de compra</h3>
                 <p class="text-sm max-w-xs text-center mt-2">Comience creando su primera orden para abastecer el inventario.</p>
                 <button (click)="createOrder()" class="mt-6 text-cyan-600 font-medium hover:text-cyan-700 hover:underline">Crear Orden Ahora</button>
             </div>

             <!-- Orders Table -->
             <div *ngIf="orders().length > 0" class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                   <thead class="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                         <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Folio</th>
                         <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Proveedor</th>
                         <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
                         <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                         <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                         <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                      </tr>
                   </thead>
                   <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      <tr *ngFor="let order of orders()" class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                         <td class="px-6 py-4 whitespace-nowrap">
                            <span class="font-mono font-medium text-gray-900 dark:text-white">{{ order.po_number || '---' }}</span>
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap">
                            <div class="text-sm text-gray-900 dark:text-gray-200 font-medium">{{ order.supplier?.name || 'Proveedor desconocido' }}</div>
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {{ order.po_date | date:'shortDate' }}
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                  [ngClass]="getStatusClass(order.status)">
                               {{ getStatusLabel(order.status) }}
                            </span>
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-gray-100">
                            {{ order.total_amount | currency }}
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button (click)="editOrder(order)" class="text-cyan-600 hover:text-cyan-900 dark:hover:text-cyan-400 transition-colors mr-3" title="Editar / Ver">
                               <ng-icon name="heroPencilSquareSolid" class="w-5 h-5"></ng-icon>
                            </button>
                            <!-- FUTURE: Add Delete / Receive buttons here -->
                         </td>
                      </tr>
                   </tbody>
                </table>
             </div>
         </div>
      </div>
    </div>
  `
})
export class PurchasingComponent implements OnInit {
  private router = inject(Router);
  private poRepo = inject(PurchaseOrderRepository);
  private session = inject(SessionService);

  orders = signal<PurchaseOrder[]>([]);
  isLoading = signal(true);

  async ngOnInit() {
    const tenantId = this.session.currentTenantId();
    if (!tenantId) return;

    try {
      // Fetch orders (assuming getAll exists or similar)
      const data = await this.poRepo.getAll(tenantId);
      this.orders.set(data);
    } catch (error) {
      console.error('Error fetching orders', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  createOrder() {
    this.router.navigate(['/purchasing/orders/new']);
  }

  manageSuppliers() {
    this.router.navigate(['/cadena-suministro/proveedores']);
  }

  editOrder(order: PurchaseOrder) {
    this.router.navigate(['/purchasing/orders/edit', order.id]);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'SENT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800';
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
