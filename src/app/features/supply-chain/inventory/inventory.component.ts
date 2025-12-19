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
import { heroPrinterSolid, heroDocumentArrowDownSolid } from '@ng-icons/heroicons/solid';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
              <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center gap-3">
                <ng-icon name="heroArchiveBoxSolid" class="h-8 w-8 text-indigo-600"></ng-icon>
                Inventarios
              </h2>
              <p class="mt-1 text-sm text-gray-500">
                Gestión general de existencias y productos.
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
                routerLink="/cadena-suministro/inventario/etiquetas"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <ng-icon name="heroPrinterSolid" class="h-4 w-4 mr-2"></ng-icon>
                Etiquetas
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
          <button 
            (click)="exportToPdf()"
            [disabled]="isLoading() || products().length === 0"
            class="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all">
            <ng-icon name="heroDocumentArrowDownSolid" class="h-4 w-4 mr-2"></ng-icon>
            Exportar PDF
          </button>
        </div>

        <!-- TABLE WITH LOADING STATE -->
        <div id="inventory-table-container" class="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200 min-h-[400px]">
          
          <div *ngIf="isLoading()" class="h-64 flex flex-col items-center justify-center">
             <ng-icon name="heroArrowPathSolid" class="h-10 w-10 text-indigo-500 animate-spin mb-4"></ng-icon>
             <p class="text-gray-500 text-sm">Cargando inventario...</p>
          </div>

          <div *ngIf="!isLoading() && products().length === 0" class="h-64 flex flex-col items-center justify-center text-center p-6">
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

          <table *ngIf="!isLoading() && products().length > 0" class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto / SKU</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Existencias</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precios</th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th scope="col" class="relative px-6 py-3">
                  <span class="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let product of products()" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div class="text-sm font-medium text-gray-900">{{ product.name }}</div>
                      <div class="text-xs text-gray-500">SKU: {{ product.sku }}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {{ product.category_id ? 'Categoría' : 'General' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                    <button (click)="openStockDetail(product)" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors group">
                       {{ calculateTotalStock(product) }}
                       <ng-icon name="heroInformationCircleSolid" class="h-4 w-4 text-blue-400 group-hover:text-blue-600"></ng-icon>
                    </button>
                    <div *ngIf="calculateTotalStock(product) === 0" class="text-xs text-gray-400 mt-1">
                        Sin stock
                    </div>
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
                  <span *ngIf="product.reorder_point > 0 && calculateTotalStock(product) <= product.reorder_point" 
                        class="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800"
                        title="Stock Bajo">
                    Bajó Mínimo
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <button *ngIf="product.reorder_point > 0 && calculateTotalStock(product) <= product.reorder_point" 
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
          
          <!-- Paginator -->
          <div *ngIf="!isLoading() && totalCount() > 0" class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
             <div class="flex-1 flex justify-between sm:hidden">
                <button (click)="prevPage()" [disabled]="currentPage() === 1" class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"> Anterior </button>
                <button (click)="nextPage()" [disabled]="currentPage() * pageSize() >= totalCount()" class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"> Siguiente </button>
             </div>
             <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                   <p class="text-sm text-gray-700 font-medium font-mono">
                      Mostrando <span class="text-indigo-600 font-bold">{{ (currentPage() - 1) * pageSize() + 1 }}</span> a <span class="text-indigo-600 font-bold">{{ Math.min(currentPage() * pageSize(), totalCount()) }}</span> de <span class="text-indigo-600 font-bold">{{ totalCount() }}</span> resultados
                   </p>
                </div>
                <div>
                   <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button (click)="prevPage()" [disabled]="currentPage() === 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                         <span class="sr-only">Anterior</span>
                         <ng-icon name="heroChevronLeftSolid" class="h-5 w-5"></ng-icon>
                      </button>
                      
                      <!-- Simplified Page Display -->
                      <span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-black text-indigo-600">
                        {{ currentPage() }} / {{ Math.ceil(totalCount() / pageSize()) }}
                      </span>

                      <button (click)="nextPage()" [disabled]="currentPage() * pageSize() >= totalCount()" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                         <span class="sr-only">Siguiente</span>
                         <ng-icon name="heroChevronRightSolid" class="h-5 w-5"></ng-icon>
                      </button>
                   </nav>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>

    <!-- STOCK DETAILS MODAL -->
    <!-- STOCK DETAILS MODAL -->
    <div *ngIf="showStockDetails()" class="relative z-[100]" aria-labelledby="modal-stock" role="dialog" aria-modal="true">
      
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" (click)="closeStockDetail()"></div>

      <div class="fixed inset-0 z-[100] w-screen overflow-y-auto">
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          
          <!-- Modal Panel -->
          <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            
            <!-- Close Button -->
            <div class="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
              <button type="button" class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" (click)="closeStockDetail()">
                <span class="sr-only">Cerrar</span>
                <ng-icon name="heroXMarkSolid" class="h-6 w-6"></ng-icon>
              </button>
            </div>

            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <ng-icon name="heroArchiveBoxSolid" class="h-6 w-6 text-blue-600"></ng-icon>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 class="text-lg font-semibold leading-6 text-gray-900" id="modal-stock">
                  Detalle de Existencias
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500 mb-4">
                    Ubicaciones del producto <strong>{{ selectedStockProduct()?.name }}</strong>.
                  </p>
                  
                  <div class="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      <table class="min-w-full divide-y divide-gray-200">
                          <thead class="bg-gray-100">
                              <tr>
                                  <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Almacén</th>
                                  <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Cantidad</th>
                              </tr>
                          </thead>
                          <tbody class="divide-y divide-gray-200 bg-white">
                              <tr *ngFor="let item of stockBreakdown()">
                                  <td class="px-4 py-3 text-sm text-gray-900">{{ item.name }}</td>
                                  <td class="px-4 py-3 text-sm text-gray-900 text-right font-medium font-mono">{{ item.qty }}</td>
                              </tr>
                              <tr *ngIf="stockBreakdown().length === 0">
                                  <td colspan="2" class="px-4 py-4 text-sm text-center text-gray-500 italic">
                                      No hay existencias registradas.
                                  </td>
                              </tr>
                          </tbody>
                          <tfoot class="bg-gray-50 font-bold border-t border-gray-200">
                              <tr>
                                  <td class="px-4 py-3 text-sm text-gray-800">Total Global</td>
                                  <td class="px-4 py-3 text-sm text-indigo-600 text-right font-mono text-base">{{ calculateTotalStock(selectedStockProduct()) }}</td>
                              </tr>
                          </tfoot>
                      </table>
                  </div>

                </div>
              </div>
            </div>
            
            <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button type="button" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto" (click)="closeStockDetail()">
                Cerrar
              </button>
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
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);
  isLoading = signal(true);

  // Stock Modal
  showStockDetails = signal(false);
  selectedStockProduct = signal<any>(null);
  stockBreakdown = signal<{ name: string, qty: number }[]>([]); // Warehouse breakdown

  // Filters
  searchControl = new FormBuilder().control('');
  statusFilterControl = new FormBuilder().control('all');

  // Math helper for template
  Math = Math;

  totalProducts = computed(() => this.totalCount());
  activeProducts = computed(() => this.totalCount()); // Placeholder approximation
  totalValue = computed(() => this.products().reduce((acc, p) => acc + (p.sale_price || 0), 0) * (this.totalCount() / this.pageSize() || 1)); // Estimate

  constructor() {
    this.searchControl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadData();
    });
    this.statusFilterControl.valueChanges.subscribe(() => {
      this.currentPage.set(1);
      this.loadData();
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
      const filters = {
        search: this.searchControl.value,
        status: this.statusFilterControl.value
      };

      const result = await this.productRepo.getPaginated(
        tenantId,
        this.currentPage(),
        this.pageSize(),
        filters
      );

      this.products.set(result.data);
      this.totalCount.set(result.totalCount);
    } catch (e: any) {
      console.error(e);
      this.notification.error('Error al cargar inventario.');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Paginator actions
  setPage(page: number) {
    this.currentPage.set(page);
    this.loadData();
  }

  nextPage() {
    if (this.currentPage() * this.pageSize() < this.totalCount()) {
      this.currentPage.update(p => p + 1);
      this.loadData();
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this.loadData();
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

  // --- STOCK LOGIC ---

  calculateTotalStock(product: any): number {
    if (!product.variants) return 0;
    return product.variants.reduce((acc: number, v: any) => {
      const vStock = v.stock_levels?.reduce((sAcc: number, s: any) => sAcc + (s.quantity_on_hand || 0), 0) || 0;
      return acc + vStock;
    }, 0);
  }

  openStockDetail(product: any) {
    this.selectedStockProduct.set(product);
    // Aggregate by warehouse
    const warehouseMap = new Map<string, number>();

    if (product.variants) {
      product.variants.forEach((v: any) => {
        v.stock_levels?.forEach((s: any) => {
          const warehouseName = s.warehouse?.name || 'Sin Asignar';
          const qty = s.quantity_on_hand || 0;
          warehouseMap.set(warehouseName, (warehouseMap.get(warehouseName) || 0) + qty);
        });
      });
    }

    const breakdown = Array.from(warehouseMap.entries())
      .map(([name, qty]) => ({ name, qty }))
      .filter(x => x.qty > 0) // Only show locations with stock? Or all? User said "locations that compose that existence". So > 0.
      .sort((a, b) => b.qty - a.qty);

    this.stockBreakdown.set(breakdown);
    this.showStockDetails.set(true);
  }

  closeStockDetail() {
    this.showStockDetails.set(false);
    this.selectedStockProduct.set(null);
  }

  createPurchaseOrder(product: ScmProduct) {
    if (!product.reorder_quantity) {
      this.notification.warning('Este producto no tiene cantidad de reorden configurada.');
    }

    // Navigate directly to PO form with product pre-selected
    // Variant selection happens in the PO form
    this.router.navigate(['/cadena-suministro/compras/new'], {
      queryParams: {
        product_id: product.id,
        quantity: product.reorder_quantity || 1,
        unit_price: product.cost_price || 0
      }
    });
  }

  async exportToPdf() {
    const data = document.getElementById('inventory-table-container');
    if (!data) return;

    this.notification.info('Preparando documento PDF...');

    // Ocultar elementos que no queremos en el PDF
    const actionsHeader = data.querySelector('thead th:last-child') as HTMLElement;
    const actionsCells = data.querySelectorAll('tbody td:last-child') as NodeListOf<HTMLElement>;
    const originalHeaderDisplay = actionsHeader?.style.display;
    const originalCellsDisplay: string[] = [];
    actionsCells.forEach(cell => originalCellsDisplay.push(cell.style.display));

    if (actionsHeader) actionsHeader.style.display = 'none';
    actionsCells.forEach(cell => cell.style.display = 'none');

    try {
      const canvas = await html2canvas(data, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // 1. ELIMINAR TODAS LAS HOJAS DE ESTILO EXTERNAS (LINK)
          const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
          links.forEach(l => l.remove());

          // 2. SANEAR ETIQUETAS <style> EXISTENTES (Catch oklch, oklab, lch, etc)
          const styles = clonedDoc.querySelectorAll('style');
          styles.forEach(style => {
            // Reemplazo agresivo de cualquier función de color moderna por un color hex seguro
            // Cubre oklch, oklab, lch, hwb y color-mix (comunes en Tailwind 4)
            style.innerHTML = style.innerHTML.replace(/(?:oklch|oklab|lch|hwb|color-mix)\s*\([^)]+\)/gi, '#4f46e5');
          });

          // 3. INYECTAR ESTILOS BASE ESENCIALES
          const styleOverride = clonedDoc.createElement('style');
          styleOverride.innerHTML = `
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: white; }
            #inventory-table-container { 
              background: white !important; 
              color: black !important; 
              width: 100% !important; 
              max-width: none !important;
              padding: 0 !important;
            }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background-color: #f8fafc; color: #1e293b; font-weight: bold; text-transform: uppercase; }
            .bg-indigo-600 { background-color: #4f46e5 !important; color: white !important; }
            .text-indigo-600, .text-indigo-500 { color: #4f46e5 !important; }
            .bg-indigo-50 { background-color: #eef2ff !important; }
            .bg-red-50 { background-color: #fef2f2 !important; }
            .bg-amber-50 { background-color: #fffbeb !important; }
            .font-bold { font-weight: 700; }
            .font-medium { font-weight: 500; }
            .whitespace-nowrap { white-space: nowrap; }
            .text-xs { font-size: 9px; }
            .text-gray-500 { color: #64748b; }
            .text-gray-900 { color: #1e293b; }
          `;
          clonedDoc.head.appendChild(styleOverride);

          // 4. LIMPIEZA ADICIONAL DE ESTILOS EN LÍNEA
          const all = clonedDoc.querySelectorAll('*');
          all.forEach(el => {
            const htmlEl = el as HTMLElement;
            if (htmlEl.hasAttribute('style')) {
              const s = htmlEl.getAttribute('style') || '';
              // Reemplazo preventivo en atributos style
              htmlEl.setAttribute('style', s.replace(/(?:oklch|oklab|lch|hwb|color-mix)\s*\([^)]+\)/gi, '#4f46e5'));
            }
          });
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = (pdf as any).getImageProperties(imgData);
      const pdfWidth = (pdf as any).internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Header Indigo
      pdf.setFillColor(63, 81, 181);
      pdf.rect(0, 0, 210, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(22);
      pdf.text('REPORTE DE INVENTARIO', 15, 25);
      pdf.setFontSize(10);
      pdf.text(`Fecha: ${new Date().toLocaleString()}`, 15, 33);

      pdf.addImage(imgData, 'PNG', 0, 45, pdfWidth, pdfHeight);

      pdf.save(`Inventario_${new Date().toISOString().split('T')[0]}.pdf`);
      this.notification.success('PDF generado con éxito.');

    } catch (error) {
      console.error('Error generating PDF:', error);
      this.notification.error('Error al generar el PDF.');
    } finally {
      if (actionsHeader) actionsHeader.style.display = originalHeaderDisplay;
      actionsCells.forEach((cell, index) => cell.style.display = originalCellsDisplay[index]);
    }
  }
}
