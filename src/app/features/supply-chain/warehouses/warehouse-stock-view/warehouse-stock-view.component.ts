import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { InventoryService } from '../../../../core/services/inventory.service';
import { ProductRepository } from '../../../../core/repositories/product.repository';

@Component({
    selector: 'app-warehouse-stock-view',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <div class="mb-6">
         <button routerLink="/cadena-suministro/almacenes" class="flex items-center text-gray-500 hover:text-gray-700 mb-4 transition-colors">
            <lucide-icon name="arrow-left" class="w-4 h-4 mr-1"></lucide-icon>
            Volver a Almacenes
         </button>
         <div>
            <h1 class="text-2xl font-bold text-gray-900">Existencias en Almacén</h1>
            <p class="text-gray-600" *ngIf="warehouse">{{ warehouse.name }} ({{ warehouse.code }})</p>
         </div>
      </div>

       <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Físico (On Hand)</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Reservado</th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Disponible</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let stock of stockLevels">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ getProductName(stock.product_id) }}
              </td>
               <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ getProductSku(stock.product_id) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-semibold">
                {{ stock.quantity_on_hand | number }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-orange-600">
                {{ stock.quantity_reserved | number }}
              </td>
               <td class="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600 font-bold">
                {{ stock.quantity_available | number }}
              </td>
            </tr>
            <tr *ngIf="stockLevels.length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                    <lucide-icon name="package-open" class="w-8 h-8 mx-auto mb-2 text-gray-400"></lucide-icon>
                    No hay existencias registradas en este almacén.
                </td>
            </tr>
          </tbody>
        </table>
       </div>
    </div>
  `
})
export class WarehouseStockViewComponent implements OnInit {
    private service = inject(InventoryService);
    private productRepo = inject(ProductRepository); // To resolve names
    private route = inject(ActivatedRoute);

    stockLevels: any[] = [];
    products: any[] = [];
    warehouse: any = null;
    warehouseId: string | null = null;

    async ngOnInit() {
        this.warehouseId = this.route.snapshot.paramMap.get('id');
        if (this.warehouseId) {
            await Promise.all([
                this.loadWarehouse(this.warehouseId),
                this.loadStock(),
                this.loadProducts()
            ]);
        }
    }

    async loadWarehouse(id: string) {
        const warehouses = await this.service.getWarehouses('t1');
        this.warehouse = warehouses.find(w => w.id === id);
    }

    async loadStock() {
        // Need a method to get ALL stock for a warehouse. 
        // The service has getAllStockLevels(tenantId) -> returns all. We filter locally for now.
        const allStock = await this.service.getAllStockLevels('t1');
        this.stockLevels = allStock.filter(sl => sl.warehouse_id === this.warehouseId);
    }

    async loadProducts() {
        this.products = await this.productRepo.getAll('t1');
    }

    getProductName(id: string) {
        return this.products.find(p => p.id === id)?.name || id;
    }
    getProductSku(id: string) {
        return this.products.find(p => p.id === id)?.sku || '-';
    }
}
