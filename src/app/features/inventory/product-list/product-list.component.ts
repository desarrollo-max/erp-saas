import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SessionService } from '@core/services/session.service';
import { ProductRepository } from '@core/repositories/product.repository';
import { NotificationService } from '@core/services/notification.service';
import { ScmProduct } from '@core/models/erp.types';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      
      <!-- HEADER -->
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div class="md:flex md:items-center md:justify-between">
            <div class="flex-1 min-w-0">
              <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Inventario
              </h2>
              <p class="mt-1 text-sm text-gray-500">
                Productos disponibles para venta.
              </p>
            </div>
            <div class="mt-4 flex md:mt-0 md:ml-4 gap-2">
              <button 
                (click)="navigateToImport()"
                class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <ng-icon name="heroArrowUpTraySolid" class="h-5 w-5 mr-2 text-gray-500"></ng-icon>
                Importar
              </button>
              <button 
                (click)="navigateToNew()"
                class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <ng-icon name="heroPlusSolid" class="h-5 w-5 mr-2"></ng-icon>
                Nuevo Producto
              </button>
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
        </div>

        <!-- TABLE WITH LOADING STATE -->
        <div class="bg-white shadow overflow-hidden sm:rounded-lg border border-gray-200 min-h-[400px]">
          
          <div *ngIf="isLoading()" class="h-64 flex flex-col items-center justify-center">
             <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
             <p class="text-gray-500 text-sm">Cargando inventario...</p>
          </div>

          <div *ngIf="!isLoading() && filteredProducts().length === 0" class="h-64 flex flex-col items-center justify-center text-center p-6">
            <div class="bg-gray-100 rounded-full p-4 mb-4">
               <ng-icon name="heroArchiveBoxSolid" class="h-8 w-8 text-gray-400"></ng-icon>
            </div>
            <h3 class="text-lg font-medium text-gray-900">No se encontraron productos</h3>
            <p class="mt-1 text-sm text-gray-500">Registra un nuevo producto para comenzar.</p>
             <button 
                (click)="navigateToNew()"
                class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                Nuevo Producto
              </button>
          </div>

          <table *ngIf="!isLoading() && filteredProducts().length > 0" class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto / SKU</th>
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
                    <div class="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg overflow-hidden flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                      <img *ngIf="product.image_url" [src]="product.image_url" alt="" class="h-full w-full object-cover">
                      <ng-icon *ngIf="!product.image_url" name="heroCubeTransparentSolid" class="h-6 w-6"></ng-icon>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ product.name }}</div>
                      <div class="text-xs text-gray-500">SKU: {{ product.sku }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div class="flex flex-col">
                    <span class="text-gray-900 font-semibold">{{ product.sale_price | currency }}</span>
                    <span class="text-xs text-gray-400">Costo Est.: {{ product.cost_price | currency }}</span>
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
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <button (click)="navigateToEdit(product.id)" class="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded" title="Editar">
                      <ng-icon name="heroPencilSquareSolid" class="h-5 w-5"></ng-icon>
                    </button>
                    <button (click)="deleteProduct(product.id)" class="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded" title="Eliminar">
                      <ng-icon name="heroTrashSolid" class="h-5 w-5"></ng-icon>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <div *ngIf="!isLoading() && filteredProducts().length > 0" class="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
             <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                   <p class="text-sm text-gray-700"> Mostrando <span class="font-medium">{{ filteredProducts().length }}</span> resultados </p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  `
})
export class ProductListComponent implements OnInit {
  private session = inject(SessionService);
  private productRepo = inject(ProductRepository);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  products = signal<ScmProduct[]>([]);
  isLoading = signal(true);
  searchControl = new FormBuilder().control('');

  // Filter products for inventory
  filteredProducts = computed(() => {
    const raw = this.products();
    const term = this.searchControl.value?.toLowerCase() || '';

    return raw.filter(p => {
      // Inventory shows all products, or we could filter by specific criteria if needed.
      // For now, we show everything that matches the search term.
      const matchesTerm = p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
      return matchesTerm;
    });
  });

  constructor() { }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    const tenantId = this.session.currentTenantId();

    if (!tenantId) {
      this.notification.error('No se ha seleccionado una organización.');
      this.isLoading.set(false);
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

  navigateToNew() {
    this.router.navigate(['/inventory/new']);
  }

  navigateToEdit(id: string) {
    this.router.navigate(['/inventory/edit', id]);
  }

  navigateToImport() {
    this.router.navigate(['/inventory/import']);
  }

  async deleteProduct(id: string) {
    if (!confirm('¿Estás seguro de eliminar este producto del inventario?')) return;

    try {
      await this.productRepo.delete(id);
      this.notification.success('Producto eliminado.');
      this.loadData();
    } catch (e) {
      this.notification.error('Error al eliminar.');
    }
  }
}
