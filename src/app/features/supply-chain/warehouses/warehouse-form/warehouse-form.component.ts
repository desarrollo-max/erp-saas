import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WarehouseRepository } from '@core/repositories/warehouse.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { Warehouse } from '@core/models/erp.types';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-warehouse-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen py-10 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div class="max-w-3xl mx-auto">
        
        <div class="app-card overflow-hidden">
            <!-- Header -->
            <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-slate-800 flex justify-between items-center">
                <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <i data-lucide="warehouse" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></i>
                    {{ isEditing() ? 'Editar Almacén' : 'Nuevo Almacén' }}
                </h1>
                <button type="button" (click)="router.navigate(['/cadena-suministro/almacenes'])" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>

            <div class="p-6 md:p-8">
                <!-- Estado de Carga -->
                <div *ngIf="isLoading()">
                    <div class="animate-pulse space-y-6">
                        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        <div class="h-24 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                </div>
                
                <form [formGroup]="warehouseForm" (ngSubmit)="saveWarehouse()" *ngIf="!isLoading()" class="space-y-6">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Campo Nombre -->
                        <div class="col-span-1 md:col-span-2">
                            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Almacén <span class="text-red-500">*</span></label>
                            <input id="name" type="text" formControlName="name" class="app-input" placeholder="Ej: Almacén Central, Sucursal Norte" required>
                            <div *ngIf="warehouseForm.get('name')?.invalid && (warehouseForm.get('name')?.dirty || warehouseForm.get('name')?.touched)" class="text-red-500 text-xs mt-1">
                                El nombre es obligatorio.
                            </div>
                        </div>

                        <!-- Campo Código -->
                        <div class="col-span-1">
                            <label for="code" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código Identificador <span class="text-red-500">*</span></label>
                            <input id="code" type="text" formControlName="code" class="app-input font-mono uppercase" placeholder="Ej: ALM-01" required>
                            <div *ngIf="warehouseForm.get('code')?.invalid && (warehouseForm.get('code')?.dirty || warehouseForm.get('code')?.touched)" class="text-red-500 text-xs mt-1">
                                El código es obligatorio.
                            </div>
                        </div>

                        <!-- Campo Activo -->
                        <div class="col-span-1 flex items-end pb-2">
                            <div class="flex items-center">
                                <input id="is_active" type="checkbox" formControlName="is_active" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                                <label for="is_active" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                    Almacén Activo
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Campo Dirección -->
                    <div>
                        <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección Física</label>
                        <textarea id="address" formControlName="address" rows="3" class="app-input resize-none" placeholder="Calle, Número, Colonia, Ciudad..."></textarea>
                    </div>

                    <!-- Checkbox Default -->
                     <div class="flex items-center">
                        <input id="is_default" type="checkbox" formControlName="is_default" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                        <label for="is_default" class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                            Establecer como almacén predeterminado para operaciones
                        </label>
                    </div>

                    <!-- Botones de Acción -->
                    <div class="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-700 gap-3">
                        <button type="button" (click)="router.navigate(['/cadena-suministro/almacenes'])" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                            Cancelar
                        </button>
                        <button type="submit" [disabled]="warehouseForm.invalid || isLoading()" class="app-button-primary text-sm flex items-center shadow-lg shadow-indigo-500/30">
                            <i data-lucide="save" class="w-4 h-4 mr-2"></i>
                            {{ isEditing() ? 'Actualizar Almacén' : 'Guardar Almacén' }}
                        </button>
                    </div>
                </form>

            </div>
        </div>
      </div>
    </div>
    <script>lucide.createIcons();</script>
  `,
})
export class WarehouseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private notification = inject(NotificationService);
  private warehouseRepo = inject(WarehouseRepository);
  public session = inject(SessionService);

  warehouseForm = this.fb.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    address: [''],
    is_active: [true],
    is_default: [false]
  });

  isEditing = signal(false);
  warehouseId: string | null = null;
  isLoading = signal(false);

  async ngOnInit(): Promise<void> {
    const tenantId = this.session.currentTenantId();
    if (!tenantId) {
      this.notification.error('Sesión no válida o empresa no seleccionada.');
      this.router.navigate(['/dashboard']);
      return;
    }

    this.route.paramMap.subscribe(params => {
      this.warehouseId = params.get('id');
      if (this.warehouseId) {
        this.isEditing.set(true);
        this.loadWarehouse(this.warehouseId);
      }
    });
  }

  async loadWarehouse(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const warehouse = await this.warehouseRepo.getById(id);
      if (warehouse) {
        this.warehouseForm.patchValue({
          name: warehouse.name,
          code: warehouse.code,
          address: warehouse.address,
          is_active: warehouse.is_active,
          is_default: warehouse.is_default
        });
      } else {
        this.notification.error('Almacén no encontrado o sin permisos.');
        this.router.navigate(['/cadena-suministro/almacenes']);
      }
    } catch (error) {
      this.notification.error('Fallo la carga de datos del almacén.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async saveWarehouse(): Promise<void> {
    if (this.warehouseForm.invalid) {
      this.notification.warning('Por favor, complete todos los campos requeridos.');
      return;
    }

    const data = this.warehouseForm.value as Partial<Warehouse>;
    this.isLoading.set(true);

    try {
      if (this.isEditing() && this.warehouseId) {
        await this.warehouseRepo.update(this.warehouseId, data);
        this.notification.success('Almacén actualizado correctamente.');
      } else {
        await this.warehouseRepo.create(data as Omit<Warehouse, 'id'>);
        this.notification.success('Almacén creado correctamente.');
      }
      this.router.navigate(['/cadena-suministro/almacenes']);
    } catch (error: any) {
      this.notification.error(error.message || 'Error al guardar el almacén.');
      console.error('Error al guardar el almacén:', error);
    } finally {
      this.isLoading.set(false);
    }
  }
}