import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { SessionService } from '@core/services/session.service';
import { ProductRepository } from '@core/repositories/product.repository';
import { NotificationService } from '@core/services/notification.service';
import { ScmProduct } from '@core/models/erp.types';
import { PurchaseOrderService } from '@core/services/purchase-order.service';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      
      <!-- HEADER & STATS -->
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="md:flex md:items-center md:justify-between">
            <div class="flex-1 min-w-0">
              <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Catálogo de Productos
              </h2>
              <p class="mt-1 text-sm text-gray-500">
                Administra tu catálogo global de productos y servicios.
              </p>
            </div>
            <div class="mt-4 flex md:mt-0 md:ml-4 gap-2">
               <button 
                routerLink="/cadena-suministro/almacenes"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <ng-icon name="heroBuildingOffice2Solid" class="h-4 w-4 mr-2"></ng-icon>
                Almacenes
              </button>
              <button 
                routerLink="/inventory/import"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <ng-icon name="heroArrowUpTraySolid" class="h-4 w-4 mr-2"></ng-icon>
                Importar
              </button>
              <button 
                routerLink="/inventory/movements/new"
                class="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <ng-icon name="heroClipboardDocumentListSolid" class="h-4 w-4 mr-2"></ng-icon>
                Movimientos Stock
              </button>
              <button 
                routerLink="/inventory/movements/history"
                class="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <ng-icon name="heroClockSolid" class="h-4 w-4 mr-2"></ng-icon>
                Historial
              </button>
              <button 
                routerLink="/inventory/new"
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <ng-icon name="heroPlusSolid" class="h-4 w-4 mr-2"></ng-icon>
                Nuevo Producto
              </button>
            </div>
          </div>

          <!-- KPI Cards -->
          <div class="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <!-- Total Products -->
            <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-100 p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-indigo-50 rounded-md p-3">
                  <ng-icon name="heroArchiveBoxSolid" class="h-6 w-6 text-indigo-600"></ng-icon>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Total Productos</dt>
                    <dd class="text-lg font-bold text-gray-900">{{ totalProducts() }}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <!-- Active Products -->
            <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-100 p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-green-50 rounded-md p-3">
                  <ng-icon name="heroCheckCircleSolid" class="h-6 w-6 text-green-600"></ng-icon>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Activos</dt>
                    <dd class="text-lg font-bold text-gray-900">{{ activeProducts() }}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <!-- Warnings (Low Stock placeholder logic) -->
            <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-100 p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-orange-50 rounded-md p-3">
                  <ng-icon name="heroExclamationTriangleSolid" class="h-6 w-6 text-orange-600"></ng-icon>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Alertas</dt>
                    <dd class="text-lg font-bold text-gray-900">0</dd>
                  </dl>
                </div>
              </div>
            </div>

             <!-- Value Estimate (Sum of sale price as placeholder) -->
             <div class="bg-white overflow-hidden shadow rounded-lg border border-gray-100 p-5">
              <div class="flex items-center">
                <div class="flex-shrink-0 bg-blue-50 rounded-md p-3">
                  <ng-icon name="heroCurrencyDollarSolid" class="h-6 w-6 text-blue-600"></ng-icon>
                </div>
                <div class="ml-5 w-0 flex-1">
                  <dl>
                    <dt class="text-sm font-medium text-gray-500 truncate">Valor Ref. (Venta)</dt>
                    <dd class="text-lg font-bold text-gray-900">{{ totalValue() | currency }}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        <!-- Toolbar -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
          <div class="max-w-lg w-full lg:max-w-xs relative">
            <label for="search" class="sr-only">Buscar</label>
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <ng-icon name="heroMagnifyingGlassSolid" class="h-5 w-5 text-gray-400"></ng-icon>
            </div>
            <input 
              id="search" 
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
              placeholder="Buscar por nombre o SKU..." 
              type="search"
              [formControl]="searchControl">
          </div>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">Estado:</span>
             <select 
               [formControl]="statusFilterControl"
               class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>

        <!-- TABLE WITH LOADING STATE -->
        <div class="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200 min-h-[400px]">
          
          <div *ngIf="isLoading()" class="h-64 flex flex-col items-center justify-center">
             <ng-icon name="heroArrowPathSolid" class="h-10 w-10 text-indigo-500 animate-spin mb-4"></ng-icon>
             <p class="text-gray-500 text-sm">Cargando inventario...</p>
          </div>

          <div *ngIf="!isLoading() && filteredProducts().length === 0" class="h-64 flex flex-col items-center justify-center text-center p-6">
            <div class="bg-gray-100 rounded-full p-4 mb-4">
               <ng-icon name="heroMagnifyingGlassSolid" class="h-8 w-8 text-gray-400"></ng-icon>
            </div>
            <h3 class="text-lg font-medium text-gray-900">No se encontraron productos</h3>
            <p class="mt-1 text-sm text-gray-500">Intenta ajustar tu búsqueda o crea un nuevo producto.</p>
             <button 
                routerLink="/inventory/new"
                class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                Nuevo Producto
              </button>
          </div>

          <table *ngIf="!isLoading() && filteredProducts().length > 0" class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto / SKU</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precios</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" class="relative px-6 py-3">
                  <span class="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let product of filteredProducts()" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                      {{ product.name.substring(0,2) }}
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ product.name }}</div>
                      <div class="text-xs text-gray-500">SKU: {{ product.sku }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {{ product.category_id ? 'Categoría UUID' : 'General' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex flex-col">
                    <span class="text-gray-900 font-semibold">{{ product.sale_price | currency }}</span>
                    <span class="text-xs text-gray-400">Costo: {{ product.cost_price | currency }}</span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span [ngClass]="{
                    'px-2 inline-flex text-xs leading-5 font-semibold rounded-full': true,
                    'bg-green-100 text-green-800': product.is_active,
                    'bg-red-100 text-red-800': !product.is_active
                  }">
                    {{ product.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                  
                  <!-- Low Stock Warning -->
                  <span *ngIf="product.reorder_point > 0 && 0 <= product.reorder_point" 
                        class="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800"
                        title="Stock Bajo">
                    Bajó Mínimo
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <button *ngIf="product.reorder_point > 0" 
                            (click)="createPurchaseOrder(product)" 
                            class="text-orange-600 hover:text-orange-900 p-1 hover:bg-orange-50 rounded"
                            title="Generar Orden de Compra">
                      <ng-icon name="heroShoppingCartSolid" class="h-4 w-4"></ng-icon>
                    </button>
                    <button (click)="editProduct(product.id)" class="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded">
                      <ng-icon name="heroPencilSquareSolid" class="h-4 w-4"></ng-icon>
                    </button>
                    <button (click)="deleteProduct(product.id)" class="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded">
                      <ng-icon name="heroTrashSolid" class="h-4 w-4"></ng-icon>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Paginator Placeholder -->
          <div *ngIf="!isLoading() && filteredProducts().length > 0" class="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
             <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                   <p class="text-sm text-gray-700"> Mostrando <span class="font-medium">{{ filteredProducts().length }}</span> resultados </p>
                </div>
                <!-- Pagination buttons would go here -->
             </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InventoryComponent implements OnInit {
  // Config
  private session = inject(SessionService);
  private productRepo = inject(ProductRepository);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private poService = inject(PurchaseOrderService);

  // State
  products = signal<ScmProduct[]>([]);
  isLoading = signal(true);

  // Filters
  searchControl = new FormBuilder().control('');
  statusFilterControl = new FormBuilder().control('all');

  // Computed
  filteredProducts = computed(() => {
    const raw = this.products();
    const term = this.searchControl.value?.toLowerCase() || '';
    const status = this.statusFilterControl.value;

    return raw.filter(p => {
      const matchesTerm = p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
      const matchesStatus = status === 'all'
        ? true
        : (status === 'active' ? p.is_active : !p.is_active);
      return matchesTerm && matchesStatus;
    });
  });

  totalProducts = computed(() => this.products().length);
  activeProducts = computed(() => this.products().filter(p => p.is_active).length);
  totalValue = computed(() => this.products().reduce((acc, p) => acc + (p.sale_price || 0), 0));

  constructor() {
    this.searchControl.valueChanges.subscribe(() => {
      // Trigger computed checks if needed, signals handle it automatically usually
    });
    this.statusFilterControl.valueChanges.subscribe(() => {
      // Signals handle reactivity
    });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    const tenantId = this.session.currentTenantId();

    if (!tenantId) {
      this.notification.error('No se ha seleccionado una organización.');
      this.router.navigate(['/companies']);
      return;
    }

    try {
      const data = await this.productRepo.getAll(tenantId);
      this.products.set(data);
    } catch (e: any) {
      console.error(e);
      this.notification.error('Error al cargar inventario.');
    } finally {
      this.isLoading.set(false);
    }
  }

  editProduct(id: string) {
    this.router.navigate(['/inventory/edit', id]);
  }

  async deleteProduct(id: string) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      await this.productRepo.delete(id);
      this.notification.success('Producto eliminado.');
      this.loadData();
    } catch (e) {
      this.notification.error('Error al eliminar.');
    }
  }

  async createPurchaseOrder(product: ScmProduct) {
    if (!confirm(`¿Generar Orden de Compra para ${product.name}?`)) return;

    try {
      const tenantId = this.session.currentTenantId();
      if (!tenantId) return;

      await this.poService.createFromLowStock(tenantId, product, product.reorder_quantity || 10);
      this.notification.success('Orden de Compra generada (Borrador)');
    } catch (e) {
      console.error(e);
      this.notification.error('Error al generar orden');
    }
  }
}
