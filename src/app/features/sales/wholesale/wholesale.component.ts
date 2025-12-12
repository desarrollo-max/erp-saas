import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { SalesRepository } from '@core/repositories/sales.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { SalesOrder } from '@core/models/erp.types';

@Component({
  selector: 'app-wholesale',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconsModule],
  template: `
    <div class="flex flex-col h-full bg-[var(--app-bg)] text-[var(--app-text)]">
      
      <!-- HEADER -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 border-b border-[var(--border-color)] bg-[var(--card-bg)]">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <ng-icon name="heroBriefcaseSolid" class="text-indigo-600 w-8 h-8"></ng-icon>
            Venta a Mayoreo
          </h1>
          <p class="text-[var(--app-text-muted)] mt-1">Gestiona cotizaciones y pedidos para clientes mayoristas.</p>
        </div>
        <button [routerLink]="['/ventas/mayoreo/nuevo']" 
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg font-medium">
          <ng-icon name="heroPlusSolid" class="w-5 h-5"></ng-icon>
          Nueva Cotización
        </button>
      </div>

      <!-- CONTENT -->
      <div class="flex-grow p-6 overflow-y-auto">
        
        <!-- LOADING -->
        <div *ngIf="isLoading()" class="flex flex-col items-center justify-center h-64 opacity-50">
          <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Cargando pedidos...</p>
        </div>

        <!-- EMPTY -->
        <div *ngIf="!isLoading() && orders().length === 0" class="flex flex-col items-center justify-center h-64 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--subtle-bg)]">
          <ng-icon name="heroDocumentTextSolid" class="w-16 h-16 text-[var(--app-text-muted)] mb-4 opacity-50"></ng-icon>
          <h3 class="text-lg font-semibold text-[var(--app-text-muted)]">No hay cotizaciones registradas</h3>
          <p class="text-sm text-[var(--app-text-muted)] mb-4">Crea una nueva cotización para comenzar.</p>
        </div>

        <!-- LIST -->
        <div *ngIf="!isLoading() && orders().length > 0" class="bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-sm">
          <table class="min-w-full divide-y divide-[var(--border-color)]">
            <thead class="bg-[var(--subtle-bg)]">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-[var(--app-text-muted)] uppercase tracking-wider">Folio</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-[var(--app-text-muted)] uppercase tracking-wider">Cliente</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-[var(--app-text-muted)] uppercase tracking-wider">Fecha</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-[var(--app-text-muted)] uppercase tracking-wider">Estado</th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-[var(--app-text-muted)] uppercase tracking-wider">Total</th>
                <th scope="col" class="relative px-6 py-3"><span class="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-color)] bg-[var(--card-bg)]">
              <tr *ngFor="let order of orders()" class="hover:bg-[var(--subtle-bg)] transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">{{ order.order_number }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">{{ order.sales_companies?.name || 'Cliente Desconocido' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--app-text-muted)]">{{ order.order_date | date:'mediumDate' }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="{
                    'bg-yellow-100 text-yellow-800': order.status === 'QUOTE',
                    'bg-green-100 text-green-800': order.status === 'CONFIRMED',
                    'bg-gray-100 text-gray-800': order.status === 'DRAFT',
                    'bg-red-100 text-red-800': order.status === 'CANCELLED'
                  }" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ order.status === 'QUOTE' ? 'Cotización' : (order.status === 'CONFIRMED' ? 'Confirmado' : order.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">{{ order.total_amount | currency }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a [routerLink]="['/ventas/mayoreo/editar', order.id]" class="text-indigo-600 hover:text-indigo-900 font-semibold mr-2">Ver / Editar</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  `
})
export class WholesaleComponent implements OnInit {
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
      this.notification.error('Error al cargar pedidos');
    } finally {
      this.isLoading.set(false);
    }
  }
}
