import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { InventoryService } from '../../../../core/services/inventory.service';
import { ScmWarehouse } from '../../../../core/models/erp.types';

@Component({
    selector: 'app-warehouse-list',
    standalone: true,
    imports: [CommonModule, RouterModule, LucideAngularModule],
    template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <div class="mb-6 flex justify-between items-center">
        <div>
           <h1 class="text-2xl font-bold text-gray-900">Almacenes</h1>
           <p class="text-gray-600">Gestiona las ubicaciones físicas de tu inventario.</p>
        </div>
        <button routerLink="/cadena-suministro/almacenes/new" class="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <lucide-icon name="plus" class="w-4 h-4"></lucide-icon> Nuevo Almacén
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let wh of warehouses" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
           <div class="flex justify-between items-start mb-4">
              <div class="p-3 bg-blue-50 rounded-lg text-blue-600">
                  <lucide-icon name="warehouse" class="w-6 h-6"></lucide-icon>
              </div>
              <div class="flex gap-2">
                 <button [routerLink]="['/cadena-suministro/almacenes/edit', wh.id]" class="text-gray-400 hover:text-blue-600">
                    <lucide-icon name="edit-2" class="w-4 h-4"></lucide-icon>
                 </button>
              </div>
           </div>
           
           <h3 class="text-lg font-bold text-gray-900 mb-1">{{ wh.name }}</h3>
           <p class="text-sm text-gray-500 mb-4">{{ wh.code }}</p>

           <div class="space-y-2 text-sm text-gray-600">
              <div class="flex items-start gap-2">
                 <lucide-icon name="map-pin" class="w-4 h-4 mt-0.5 text-gray-400"></lucide-icon>
                 <span>{{ wh.address || 'Sin dirección registrada' }}</span>
              </div>
           </div>

           <div class="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
               <span [class.bg-green-100]="wh.is_active" [class.text-green-800]="wh.is_active" class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {{ wh.is_active ? 'Activo' : 'Inactivo' }}
               </span>
               <button [routerLink]="['/cadena-suministro/almacenes/stock', wh.id]" class="text-blue-600 text-sm font-medium hover:underline">
                  Ver Existencias
               </button>
           </div>
        </div>
      </div>
    </div>
  `
})
export class WarehouseListComponent implements OnInit {
    private service = inject(InventoryService);
    warehouses: ScmWarehouse[] = [];

    async ngOnInit() {
        this.warehouses = await this.service.getWarehouses('t1');
    }
}
