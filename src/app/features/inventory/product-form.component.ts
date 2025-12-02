import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { NotificationService } from '../../core/services/notification.service';
import { ScmProduct } from '../../core/models/erp.types';
import { ProductRepository } from '../../core/repositories/product.repository';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 class="text-xl font-semibold text-gray-900">Crear Nuevo Producto</h1>
      
      <form [formGroup]="productForm" (ngSubmit)="saveProduct()" class="mt-6 space-y-8 divide-y divide-gray-200">
        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
          
          <div class="sm:col-span-3">
            <label for="sku" class="block text-sm font-medium text-gray-700">SKU</label>
            <input type="text" id="sku" formControlName="sku" 
                   class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
          </div>

          <div class="sm:col-span-3">
            <label for="name" class="block text-sm font-medium text-gray-700">Nombre</label>
            <input type="text" id="name" formControlName="name" 
                   class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
          </div>

          <div class="sm:col-span-6">
            <label for="description" class="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea id="description" formControlName="description" rows="3" 
                      class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"></textarea>
          </div>

          <div class="sm:col-span-2">
            <label for="sale_price" class="block text-sm font-medium text-gray-700">Precio Venta</label>
            <input type="number" id="sale_price" formControlName="sale_price" 
                   class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
          </div>

          <div class="sm:col-span-2">
            <label for="purchase_price" class="block text-sm font-medium text-gray-700">Precio Compra</label>
            <input type="number" id="purchase_price" formControlName="purchase_price" 
                   class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
          </div>

           <div class="sm:col-span-2">
            <label for="cost_price" class="block text-sm font-medium text-gray-700">Costo</label>
            <input type="number" id="cost_price" formControlName="cost_price" 
                   class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
          </div>

          <div class="sm:col-span-3">
            <label for="category_id" class="block text-sm font-medium text-gray-700">ID Categoría (UUID)</label>
            <input type="text" id="category_id" formControlName="category_id" placeholder="Opcional"
                   class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
            <p class="mt-1 text-xs text-gray-500">Deja vacío para usar la categoría por defecto.</p>
          </div>

          <div class="sm:col-span-3">
            <label for="unit_type" class="block text-sm font-medium text-gray-700">Unidad</label>
            <input type="text" id="unit_type" formControlName="unit_type" 
                   class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
          </div>

        </div>

        <div class="pt-5">
          <div class="flex justify-end">
            <button type="button" (click)="cancel()" 
                    class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Cancelar
            </button>
            <button type="submit" [disabled]="productForm.invalid || isSubmitting" 
                    class="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
              {{ isSubmitting ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </form>
    </div>
  `,
})
export class ProductFormComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private productRepo = inject(ProductRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);

  isSubmitting = false;

  // Definición del formulario
  productForm = this.fb.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    category_id: [''], // Esto guarda string vacío "" por defecto
    unit_type: ['PIECE', Validators.required], // Valor por defecto recomendado
    purchase_price: [0],
    sale_price: [0],
    cost_price: [0],
  });

  async saveProduct(): Promise<void> {
    if (this.productForm.invalid) {
      this.notification.error('Por favor, completa los campos requeridos.');
      return;
    }

    const tenantId = this.session.currentTenant()?.id;
    if (!tenantId) {
      this.notification.error('Error de sesión: No se ha detectado la empresa (Tenant).');
      return;
    }

    this.isSubmitting = true;
    const formValue = this.productForm.value;

    try {
      // 1. PREPARACIÓN DE DATOS (Mapeo seguro)
      // Usamos 'undefined' en lugar de null para evitar problemas con interfaces Partial
      // y convertimos strings vacíos a undefined para columnas UUID.
      const productData: Partial<ScmProduct> = {
        tenant_id: tenantId,
        is_active: true,
        
        // Strings básicos (si es null/undefined usa undefined)
        sku: formValue.sku ?? undefined,
        name: formValue.name ?? undefined,
        description: formValue.description ?? undefined,
        unit_type: formValue.unit_type ?? 'PIECE',
        
        // IMPORTANTE: Manejo de UUIDs
        // Si category_id es una cadena vacía "", la base de datos fallará.
        // Lo convertimos a undefined para que la BD lo ignore o ponga NULL.
        // NOTA: Si tienes una constante DEFAULT_CATEGORY_ID, úsala aquí:
        // category_id: formValue.category_id ? formValue.category_id : DEFAULT_CATEGORY_ID,
        category_id: formValue.category_id ? formValue.category_id : undefined,

        // IMPORTANTE: Conversión numérica
        // Los inputs type="number" a veces devuelven strings en el value.
        purchase_price: Number(formValue.purchase_price) || 0,
        sale_price: Number(formValue.sale_price) || 0,
        cost_price: Number(formValue.cost_price) || 0,
      };

      // 2. INSERCIÓN USANDO EL REPOSITORIO
      await this.productRepo.create(productData);

      this.notification.success('Producto guardado correctamente.');
      this.router.navigate(['/inventory']);

    } catch (error: any) {
      console.error('Error guardando producto:', error);
      this.notification.error(error.message || 'Ocurrió un error al guardar el producto.');
    } finally {
      this.isSubmitting = false;
    }
  }

  cancel(): void {
    this.router.navigate(['/inventory']);
  }
}