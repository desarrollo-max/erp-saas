import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { ProductRepository } from '@core/repositories/product.repository';
import { StockRepository } from '@core/repositories/stock.repository';
import { WarehouseRepository } from '@core/repositories/warehouse.repository';
import { NotificationService } from '@core/services/notification.service';
import { SessionService } from '@core/services/session.service';
import { APP_ICONS } from '@core/constants/app-icons';
import { ScmProduct, ScmProductVariant, ScmWarehouse, ScmStockMovement } from '@core/models/erp.types';

@Component({
  selector: 'app-stock-movement-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  styles: [`
    .autocomplete-list {
       max-height: 250px;
       overflow-y: auto;
    }
  `],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- HEADER -->
      <div class="bg-white border-b border-gray-200">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">Registrar Movimiento de Stock</h1>
            <button (click)="cancel()" class="text-gray-500 hover:text-gray-700">
               <ng-icon [name]="ICONS.cancel" class="h-6 w-6"></ng-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- FORM CONTENT -->
      <div class="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="bg-white shadow rounded-lg p-6 space-y-8">
          
          <!-- TIPO DE MOVIMIENTO -->
          <div>
            <label class="block text-sm font-medium text-gray-700">Tipo de Movimiento</label>
            <div class="mt-2 flex gap-4">
               <label class="inline-flex items-center cursor-pointer">
                 <input type="radio" formControlName="movement_type" value="IN" class="form-radio h-4 w-4 text-indigo-600">
                 <span class="ml-2">Entrada / Recepción</span>
               </label>
               <label class="inline-flex items-center cursor-pointer">
                 <input type="radio" formControlName="movement_type" value="OUT" class="form-radio h-4 w-4 text-red-600">
                 <span class="ml-2">Salida / Consumo</span>
               </label>
            </div>
          </div>

          <div class="border-t border-gray-200"></div>

          <!-- SECCIÓN 1: IDENTIFICACIÓN DEL PRODUCTO -->
          <div>
             <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Producto y Variante</h3>
             
             <!-- PRODUCT SEARCH -->
             <div class="relative">
                <label for="product_search" class="block text-sm font-medium text-gray-700">Buscar Producto</label>
                <div class="mt-1 relative rounded-md shadow-sm">
                   <div *ngIf="form.get('product_id')?.value" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ng-icon name="heroCheckCircleSolid" class="h-5 w-5 text-green-500"></ng-icon>
                   </div>
                   <input 
                      type="text" 
                      id="product_search"
                      [formControl]="productSearchControl"
                      (focus)="onSearchFocus()"
                      (blur)="onSearchBlur()"
                      placeholder="Escribe nombre o SKU..."
                      class="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      [class.pl-10]="form.get('product_id')?.value">
                      
                   <div *ngIf="form.get('product_id')?.value" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <button type="button" (click)="clearProductSelection()" class="text-gray-400 hover:text-gray-500">
                         <ng-icon [name]="ICONS.cancel" class="h-4 w-4"></ng-icon>
                      </button>
                   </div>
                </div>

                <!-- AUTOCOMPLETE DROPDOWN -->
                <ul *ngIf="showDropdown() && filteredProducts().length > 0" 
                    class="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm autocomplete-list">
                   <li *ngFor="let p of filteredProducts()" 
                       (click)="selectProduct(p)"
                       class="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100">
                      <div>
                         <span class="block truncate font-medium text-gray-900">{{ p.name }}</span>
                         <span class="block truncate text-xs text-gray-500">SKU: {{ p.sku }}</span>
                      </div>
                   </li>
                </ul>
             </div>

             <!-- PRODUCT CONTEXT (IMAGE + SIZES) -->
             <div *ngIf="selectedProduct() as p" class="mt-6 flex flex-col sm:flex-row gap-6 animate-fade-in-down">
                <!-- Image -->
                <div class="flex-shrink-0">
                   <div class="h-40 w-40 rounded-lg border border-gray-200 overflow-hidden bg-white">
                      <img *ngIf="p.image_url" [src]="p.image_url" [alt]="p.name" class="h-full w-full object-cover object-center">
                      <div *ngIf="!p.image_url" class="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400">
                         <ng-icon name="heroPhotoSolid" class="h-10 w-10"></ng-icon>
                      </div>
                   </div>
                </div>

                <!-- Info & Size Selector -->
                <div class="flex-1">
                   <h4 class="text-xl font-bold text-gray-900">{{ p.name }}</h4>
                   <p class="text-sm text-gray-500">{{ p.sku }}</p>
                   <p class="mt-2 text-sm text-gray-600">{{ p.description || 'Sin descripción disponible.' }}</p>
                   
                   <div class="mt-4">
                      <h5 class="text-sm font-medium text-gray-900">Talla <span class="text-gray-500 font-normal text-xs ml-2">(Seleccione una opción)</span></h5>
                      
                      <!-- Visual Size Selector -->
                      <!-- We merged existing variants with potential variants from config -->
                      <div class="mt-2 flex flex-wrap gap-2">
                         <button *ngFor="let v of mergedVariants()" 
                                 type="button"
                                 (click)="selectVariant(v)"
                                 [class.bg-gray-900]="selectedVariant()?.attribute_value === v.attribute_value"
                                 [class.text-white]="selectedVariant()?.attribute_value === v.attribute_value"
                                 [class.border-gray-900]="selectedVariant()?.attribute_value === v.attribute_value"
                                 [class.bg-white]="selectedVariant()?.attribute_value !== v.attribute_value"
                                 [class.text-gray-900]="selectedVariant()?.attribute_value !== v.attribute_value"
                                 [title]="v._isVirtual ? 'Esta variante se creará automáticamente' : 'Variante existente'"
                                 class="border border-gray-300 rounded-md py-2 px-3 text-sm font-medium uppercase hover:border-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all">
                            {{ v.attribute_value }}
                            <span *ngIf="v._isVirtual" class="text-green-500 ml-1 text-xs" title="Nueva">*</span>
                         </button>
                      </div>
                      <p *ngIf="mergedVariants().length === 0" class="mt-2 text-xs text-gray-500">
                         No hay tallas configuradas. <a [routerLink]="['/inventory/edit', p.id]" class="underline">Configurar</a>
                      </p>
                      <p *ngIf="form.get('variant_id')?.invalid && form.get('variant_id')?.touched" class="mt-1 text-xs text-red-600">
                         Debe seleccionar una talla.
                      </p>
                   </div>
                </div>
             </div>
          </div>

          <div class="border-t border-gray-200"></div>

          <!-- SECCIÓN 2: UBICACIÓN Y CANTIDAD -->
          <div>
             <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Ubicación y Cantidad</h3>
             <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <!-- WAREHOUSE SELECTOR -->
                <div class="col-span-2 sm:col-span-1">
                   <label for="warehouse" class="block text-sm font-medium text-gray-700">Almacén</label>
                   <select 
                      id="warehouse" 
                      formControlName="warehouse_id"
                      class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                      <option [ngValue]="null">Seleccione almacén</option>
                      <option *ngFor="let w of warehouses()" [value]="w.id">{{ w.name }}</option>
                   </select>
                </div>

                <!-- QUANTITY INPUT -->
                <div class="col-span-2 sm:col-span-1">
                   <label for="quantity" class="block text-sm font-medium text-gray-700">Cantidad</label>
                   <div class="mt-1 relative rounded-md shadow-sm">
                      <input 
                        type="number" 
                        id="quantity" 
                        formControlName="quantity"
                        min="1"
                        class="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3" 
                        placeholder="0.00">
                   </div>
                </div>

                <!-- NOTES -->
                <div class="col-span-2">
                   <label for="notes" class="block text-sm font-medium text-gray-700">Notas / Referencia</label>
                   <textarea 
                      id="notes" 
                      formControlName="notes"
                      rows="3" 
                      class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Ej. Recepción de Compra #123"></textarea>
                </div>
             </div>
          </div>

          <!-- ACTIONS -->
          <div class="pt-5 flex justify-end gap-3">
             <button type="button" (click)="cancel()" class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
               Cancelar
             </button>
             <button 
               type="submit" 
               [disabled]="form.invalid || isSaving()"
               [class.bg-indigo-600]="form.get('movement_type')?.value === 'IN'"
               [class.hover:bg-indigo-700]="form.get('movement_type')?.value === 'IN'"
               [class.bg-red-600]="form.get('movement_type')?.value === 'OUT'"
               [class.hover:bg-red-700]="form.get('movement_type')?.value === 'OUT'"
               class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
               <ng-icon *ngIf="isSaving()" [name]="ICONS.loading" class="animate-spin h-5 w-5 mr-2"></ng-icon>
               {{ form.get('movement_type')?.value === 'IN' ? 'Registrar Entrada' : 'Registrar Salida' }}
             </button>
          </div>

        </form>
      </div>
    </div>
  `
})
export class StockMovementFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private productRepo = inject(ProductRepository);
  private warehouseRepo = inject(WarehouseRepository);
  private stockRepo = inject(StockRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);

  public readonly ICONS = APP_ICONS;

  products = signal<ScmProduct[]>([]);
  warehouses = signal<ScmWarehouse[]>([]);
  isSaving = signal(false);

  // Variant Logic
  mergedVariants = signal<any[]>([]);
  selectedVariant = signal<any | null>(null);

  // Autocomplete Logic
  productSearchControl = this.fb.control('');
  showDropdown = signal(false);

  filteredProducts = computed(() => {
    const term = this.productSearchControl.value?.toLowerCase() || '';
    if (!term) return this.products().slice(0, 50);
    return this.products().filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term)
    ).slice(0, 50);
  });

  selectedProduct = signal<ScmProduct | null>(null);

  form = this.fb.group({
    movement_type: ['IN', Validators.required],
    product_id: [null as string | null, Validators.required],
    variant_id: [null as string | null, Validators.required], // Will be manually managed if virtual
    warehouse_id: [null as string | null, Validators.required],
    quantity: [null as number | null, [Validators.required, Validators.min(0.01)]],
    notes: ['']
  });

  constructor() { }

  ngOnInit() {
    this.loadInitialData();

    this.form.get('product_id')?.valueChanges.subscribe(val => {
      if (!val) {
        this.mergedVariants.set([]);
        this.selectedVariant.set(null);
        this.selectedProduct.set(null);
      }
    });

    this.productSearchControl.valueChanges.subscribe(() => {
      this.form.get('variant_id')?.markAsUntouched();
    });
  }

  async loadInitialData() {
    const tenantId = this.session.currentTenantId();
    if (!tenantId) return;

    try {
      const [prods, whs] = await Promise.all([
        this.productRepo.getAll(tenantId),
        this.warehouseRepo.getAll(tenantId)
      ]);
      this.products.set(prods);
      this.warehouses.set(whs as unknown as ScmWarehouse[]);
    } catch (e) {
      console.error(e);
      this.notification.error('Error cargando catálogos.');
    }
  }

  onSearchFocus() {
    this.showDropdown.set(true);
  }

  onSearchBlur() {
    setTimeout(() => {
      this.showDropdown.set(false);
      if (!this.form.get('product_id')?.value) {
        this.productSearchControl.setValue('');
      } else {
        this.productSearchControl.setValue(this.selectedProduct()?.name || '');
      }
    }, 200);
  }

  async selectProduct(product: ScmProduct) {
    this.form.patchValue({ product_id: product.id, variant_id: null });
    this.selectedProduct.set(product);
    this.selectedVariant.set(null);
    this.productSearchControl.setValue(product.name);
    this.showDropdown.set(false);
    this.form.get('variant_id')?.markAsTouched();

    // Load variants logic
    try {
      const existingVars = await this.productRepo.getVariantsByProductId(product.id);

      let finalVariants: any[] = [];

      if (product.size_config) {
        // Generate theoretical variants
        const theoretical = await this.productRepo.generateVariants(product.id, product.size_config);

        // Merge
        finalVariants = theoretical.map(t => {
          const match = existingVars.find(e => e.attribute_value === t.attribute_value);
          if (match) return match; // Use existing
          return { ...t, _isVirtual: true }; // Use theoretical marked as virtual
        });
      } else {
        // Fallback to strict database variants if no config
        finalVariants = existingVars;
      }

      this.mergedVariants.set(finalVariants);

    } catch (e) {
      console.error(e);
      this.notification.error('Error cargando variantes.');
    }
  }

  selectVariant(variant: any) {
    this.selectedVariant.set(variant);
    // If it exists, set ID locally. If not, set 'TEMP' to pass required validation if needed, or handle in submit
    // But variant_id requires a string.
    this.form.patchValue({ variant_id: variant.id }); // variant.id is temp-uuid if virtual, which is a string.
  }

  clearProductSelection() {
    this.form.patchValue({ product_id: null, variant_id: null });
    this.productSearchControl.setValue('');
    this.selectedProduct.set(null);
    this.mergedVariants.set([]);
    this.selectedVariant.set(null);
    setTimeout(() => document.getElementById('product_search')?.focus(), 100);
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const val = this.form.value;
    const selectedVar = this.selectedVariant();

    try {
      let finalVariantId = val.variant_id!;

      // Check if virtual -> Create it first
      if (selectedVar && selectedVar._isVirtual) {
        const variantToCreate = {
          product_id: selectedVar.product_id,
          tenant_id: selectedVar.tenant_id,
          sku: selectedVar.sku,
          variant_sku: selectedVar.sku, // Explicitly set for DB compatibility
          attribute_name: selectedVar.attribute_name,
          attribute_value: selectedVar.attribute_value,
          is_active: true
        };

        const createdVariant = await this.productRepo.createVariant(variantToCreate);
        finalVariantId = createdVariant.id;
      }

      const movement: Partial<ScmStockMovement> = {
        tenant_id: this.session.currentTenantId()!,
        variant_id: finalVariantId,
        warehouse_id: val.warehouse_id!,
        movement_type: val.movement_type as any,
        quantity: val.quantity!,
        notes: val.notes || (val.movement_type === 'IN' ? 'Entrada Manual' : 'Salida Manual'),
        movement_date: new Date().toISOString()
      };

      await this.stockRepo.createStockMovement(movement);

      this.notification.success('Movimiento registrado correctamente.');
      this.router.navigate(['/cadena-suministro/inventario']);

    } catch (e: any) {
      console.error(e);
      this.notification.error(`Error: ${e.message}`);
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/cadena-suministro/inventario']);
  }
}
