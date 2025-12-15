import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WarehouseRepository } from '@core/repositories/warehouse.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { Warehouse } from '@core/models/erp.types';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  template: `
    <div class="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      <div class="max-w-7xl mx-auto">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-3xl font-extrabold text-gray-900 dark:text-white">Almacenes y Sucursales <span class="text-sm font-normal text-gray-500 dark:text-gray-400">({{ warehouses().length }})</span></h1>
          <button [routerLink]="['/cadena-suministro/almacenes', 'new']"
            class="app-button-primary inline-flex items-center text-sm shadow-sm hover:shadow-md transition-shadow">
            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
            Nuevo Almacén
          </button>
        </div>

        <!-- Estado de Carga -->
        <div *ngIf="isLoading()" class="py-20 text-center app-card">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
          <p class="mt-3 text-indigo-600 dark:text-indigo-400 font-medium">Cargando ubicaciones...</p>
        </div>

        <!-- Estado Vacío -->
        <div *ngIf="!isLoading() && isEmpty()" class="text-center py-16 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-100 dark:bg-slate-800/50">
          <div class="mb-4">
            <i data-lucide="warehouse" class="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto"></i>
          </div>
          <h2 class="text-xl font-semibold text-gray-700 dark:text-gray-200">Aún no hay almacenes registrados</h2>
          <p class="mt-2 text-gray-500 dark:text-gray-400">Comience creando su Almacén Principal o una Sucursal.</p>
          <button [routerLink]="['/cadena-suministro/almacenes', 'new']" class="mt-6 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium underline">
            Crear Primer Almacén
          </button>
        </div>

        <!-- LISTADO GRIDS (Cards) -->
        <div *ngIf="!isLoading() && !isEmpty()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <div *ngFor="let warehouse of warehouses()" class="app-card group hover:scale-[1.01] transition-transform duration-200 flex flex-col justify-between">
             
             <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                  <div class="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                    <i data-lucide="building-2" class="w-6 h-6"></i>
                  </div>
                  <span class="text-xs font-mono font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {{ warehouse.code }}
                  </span>
                </div>
                
                <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {{ warehouse.name }}
                </h3>
                
                <div class="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                   <i data-lucide="map-pin" class="w-4 h-4"></i>
                   <span class="truncate">{{ warehouse.address || 'Sin dirección registrada' }}</span>
                </div>

                <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm">
                   <span class="text-gray-500 dark:text-gray-400">Estado</span>
                   <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                         [ngClass]="warehouse.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'">
                     {{ warehouse.is_active ? 'Activo' : 'Inactivo' }}
                   </span>
                </div>
             </div>

             <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                <button (click)="editWarehouse(warehouse.id)" 
                        class="p-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        title="Editar">
                   <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button (click)="deleteWarehouse(warehouse.id)" 
                        class="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Eliminar">
                   <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
             </div>

          </div>
        </div>

      </div>
    </div>
    <script>lucide.createIcons();</script>
  `,
})
export class WarehouseListComponent implements OnInit {
  public router = inject(Router);
  private warehouseRepo = inject(WarehouseRepository);
  private notification = inject(NotificationService);
  private session = inject(SessionService);

  warehouses = signal<Warehouse[]>([]);
  isLoading = signal(true);

  isEmpty = computed(() => this.warehouses().length === 0);

  async ngOnInit(): Promise<void> {
    const tenantId = this.session.currentTenantId();
    if (tenantId) {
      await this.loadWarehouses(tenantId);
    } else {
      this.isLoading.set(false);
      this.notification.error('Error: No se ha cargado el contexto de la empresa.');
      this.router.navigate(['/dashboard']);
    }
  }

  async loadWarehouses(tenantId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const allWarehouses = await this.warehouseRepo.getAll(tenantId);
      this.warehouses.set(allWarehouses);

    } catch (error) {
      this.notification.error('Error al cargar la lista de almacenes.');
      this.warehouses.set([]);
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  editWarehouse(id: string): void {
    this.router.navigate(['/cadena-suministro/almacenes/edit', id]);
  }

  async deleteWarehouse(id: string): Promise<void> {
    if (confirm('¿Está seguro de eliminar este almacén? Esto afectará todos los movimientos de stock asociados.')) {
      try {
        await this.warehouseRepo.delete(id);
        this.notification.success('Almacén eliminado exitosamente.');

        const tenantId = this.session.currentTenantId();
        if (tenantId) {
          await this.loadWarehouses(tenantId);
        }
      } catch (error) {
        this.notification.error('Fallo al eliminar el almacén.');
        console.error(error);
      }
    }
  }
}