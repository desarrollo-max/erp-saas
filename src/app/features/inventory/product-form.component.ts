import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { ScmProduct, ScmProductImage, ScmProductCategory, ScmProductVariant } from '@core/models/erp.types';
import { ProductRepository } from '@core/repositories/product.repository';
import { SupabaseService } from '@core/services/supabase.service';

@Component({
  selector: 'app-product-form',
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
              {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
            </h1>
            <div class="flex gap-2">

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

                <div class="sm:col-span-3">
                  <label for="barcode" class="block text-sm font-medium text-gray-700">Código de Barras</label>
                  <input type="text" id="barcode" formControlName="barcode" 
                        class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                </div>
                
                <div class="sm:col-span-3">
                  <label for="category" class="block text-sm font-medium text-gray-700">Categoría</label>
                  <select id="category" formControlName="category_id"
                          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                     <option value="">Seleccione una categoría</option>
                     <option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</option>
                  </select>
                </div>

                <div class="sm:col-span-6">
                  <label for="description" class="block text-sm font-medium text-gray-700">Descripción</label>
                  <textarea id="description" formControlName="description" rows="3" 
                            class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"></textarea>
                </div>
              </div>
            </div>

            <!-- Product Details -->
            <div>
               <h3 class="text-lg leading-6 font-medium text-gray-900 border-b pb-2 mb-4">Detalles del Producto</h3>
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
                 <div class="sm:col-span-6 border rounded-md p-4 bg-gray-50" *ngIf="productForm.get('unit_type')?.value === 'PAIR'">
                    <h4 class="text-sm font-medium text-gray-900 mb-3">Configuración de Tallas</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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

                    <div class="flex justify-end border-t border-gray-200 pt-3">
                        <button type="button" (click)="onGenerateVariants()" class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Simular y Generar Variantes
                        </button>
                    </div>

                    <!-- Variants Preview -->
                    <div *ngIf="previewVariants().length > 0" class="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table class="min-w-full divide-y divide-gray-300">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="py-2 pl-4 pr-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">SKU Variante</th>
                                    <th scope="col" class="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Talla</th>
                                    <th scope="col" class="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-gray-500">Estado</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200 bg-white">
                                <tr *ngFor="let variant of previewVariants()">
                                    <td class="whitespace-nowrap py-2 pl-4 pr-3 text-sm font-medium text-gray-900">{{ variant.sku }}</td>
                                    <td class="whitespace-nowrap px-3 py-2 text-sm text-gray-500">{{ variant.attribute_value }}</td>
                                    <td class="whitespace-nowrap px-3 py-2 text-sm text-green-600">
                                        <span class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">Listo para crear</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                 </div>

                 <div class="sm:col-span-3">
                  <div class="flex items-start mt-6">
                    <div class="flex items-center h-5">
                      <input id="is_active" formControlName="is_active" type="checkbox" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                    </div>
                    <div class="ml-3 text-sm">
                      <label for="is_active" class="font-medium text-gray-700">Disponible para Venta</label>
                      <p class="text-gray-500">Habilita este producto para ser vendido.</p>
                    </div>
                  </div>
                 </div>

                 <!-- Prices -->
                 <div class="sm:col-span-2">
                    <label for="sale_price" class="block text-sm font-medium text-gray-700">Precio Venta</label>
                    <div class="mt-1 relative rounded-md shadow-sm">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input type="number" id="sale_price" formControlName="sale_price" class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md" placeholder="0.00">
                    </div>
                 </div>

                 <div class="sm:col-span-2">
                    <label for="purchase_price" class="block text-sm font-medium text-gray-700">Precio Compra</label>
                    <div class="mt-1 relative rounded-md shadow-sm">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input type="number" id="purchase_price" formControlName="purchase_price" class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md" placeholder="0.00">
                    </div>
                 </div>

                 <div class="sm:col-span-2">
                    <label for="cost_price" class="block text-sm font-medium text-gray-700">Costo</label>
                    <div class="mt-1 relative rounded-md shadow-sm">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span class="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input type="number" id="cost_price" formControlName="cost_price" class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md" placeholder="0.00">
                    </div>
                 </div>


               </div>
            </div>

            <!-- Inventory & Tracking Rules -->
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900 border-b pb-2 mb-4">Inventario y Rastreo</h3>
              <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                
                <div class="sm:col-span-2">
                  <label for="reorder_point" class="block text-sm font-medium text-gray-700">Punto de Reorden</label>
                  <input type="number" id="reorder_point" formControlName="reorder_point" 
                        class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                  <p class="mt-1 text-xs text-gray-500">Mínimo stock antes de pedir más.</p>
                </div>

                <div class="sm:col-span-2">
                  <label for="reorder_quantity" class="block text-sm font-medium text-gray-700">Cantidad a Reordenar</label>
                  <input type="number" id="reorder_quantity" formControlName="reorder_quantity" 
                        class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                </div>

                <div class="sm:col-span-2">
                  <label for="lead_time_days" class="block text-sm font-medium text-gray-700">Tiempo de Entrega (Días)</label>
                  <input type="number" id="lead_time_days" formControlName="lead_time_days" 
                        class="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
                </div>

                <!-- Checkboxes -->
                <div class="sm:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div class="flex items-start">
                    <div class="flex items-center h-5">
                      <input id="requires_serial_number" formControlName="requires_serial_number" type="checkbox" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                    </div>
                    <div class="ml-3 text-sm">
                      <label for="requires_serial_number" class="font-medium text-gray-700">Serializado</label>
                      <p class="text-gray-500">Requiere número de serie único.</p>
                    </div>
                  </div>

                  <div class="flex items-start">
                    <div class="flex items-center h-5">
                      <input id="requires_batch_tracking" formControlName="requires_batch_tracking" type="checkbox" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                    </div>
                    <div class="ml-3 text-sm">
                      <label for="requires_batch_tracking" class="font-medium text-gray-700">Lotes</label>
                      <p class="text-gray-500">Requiere rastreo por lote.</p>
                    </div>
                  </div>

                  <div class="flex items-start">
                    <div class="flex items-center h-5">
                      <input id="is_manufacturable" formControlName="is_manufacturable" type="checkbox" class="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded">
                    </div>
                    <div class="ml-3 text-sm">
                      <label for="is_manufacturable" class="font-medium text-gray-700">Fabricable</label>
                      <p class="text-gray-500">Este producto se fabrica internamente.</p>
                    </div>
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

                 <!-- Pending URLs -->
                 <div *ngFor="let url of pendingUrls(); let i = index" class="relative group aspect-w-10 aspect-h-7 block w-full overflow-hidden rounded-lg bg-gray-100 h-32">
                   <img [src]="url" alt="" class="pointer-events-none object-cover group-hover:opacity-75 h-full w-full">
                   <button type="button" (click)="removePendingUrl(i)" class="absolute top-0 right-0 p-1 bg-gray-600 text-white rounded-bl-lg opacity-75 hover:opacity-100">
                     <ng-icon name="heroXMarkSolid" class="h-4 w-4"></ng-icon>
                   </button>
                   <span class="absolute bottom-0 left-0 bg-purple-500 text-white text-xs px-2 py-1 rounded-tr-lg">URL Externo</span>
                 </div>

                 <!-- Upload Button -->
                 <div class="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-4 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 h-32 flex flex-col justify-center items-center cursor-pointer">
                    <label for="file-upload" class="cursor-pointer w-full h-full flex flex-col justify-center items-center">
                     <ng-icon name="heroPhotoSolid" class="h-8 w-8 text-gray-400 mb-2"></ng-icon>
                     <span class="block text-sm font-medium text-gray-900">Añadir imagen</span>
                     <input id="file-upload" name="file-upload" type="file" class="sr-only" multiple (change)="onFileSelected($event)" accept="image/*">
                   </label>
                 </div>

                 <!-- Add by URL Input -->
                 <div class="col-span-full mt-2 flex gap-2">
                    <input #urlInput type="text" placeholder="Pegar URL de imagen externa..." class="flex-grow p-2 border rounded-md text-sm">
                    <button type="button" (click)="addPendingUrl(urlInput.value); urlInput.value = ''" class="bg-gray-200 px-4 py-2 rounded text-sm hover:bg-gray-300">
                        Añadir URL
                    </button>
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
export class ProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private productRepo = inject(ProductRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);
  private supabase = inject(SupabaseService);
  private http = inject(HttpClient);

  images = signal<ScmProductImage[]>([]);
  pendingFiles = signal<{ file: File; preview: string }[]>([]);
  pendingUrls = signal<string[]>([]);
  categories = signal<ScmProductCategory[]>([]);
  previewVariants = signal<ScmProductVariant[]>([]);

  isSubmitting = false;
  isEditing = false;
  productId: string | null = null;

  productForm = this.fb.group({
    sku: ['', Validators.required],
    barcode: [''],
    name: ['', Validators.required],
    description: [''],
    category_id: [''],
    unit_type: ['PIECE', Validators.required],
    sale_price: [0],
    purchase_price: [0],
    cost_price: [0],

    // Inventory & Tracking
    reorder_point: [0],
    reorder_quantity: [0],
    lead_time_days: [0],
    requires_serial_number: [false],
    requires_batch_tracking: [false],
    is_manufacturable: [false],
    is_active: [true],

    // New Size Controls
    size_min: [22],
    size_max: [30],
    size_step: [0.5]
  });

  async ngOnInit() {
    this.productId = this.route.snapshot.paramMap.get('id');
    await this.loadCategories();
    if (this.productId) {
      this.isEditing = true;
      await this.loadProduct(this.productId);

      // Load existing variants if any (to preview)
      const variants = await this.productRepo.getVariantsByProductId(this.productId);
      if (variants && variants.length > 0) {
        this.previewVariants.set(variants);
      }
    }
  }

  async loadCategories() {
    try {
      const tenantId = this.session.currentTenantId();
      if (tenantId) {
        const cats = await this.productRepo.getCategories(tenantId);
        this.categories.set(cats);
      }
    } catch (e) {
      console.error('Error loading categories', e);
    }
  }

  async loadProduct(id: string) {
    try {
      const product = await this.productRepo.getById(id);
      if (product) {
        this.productForm.patchValue({
          sku: product.sku,
          barcode: product.barcode || '',
          name: product.name,
          description: product.description || '',
          category_id: product.category_id || '',
          unit_type: product.unit_type || 'PIECE',
          sale_price: product.sale_price || 0,
          purchase_price: product.purchase_price || 0,
          cost_price: product.cost_price || 0,

          reorder_point: product.reorder_point || 0,
          reorder_quantity: product.reorder_quantity || 0,
          lead_time_days: product.lead_time_days || 0,
          requires_serial_number: product.requires_serial_number || false,
          requires_batch_tracking: product.requires_batch_tracking || false,
          is_manufacturable: product.is_manufacturable || false,

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

  async onGenerateVariants() {
    // 1. Validate Form Data
    const val = this.productForm.value;
    const sku = val.sku;

    if (!sku) {
      this.notification.warning('Debe ingresar un SKU base antes de generar variantes.');
      return;
    }

    const config = {
      min: val.size_min,
      max: val.size_max,
      step: val.size_step,
    };

    // 2. Generate Preview
    // If we don't have a product ID yet, we use a placeholder or the SKU itself
    // Ideally, the repo method uses the productId. If new, we might need a temp ID or just pass 'TEMP'
    // but the repo method returns objects with that ID.

    const pid = this.productId || 'NEW_PRODUCT';
    const variants = await this.productRepo.generateVariants(pid, config);

    // Adjust SKU to match form input if it changed
    variants.forEach(v => {
      // v.sku was generated as `${productId}-${size}` in repo. 
      // We probably want `${sku}-${size}` if the product is new.
      // Let's rewrite the SKU slightly for better UX:
      const sizeSuffix = v.attribute_value.replace(' MX', '').replace('.', '');
      v.sku = `${sku}-${sizeSuffix}`;
    });

    this.previewVariants.set(variants);
    this.notification.success(`Se generaron ${variants.length} variantes preeliminares.`);
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
      barcode: val.barcode || null,
      name: val.name!,
      description: val.description || null,
      category_id: val.category_id || null,
      unit_type: val.unit_type || 'PIECE',
      sale_price: val.sale_price || 0,
      purchase_price: val.purchase_price || 0,
      cost_price: val.cost_price || 0,
      is_active: val.is_active || false,

      reorder_point: Number(val.reorder_point) || 0,
      reorder_quantity: Number(val.reorder_quantity) || 0,
      lead_time_days: Number(val.lead_time_days) || 0,
      requires_serial_number: val.requires_serial_number || false,
      requires_batch_tracking: val.requires_batch_tracking || false,
      is_manufacturable: val.is_manufacturable || false,
    };

    if (val.unit_type === 'PAIR') {
      productData.size_config = {
        min: Number(val.size_min) || 0,
        max: Number(val.size_max) || 0,
        step: Number(val.size_step) || 0.5
      };
    } else {
      productData.size_config = undefined;
    }

    try {
      let finalProductId = this.productId;

      if (this.isEditing && this.productId) {
        await this.productRepo.update(this.productId, productData);
        this.notification.success('Producto actualizado');
      } else {
        await this.productRepo.create(productData);
        const { data } = await this.supabase.client
          .from('scm_products')
          .select('id')
          .eq('tenant_id', tenantId)
          .eq('sku', productData.sku)
          .single();
        if (data) finalProductId = data.id;
        this.notification.success('Nuevo producto creado');
      }

      // === SAVE VARIANTS ===
      if (finalProductId && this.previewVariants().length > 0) {
        // Ensure all variants have the correct product_id (especially if it was NEW_PRODUCT)
        const variantsToSave = this.previewVariants().map(v => ({
          ...v,
          product_id: finalProductId!, // Must exist now
          tenant_id: tenantId
        }));
        await this.productRepo.saveVariants(variantsToSave);
      }


      // Handle Images & URLs
      if (finalProductId) {
        let uploadCount = 0;
        let primaryUrl: string | null = null;

        // 1. Handle Pending Files
        if (this.pendingFiles().length > 0) {
          for (const item of this.pendingFiles()) {
            const path = `products/${finalProductId}/${Date.now()}_${item.file.name}`;
            const upload = await this.supabase.uploadFile('erp-files', path, item.file);

            if (upload.error) {
              console.error('Error uploading file:', upload.error);
              continue;
            }

            if (!upload.error && upload.url) {
              const isPrimary = this.images().length === 0 && uploadCount === 0; // First of new batch if no existing
              if (isPrimary && !primaryUrl) primaryUrl = upload.url;

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
        }

        // 2. Handle Pending URLs
        if (this.pendingUrls().length > 0) {
          for (const url of this.pendingUrls()) {
            const isPrimary = this.images().length === 0 && uploadCount === 0 && !primaryUrl;
            if (isPrimary && !primaryUrl) primaryUrl = url;

            await this.productRepo.addImage({
              product_id: finalProductId,
              file_url: url,
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
    this.router.navigate(['/inventory']);
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

  addPendingUrl(url: string) {
    if (!url) return;
    this.pendingUrls.update(current => [...current, url]);
  }

  removePendingUrl(index: number) {
    this.pendingUrls.update(current => current.filter((_, i) => i !== index));
  }

  async deleteImage(imageId: string): Promise<void> {
    if (!confirm('¿Eliminar imagen?')) return;
    try {
      await this.productRepo.deleteImage(imageId);
      this.images.update(imgs => imgs.filter(i => i.id !== imageId));
      this.notification.success('Imagen eliminada');
    } catch (e) {
      this.notification.error('Error al eliminar imagen');
    }
  }

  async importAgaveProducts() {
    this.notification.loading('Importando productos...');
    try {
      const data: any = await new Promise(resolve => {
        this.http.get('/agave_products.json').subscribe({
          next: (d) => resolve(d),
          error: (e) => resolve(null)
        });
      });

      if (!data || !data.products) {
        this.notification.error('Error: No se cargó /agave_products.json');
        return;
      }

      const tenantId = this.session.currentTenantId();
      if (!tenantId) {
        this.notification.error('No hay empresa seleccionada');
        return;
      }

      let count = 0;
      let errors = 0;

      for (const p of data.products) {
        const sku = (p.variants?.[0]?.sku) || 'SKU-' + p.id;

        // Check if exists
        const { data: exists } = await this.supabase.client.from('scm_products').select('id').eq('sku', sku).eq('tenant_id', tenantId).maybeSingle();
        if (exists) {
          console.log('Skipping existing SKU', sku);
          continue;
        }

        const price = parseFloat(p.variants?.[0]?.price || '0');
        // Find first valid image
        const image = p.images?.[0]?.src;

        const productData: Partial<ScmProduct> = {
          tenant_id: tenantId,
          name: p.title,
          sku: sku,
          description: p.body_html?.replace(/<[^>]*>?/gm, '') || p.title,
          unit_type: 'PAIR',
          sale_price: price,
          cost_price: price * 0.5,
          is_active: true,
          category_id: this.categories()[0]?.id,
          // Size Config
          size_config: { min: 22, max: 30, step: 0.5 }
        };

        try {
          // Create
          await this.productRepo.create(productData);

          // Get ID
          const { data: created } = await this.supabase.client
            .from('scm_products')
            .select('id')
            .eq('tenant_id', tenantId)
            .eq('sku', sku)
            .single();

          if (created && image) {
            await this.productRepo.addImage({
              product_id: created.id,
              file_url: image,
              media_type: 'image',
              is_primary: true,
              sort_order: 0
            });
            await this.productRepo.update(created.id, { image_url: image });
          }
          count++;
        } catch (err) {
          errors++;
          console.error('Error importing product', p.title, err);
        }
      }
      this.notification.success(`Importación finalizada. Creados: ${count}. Errores: ${errors}`);
      this.router.navigate(['/inventory']);

    } catch (e) {
      console.error(e);
      this.notification.error('Error crítico al importar');
    }
  }
}