
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { ScmProduct, ScmProductImage } from '@core/models/erp.types';
import { ProductRepository } from '@core/repositories/product.repository';
import { SupabaseService } from '@core/services/supabase.service';

@Component({
  selector: 'app-catalog-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
       <!-- HEADER -->
       <div class="bg-white border-b border-gray-200">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">
              {{ isEditing ? 'Editar Producto Manufacturable' : 'Nuevo Producto Manufacturable' }}
            </h1>
            <button 
              type="button" 
              (click)="cancel()"
              class="text-gray-500 hover:text-gray-700">
              <ng-icon name="heroXMarkSolid" class="h-6 w-6"></ng-icon>
            </button>
          </div>
        </div>
      </div>

      <div class="flex-grow p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <div class="bg-white shadow rounded-lg overflow-hidden">
          <form [formGroup]="productForm" (ngSubmit)="saveProduct()" class="p-6 space-y-8">
            
            <!-- Basic Info -->
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900 border-b pb-2 mb-4">Información Básica</h3>
              <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                
                <div class="sm:col-span-3">
                  <label for="sku" class="block text-sm font-medium text-gray-700">SKU (Código)</label>
                  <input type="text" id="sku" formControlName="sku" 
                        class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                  <p *ngIf="productForm.get('sku')?.touched && productForm.get('sku')?.invalid" class="mt-1 text-sm text-red-600">El SKU es requerido.</p>
                </div>

                <div class="sm:col-span-3">
                  <label for="name" class="block text-sm font-medium text-gray-700">Nombre del Producto</label>
                  <input type="text" id="name" formControlName="name" 
                        class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                   <p *ngIf="productForm.get('name')?.touched && productForm.get('name')?.invalid" class="mt-1 text-sm text-red-600">El nombre es requerido.</p>
                </div>

                <div class="sm:col-span-6">
                  <label for="description" class="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea id="description" formControlName="description" rows="3" 
                            class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                </div>
              </div>
            </div>

            <!-- Manufacuring Details -->
            <div>
               <h3 class="text-lg leading-6 font-medium text-gray-900 border-b pb-2 mb-4">Detalles de Manufactura</h3>
               <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                 
                 <div class="sm:col-span-3">
                    <label for="unit_type" class="block text-sm font-medium text-gray-700">Unidad de Medida</label>
                    <select id="unit_type" formControlName="unit_type"
                            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      <option value="PIECE">Pieza (Unidad)</option>
                      <option value="KG">Kilogramo</option>
                      <option value="METER">Metro</option>
                      <option value="LITER">Litro</option>
                      <option value="BOX">Caja</option>
                      <option value="PAIR">Par (Con Tallas)</option>
                    </select>
                 </div>

                 <!-- Size Configuration (Only for PAIR) -->
                 <div class="sm:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4" *ngIf="productForm.get('unit_type')?.value === 'PAIR'">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Talla Mínima</label>
                      <input type="number" formControlName="size_min" class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Talla Máxima</label>
                      <input type="number" formControlName="size_max" class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Incremento (Pasos)</label>
                      <select formControlName="size_step" class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                        <option [value]="0.5">0.5 (Medios números)</option>
                        <option [value]="1">1 (Números enteros)</option>
                      </select>
                    </div>
                 </div>

                 <div class="sm:col-span-3">
                  <div class="flex items-start mt-6">
                    <div class="flex items-center h-5">
                      <input id="is_active" formControlName="is_active" type="checkbox" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                    </div>
                    <div class="ml-3 text-sm">
                      <label for="is_active" class="font-medium text-gray-700">Activo para Producción</label>
                      <p class="text-gray-500">Habilita este producto para ser usado en órdenes.</p>
                    </div>
                  </div>
                 </div>

                 <div class="sm:col-span-2">
                    <label for="sale_price" class="block text-sm font-medium text-gray-700">Precio Estimado Venta</label>
                    <div class="mt-1 relative rounded-md shadow-sm">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input type="number" id="sale_price" formControlName="sale_price" class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md" placeholder="0.00">
                    </div>
                 </div>

               </div>
            </div>



            <!-- Image Management Section -->
            <div>
               <h3 class="text-lg leading-6 font-medium text-gray-900 border-b pb-2 mb-4">Imágenes del Producto</h3>
               <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 mt-4">
                 <!-- Existing Images -->
                 <div *ngFor="let img of images()" class="relative group aspect-w-10 aspect-h-7 block w-full overflow-hidden rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100 h-32">
                   <img [src]="img.file_url" alt="" class="pointer-events-none object-cover group-hover:opacity-75 h-full w-full">
                   <button type="button" (click)="deleteImage(img.id)" class="absolute top-0 right-0 p-1 bg-red-600 text-white rounded-bl-lg opacity-75 hover:opacity-100">
                     <ng-icon name="heroTrashSolid" class="h-4 w-4"></ng-icon>
                   </button>
                    <span *ngIf="img.is_primary" class="absolute bottom-0 left-0 bg-indigo-600 text-white text-xs px-2 py-1 rounded-tr-lg">Principal</span>
                 </div>

                 <!-- Pending Files -->
                 <div *ngFor="let file of pendingFiles(); let i = index" class="relative group aspect-w-10 aspect-h-7 block w-full overflow-hidden rounded-lg bg-gray-100 h-32">
                   <img [src]="file.preview" alt="" class="pointer-events-none object-cover group-hover:opacity-75 h-full w-full">
                   <button type="button" (click)="removePendingFile(i)" class="absolute top-0 right-0 p-1 bg-gray-600 text-white rounded-bl-lg opacity-75 hover:opacity-100">
                     <ng-icon name="heroXMarkSolid" class="h-4 w-4"></ng-icon>
                   </button>
                   <span class="absolute bottom-0 left-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded-tr-lg">Pendiente</span>
                 </div>

                 <!-- Upload Button -->
                 <div class="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-4 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 h-32 flex flex-col justify-center items-center cursor-pointer">
                    <label for="file-upload" class="cursor-pointer w-full h-full flex flex-col justify-center items-center">
                     <ng-icon name="heroPhotoSolid" class="h-8 w-8 text-gray-400 mb-2"></ng-icon>
                     <span class="block text-sm font-medium text-gray-900">Añadir imagen</span>
                     <input id="file-upload" name="file-upload" type="file" class="sr-only" multiple (change)="onFileSelected($event)" accept="image/*">
                   </label>
                 </div>
               </div>
            </div>
            <div class="pt-5 border-t border-gray-200">
              <div class="flex justify-end gap-3">
                <button type="button" (click)="cancel()" 
                        class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Cancelar
                </button>
                <button type="submit" [disabled]="productForm.invalid || isSubmitting" 
                        class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                  <ng-icon *ngIf="isSubmitting" name="heroArrowPathSolid" class="animate-spin h-4 w-4 mr-2"></ng-icon>
                  {{ isSubmitting ? 'Guardando...' : 'Guardar Producto' }}
                </button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  `,
})
export class CatalogFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productRepo = inject(ProductRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);
  private supabase = inject(SupabaseService);

  images = signal<ScmProductImage[]>([]);
  pendingFiles = signal<{ file: File; preview: string }[]>([]);

  isSubmitting = false;
  isEditing = false;
  productId: string | null = null;

  productForm = this.fb.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    unit_type: ['PIECE', Validators.required],
    sale_price: [0],
    is_active: [true],
    // New Size Controls
    size_min: [22],
    size_max: [30],
    size_step: [0.5]
  });

  async ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id');
    if (this.productId) {
      this.isEditing = true;
      await this.loadProduct(this.productId);
    }
  }

  async loadProduct(id: string) {
    try {
      const product = await this.productRepo.getById(id);
      if (product) {
        this.productForm.patchValue({
          sku: product.sku,
          name: product.name,
          description: product.description || '',
          unit_type: product.unit_type || 'PIECE',
          sale_price: product.sale_price || 0,
          is_active: product.is_active,
          size_min: product.size_config?.min || 22,
          size_max: product.size_config?.max || 30,
          size_step: product.size_config?.step || 0.5
        });

        // Load images
        try {
          const imgs = await this.productRepo.getImages(id);
          this.images.set(imgs);
        } catch (e) {
          console.error('Error loading images', e);
        }

      } else {
        this.notification.error('Producto no encontrado');
        this.cancel();
      }
    } catch (error) {
      this.notification.error('Error cargando producto');
      console.error(error);
    }
  }

  async saveProduct() {
    if (this.productForm.invalid) return;

    const tenantId = this.session.currentTenantId();
    if (!tenantId) {
      this.notification.error('Error de sesión');
      return;
    }

    this.isSubmitting = true;
    const val = this.productForm.value;

    const productData: Partial<ScmProduct> = {
      tenant_id: tenantId,
      sku: val.sku!,
      name: val.name!,
      description: val.description || null,
      unit_type: val.unit_type || 'PIECE',
      sale_price: val.sale_price || 0,
      is_active: val.is_active || false,
      is_manufacturable: true, // AUTO-FLAG AS MANUFACTURING PRODUCT
      // Defaults
      purchase_price: 0,
      cost_price: 0,
      reorder_point: 0,
      reorder_quantity: 0,
      lead_time_days: 0,
      requires_serial_number: false,
      requires_batch_tracking: false
    };

    // Agregar configuración de tallas si es PAR
    if (val.unit_type === 'PAIR') {
      productData.size_config = {
        min: Number(val.size_min) || 0,
        max: Number(val.size_max) || 0,
        step: Number(val.size_step) || 0.5
      };
    } else {
      productData.size_config = undefined; // Limpiar si cambia de tipo
    }

    try {
      let finalProductId = this.productId;

      if (this.isEditing && this.productId) {
        await this.productRepo.update(this.productId, productData);
        this.notification.success('Producto manufacturable actualizado');
      } else {
        await this.productRepo.create(productData);

        // Retrieve ID for new product
        const { data } = await this.supabase.client
          .from('scm_products')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('sku', productData.sku)
          .single();
        if (data) finalProductId = data.id;

        this.notification.success('Nuevo producto manufacturable creado');
      }

      // Handle Images
      if (finalProductId && this.pendingFiles().length > 0) {
        let uploadCount = 0;
        let primaryUrl: string | null = null;

        for (const item of this.pendingFiles()) {
          const path = `products/${finalProductId}/${Date.now()}_${item.file.name}`;
          const upload = await this.supabase.uploadFile('erp-files', path, item.file);

          if (upload.error) {
            console.error('Error uploading file:', upload.error);
            this.notification.warning(`Error al subir imagen ${item.file.name}`);
            continue;
          }

          if (!upload.error && upload.url) {
            const isPrimary = this.images().length === 0 && uploadCount === 0;
            if (isPrimary) primaryUrl = upload.url;

            await this.productRepo.addImage({
              product_id: finalProductId,
              file_url: upload.url,
              media_type: 'image',
              is_primary: isPrimary,
              sort_order: this.images().length + uploadCount
            });
            uploadCount++;
          }
        }

        // Update main image_url if we set a primary image
        if (primaryUrl) {
          await this.productRepo.update(finalProductId, { image_url: primaryUrl });
        }
      }

      this.cancel();
    } catch (error: any) {
      console.error(error);
      this.notification.error('Error al guardar: ' + (error.message || 'Desconocido'));
    } finally {
      this.isSubmitting = false;
    }
  }

  cancel() {
    this.router.navigate(['../../catalog'], { relativeTo: this.route });
  }

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.pendingFiles.update(current => [...current, { file, preview: e.target.result }]);
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removePendingFile(index: number): void {
    this.pendingFiles.update(current => current.filter((_, i) => i !== index));
  }

  async deleteImage(imageId: string): Promise<void> {
    if (!confirm('¿Eliminar imagen?')) return;
    try {
      await this.productRepo.deleteImage(imageId);
      this.images.update(imgs => imgs.filter(i => i.id !== imageId));
      this.notification.success('Imagen eliminada');

      // If we deleted the primary image, we might want to update image_url to null or next image, 
      // but complexity increases. For now leaving it as is.
    } catch (e) {
      this.notification.error('Error al eliminar imagen');
    }
  }
}
