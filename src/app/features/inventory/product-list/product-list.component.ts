import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ScmProduct } from '../../../core/models/erp.types';
import { SessionService } from '../../../core/services/session.service';
import { ProductRepository } from '../../../core/repositories/product.repository';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-4 sm:p-6 lg:p-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-xl font-semibold text-gray-900">Inventario</h1>
          <p class="mt-2 text-sm text-gray-700">
            Una lista de todos los productos en tu inventario.
          </p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <a
            [routerLink]="['/inventory/import']"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >Importar Productos</a
          >
          <a
            [routerLink]="['/inventory/new']"
            class="ml-3 inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
            >Agregar Producto</a
          >
        </div>
      </div>

      <div class="mt-8 flex flex-col">
        <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div
            class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8"
          >
            <div
              *ngIf="isLoading()"
              class="flex justify-center items-center p-4"
            >
              <p>Cargando productos...</p>
            </div>

            <div
              *ngIf="!isLoading() && products().length === 0"
              class="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg"
            >
              <h3 class="text-sm font-medium text-gray-900">
                No hay productos registrados
              </h3>
              <p class="mt-1 text-sm text-gray-500">
                Empieza importando tu primer lote de productos.
              </p>
               <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                  <a
                    [routerLink]="['../import']"
                    class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                    >Importar Productos</a
                  >
                </div>
            </div>

            <div
              *ngIf="!isLoading() && products().length > 0"
              class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg"
            >
              <table class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      SKU
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Nombre
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Categoría ID
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Precio Venta
                    </th>
                    <th
                      scope="col"
                      class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  <tr *ngFor="let product of products()">
                    <td
                      class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6"
                    >
                      {{ product.sku }}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {{ product.name }}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {{ product.category_id }}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {{ product.sale_price | currency }}
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                       <span [ngClass]="{
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium': true,
                        'bg-green-100 text-green-800': product.is_active,
                        'bg-red-100 text-red-800': !product.is_active
                       }">
                        {{ product.is_active ? 'Activo' : 'Inactivo' }}
                       </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProductListComponent implements OnInit {
  products = signal<ScmProduct[]>([]);
  isLoading = signal<boolean>(true);

  private productRepo = inject(ProductRepository);
  private session = inject(SessionService);

  ngOnInit(): void {
    this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.isLoading.set(true);
    const tenantId = this.session.currentTenant()?.id;
    if (!tenantId) {
      console.error('No tenant selected');
      this.isLoading.set(false);
      return;
    }

    try {
      const data = await this.productRepo.getAll(tenantId);
      this.products.set(data);
    } catch (error) {
      console.error('Error loading products', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
