import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { APP_ICONS } from '@core/constants/app-icons';

import { PurchaseOrderRepository } from '@core/repositories/purchase-order.repository';
import { SupplierRepository } from '@core/repositories/supplier.repository';
import { SupabaseSupplierRepository } from '@core/repositories/implementations/supabase-supplier.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { WarehouseRepository } from '@core/repositories/warehouse.repository';
import { SessionService } from '@core/services/session.service';
import { Supplier, ScmProduct, ScmProductVariant, PurchaseOrder, Warehouse } from '@core/models/erp.types';

@Component({
  selector: 'app-purchase-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconsModule],
  providers: [
    CurrencyPipe,
    { provide: SupplierRepository, useClass: SupabaseSupplierRepository }
  ],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="flex flex-col h-full bg-gray-50 dark:bg-slate-900">
      
      <!-- HEADER -->
      <div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
         <div>
           <button (click)="cancel()" class="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-1">
             <ng-icon name="heroArrowLeftSolid" class="mr-1"></ng-icon> Volver
           </button>
           <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
             <ng-icon [name]="ICONS.purchasing" class="text-indigo-500"></ng-icon>
             {{ isEditMode() ? 'Editar Orden de Compra' : 'Nueva Orden de Compra' }}
           </h1>
         </div>
         <div class="flex gap-3">
           <button (click)="onSubmit()" [disabled]="form.invalid || isSaving()" 
                   class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
             <div *ngIf="isSaving()" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
             {{ isEditMode() ? 'Guardar Cambios' : 'Crear Orden' }}
           </button>
         </div>
      </div>

      <!-- CONTENT -->
      <div class="flex-1 overflow-auto p-6 scroll-smooth">
        <form [formGroup]="form" class="space-y-6 max-w-7xl mx-auto">
          
          <!-- MAIN CARD: Header Info -->
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-slate-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <span class="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              Información de la Orden
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <!-- Supplier -->
              <div class="lg:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proveedor <span class="text-red-500">*</span></label>
                <div class="relative">
                  <select formControlName="supplier_id" class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11 pl-4 pr-10">
                    <option [ngValue]="null">Seleccione un proveedor...</option>
                    <option *ngFor="let s of suppliers()" [value]="s.id">{{ s.name }}</option>
                  </select>
                  <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                     <ng-icon name="heroChevronDownSolid" class="h-4 w-4"></ng-icon>
                  </div>
                </div>
              </div>

               <!-- Warehouse Destination -->
               <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Punto de Recepción (Almacén) <span class="text-red-500">*</span></label>
                <select formControlName="warehouse_id" class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11">
                  <option [ngValue]="null">Seleccione almacén...</option>
                  <option *ngFor="let w of warehouses()" [value]="w.id">{{ w.name }}</option>
                </select>
              </div>

              <!-- Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Emisión <span class="text-red-500">*</span></label>
                <input type="date" formControlName="po_date" class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11">
              </div>

              <!-- Expected Date -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Esperada de Llegada</label>
                <input type="date" formControlName="expected_delivery_date" class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm h-11">
              </div>

              <!-- Status -->
              <div>
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                 <select formControlName="status" class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100 shadow-sm sm:text-sm h-11 font-medium">
                    <option value="DRAFT">📋 Borrador</option>
                    <option value="SENT">📤 Enviada</option>
                    <option value="PARTIAL">📦 Parcial</option>
                    <option value="COMPLETED">✅ Completada</option>
                    <option value="CANCELLED">❌ Cancelada</option>
                 </select>
              </div>

              <!-- Notes -->
              <div class="col-span-1 md:col-span-2 lg:col-span-4">
                 <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comentarios / Notas Internas</label>
                 <textarea formControlName="notes" rows="2" class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3" placeholder="Información adicional para la orden..."></textarea>
              </div>
            </div>
          </div>

          <!-- LINES -->
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div class="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 flex justify-between items-center">
               <div class="flex flex-col">
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Productos a Comprar</h3>
                  <p class="text-xs text-gray-500">Agregue los artículos que desea solicitar al proveedor.</p>
               </div>
               <button type="button" (click)="openAddItemModal()" class="px-4 py-2 bg-indigo-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-indigo-700 transition shadow-sm flex items-center gap-2">
                 <ng-icon name="heroPlusCircleSolid" class="h-5 w-5"></ng-icon>
                 Agregar Producto
               </button>
            </div>

            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead class="bg-gray-100 dark:bg-slate-700/80">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-12">#</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/3">Producto</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">Variante (Talla)</th>
                    <th scope="col" class="px-6 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">Cantidad</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">Costo Unit.</th>
                    <th scope="col" class="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">Subtotal</th>
                    <th scope="col" class="relative px-6 py-3 w-16"><span class="sr-only">Eliminar</span></th>
                  </tr>
                </thead>
                <tbody formArrayName="lines" class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                  <tr *ngFor="let line of linesControls; let i = index" [formGroupName]="i" class="hover:bg-indigo-50/30 dark:hover:bg-slate-700/30 transition-colors group">
                    
                    <!-- Index -->
                    <td class="px-6 py-4 text-xs text-gray-400 font-mono">
                       {{ i + 1 }}
                    </td>

                    <!-- Product Read Only -->
                    <td class="px-6 py-4">
                      <div class="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                          {{ getProductName(i) }}
                      </div>
                    </td>

                    <!-- Variant Read Only -->
                    <td class="px-6 py-4">
                       <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-gray-300">
                         {{ getLineVariantName(i) }}
                       </span>
                    </td>

                    <!-- Quantity Stepper -->
                    <td class="px-6 py-4">
                       <div class="flex items-center justify-center gap-1">
                           <button type="button" (click)="decrementQty(i)" class="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                               <ng-icon name="heroMinusSolid" class="h-4 w-4"></ng-icon>
                           </button>
                           <input type="number" formControlName="quantity_ordered" min="1" class="block w-16 text-center rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-gray-200 font-medium no-spinner" style="-moz-appearance: textfield;">
                           <button type="button" (click)="incrementQty(i)" class="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                               <ng-icon name="heroPlusSolid" class="h-4 w-4"></ng-icon>
                           </button>
                       </div>
                    </td>

                    <!-- Unit Price -->
                    <td class="px-6 py-4">
                       <div class="relative rounded-md shadow-sm">
                         <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                           <span class="text-gray-500 sm:text-sm">$</span>
                         </div>
                         <input type="number" formControlName="unit_price" min="0" placeholder="0.00" class="block w-full rounded-md border-gray-300 pl-7 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-gray-200 text-right font-mono">
                       </div>
                    </td>

                    <!-- Subtotal -->
                    <td class="px-6 py-4 text-right">
                       <span class="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">
                         {{ calculateLineTotal(i) | currency }}
                       </span>
                    </td>

                    <!-- Actions -->
                    <td class="px-6 py-4 text-center">
                       <button type="button" (click)="removeLine(i)" 
                               class="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 opacity-0 group-hover:opacity-100 focus:opacity-100" 
                               title="Eliminar línea">
                          <ng-icon name="heroTrashSolid" class="h-5 w-5"></ng-icon>
                       </button>
                    </td>
                  </tr>
                  
                  <tr *ngIf="linesControls.length === 0">
                     <td colspan="7" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                           <ng-icon name="heroShoppingCartSolid" class="h-12 w-12 mb-3 text-gray-300 dark:text-slate-600"></ng-icon>
                           <p class="text-base font-medium">La orden está vacía</p>
                           <p class="text-sm mt-1">Haga clic en "Agregar Producto" para comenzar.</p>
                           <button (click)="openAddItemModal()" class="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm">Agregar Producto</button>
                        </div>
                     </td>
                  </tr>
                </tbody>
                <!-- Footer Totals -->
                <tfoot class="bg-gray-50 dark:bg-slate-800/80 font-bold text-gray-900 dark:text-gray-100 border-t-2 border-indigo-500">
                   <tr>
                      <td colspan="5" class="px-6 py-5 text-right text-gray-600 dark:text-gray-300 uppercase text-xs tracking-wider">Total Orden de Compra</td>
                      <td class="px-6 py-5 text-right text-2xl text-indigo-600 dark:text-indigo-400 font-mono">{{ grandTotal() | currency }}</td>
                      <td></td>
                   </tr>
                </tfoot>
              </table>
            </div>
          </div>

        </form>
      </div>
    
    <!-- ADD ITEM MODAL -->
    <div *ngIf="isAddItemModalOpen()" class="fixed inset-0 z-50 overflow-y-auto" role="dialog">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-900/60 transition-opacity backdrop-blur-sm" (click)="closeAddItemModal()"></div>
        
        <div class="flex min-h-full items-center justify-center p-4 text-center">
            <div class="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-slate-800 text-left shadow-2xl transition-all border border-gray-100 dark:border-slate-700 flex flex-col max-h-[90vh]">
                
                <!-- Modal Header -->
                <div class="bg-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
                  <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                     <ng-icon name="heroPlusCircleSolid" class="h-6 w-6"></ng-icon>
                     Agregar Producto a la Orden
                  </h3>
                  <button (click)="closeAddItemModal()" class="text-indigo-200 hover:text-white transition rounded-full p-1 hover:bg-indigo-500/50">
                     <ng-icon name="heroXMarkSolid" class="h-6 w-6"></ng-icon>
                  </button>
                </div>

                <!-- Modal Body -->
                <div class="p-6 overflow-y-auto">
                   
                   <!-- 1. Select Product -->
                   <div class="mb-6">
                       <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">1. Seleccione Producto</label>
                       <select [value]="tempSelectedProductId() || 'null'" (change)="onModalProductChange($event.target)" 
                               class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-base py-3">
                           <option value="null">-- Buscar Producto --</option>
                           <option *ngFor="let p of products()" [value]="p.id">
                               {{ p.name }} ({{ p.sku }})
                           </option>
                       </select>
                   </div>

                   <!-- 2. Select Variant (if needed) -->
                   <div *ngIf="tempSelectedProductId() && hasVariants()" class="mb-6 animate-fade-in-up">
                       <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                           2. Seleccione Talla / Variante
                           <span class="text-red-500 ml-1">*</span>
                       </label>
                       
                       <div *ngIf="modalVariants().length > 0; else noVariantsFound" class="grid grid-cols-3 sm:grid-cols-4 gap-3">
                           <button *ngFor="let v of modalVariants()" 
                                   (click)="selectVariantInModal(v.id)"
                                   [class.ring-2]="tempSelectedVariantId() === v.id"
                                   [class.ring-indigo-500]="tempSelectedVariantId() === v.id"
                                   [class.bg-indigo-50]="tempSelectedVariantId() === v.id"
                                   [class.text-indigo-700]="tempSelectedVariantId() === v.id"
                                   [class.dark:bg-indigo-900]="tempSelectedVariantId() === v.id"
                                   class="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-slate-700 transition group bg-white dark:bg-slate-800">
                               <span class="text-lg font-bold">{{ v.attribute_value }}</span>
                               <span class="text-xs text-gray-400 dark:text-gray-500">{{ (v.sku || '').split('-').pop() }}</span>
                           </button>
                       </div>
                       
                       <ng-template #noVariantsFound>
                           <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg text-sm flex items-center gap-2">
                               <ng-icon name="heroExclamationTriangleSolid" class="h-5 w-5"></ng-icon>
                               El producto requiere talla pero no hay variantes creadas. Sincronice el catálogo.
                           </div>
                       </ng-template>
                   </div>
                   
                   <!-- Info if no variants needed -->
                   <div *ngIf="tempSelectedProductId() && !hasVariants()" class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-center gap-2">
                       <ng-icon name="heroInformationCircleSolid" class="h-5 w-5"></ng-icon>
                       Este producto no tiene variantes (Talla Única). Puede agregarlo directamente.
                   </div>

                </div>

                <!-- Modal Footer -->
                <div class="bg-gray-50 dark:bg-slate-700/50 px-6 py-4 flex justify-end gap-3 shrink-0 border-t border-gray-200 dark:border-slate-700">
                    <button type="button" (click)="closeAddItemModal()" class="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition">
                        Cancelar
                    </button>
                    <button type="button" (click)="confirmAddFromModal()" 
                            [disabled]="!canAddFromModal()"
                            class="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2">
                        <ng-icon name="heroCheckSolid" class="h-5 w-5"></ng-icon>
                        Confirmar y Agregar
                    </button>
                </div>
            </div>
        </div>
    </div>

    </div>
  `
})
export class PurchaseOrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private poRepo = inject(PurchaseOrderRepository);
  private supplierRepo = inject(SupplierRepository);
  private productRepo = inject(ProductRepository);
  private warehouseRepo = inject(WarehouseRepository);
  private session = inject(SessionService);

  public readonly ICONS = APP_ICONS;
  protected readonly Validators = Validators;

  form: FormGroup;
  isEditMode = signal(false);
  isSaving = signal(false);
  isLoading = signal(true);

  // Data Signals
  suppliers = signal<Supplier[]>([]);
  products = signal<Partial<ScmProduct>[]>([]);
  warehouses = signal<Warehouse[]>([]); // New Signal for Warehouses

  // Use a map for fast checking of variants for a selected product
  private variantMap = new Map<string, ScmProductVariant[]>();

  constructor() {
    this.form = this.fb.group({
      supplier_id: [null, [Validators.required]],
      warehouse_id: [null, [Validators.required]], // Added warehouse_id
      po_date: [new Date().toISOString().split('T')[0], [Validators.required]],
      expected_delivery_date: [null],
      status: ['DRAFT', [Validators.required]],
      notes: [''],
      lines: this.fb.array([])
    });
  }

  get lines(): FormArray {
    return this.form.get('lines') as FormArray;
  }

  get linesControls() {
    return this.lines.controls as FormGroup[];
  }

  grandTotal = computed(() => {
    // We listen to form value changes indirectly via signal if we wanted, 
    // but here form value is not a signal. 
    // However, angular signals computed requires signal dependencies.
    // So usually we use a signal updated by ValueChanges.
    // Let's implement calculateGrandTotal manually on valueChanges or just use a method in template.
    // Better: use a signal 'totalAmount' and update it on form change.
    return this.totalAmount();
  });

  private totalAmount = signal(0);

  async ngOnInit() {
    const tenantId = this.session.currentTenantId();
    if (!tenantId) {
      console.error('No Tenant ID in session');
      return;
    }

    this.isLoading.set(true);

    try {
      // DEBUG: Log start of fetch
      console.log('Fetching PO Resources for Tenant:', tenantId);

      // Auto-fix: Ensure variants exist for configured products
      try {
        await this.productRepo.syncMissingVariants();
      } catch (err) {
        console.warn('Sync variants warning:', err); // Don't block main UI
      }

      // Parallel Data Fetching for Agility
      // Use checks to avoid one failure killing all
      const suppliersPromise = this.supplierRepo.getAll(tenantId).catch(err => { console.error('Suppliers failed', err); return []; });
      const productsPromise = this.productRepo.getLightweightList(tenantId).catch(err => { console.error('Products failed', err); return []; });
      const variantsPromise = this.productRepo.getAllVariants(tenantId).catch(err => { console.error('Variants failed', err); return []; });
      const warehousesPromise = this.warehouseRepo.getAll(tenantId).catch(err => { console.error('Warehouses failed', err); return []; });

      const [suppliers, products, variants, warehouses] = await Promise.all([
        suppliersPromise,
        productsPromise,
        variantsPromise,
        warehousesPromise
      ]);

      console.log('Resources Loaded:', {
        suppliersCount: suppliers.length,
        productsCount: products.length,
        warehousesCount: warehouses.length
      });

      this.suppliers.set(suppliers);
      this.products.set(products);
      this.warehouses.set(warehouses);

      // Index variants by product
      variants.forEach(v => {
        const list = this.variantMap.get(v.product_id) || [];
        list.push(v);
        this.variantMap.set(v.product_id, list);
      });

      // Handle Edit Mode or Pre-fill from Query Params
      this.route.queryParams.subscribe(params => {
        if (params['product_id']) {
          // Force user to confirm variant in modal before adding
          this.openAddItemModal(params['product_id']);
        }
      });
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.isEditMode.set(true);
        await this.loadOrder(id);
      }

    } catch (error) {
      console.error('CRITICAL Error loading data in PurchaseOrderForm', error);
      alert('Error cargando datos. Revise la consola.');
    } finally {
      this.isLoading.set(false);
    }

    // Subscribe to changes for totals
    this.lines.valueChanges.subscribe(() => {
      this.updateTotal();
    });
  }

  async loadOrder(id: string) {
    const po = await this.poRepo.getById(id);
    if (!po) return;

    this.form.patchValue({
      supplier_id: po.supplier_id,
      warehouse_id: po.warehouse_id, // Load warehouse
      po_date: po.po_date,
      expected_delivery_date: po.expected_delivery_date,
      status: po.status,
      notes: po.notes
    });

    const lines = await this.poRepo.getLines(id);
    lines.forEach(l => {
      this.addLine(l);
    });
    // Recalc
    this.updateTotal();
  }

  // --- Add Item Modal Logic ---
  isAddItemModalOpen = signal(false);
  tempSelectedProductId = signal<string | null>(null);
  tempSelectedVariantId = signal<string | null>(null);

  // Computed signals for the modal
  modalVariants = computed(() => {
    const pid = this.tempSelectedProductId();
    if (!pid) return [];
    const variants = this.variantMap.get(pid) || [];
    return variants.sort((a, b) => {
      const valA = parseFloat(a.attribute_value) || 0;
      const valB = parseFloat(b.attribute_value) || 0;
      return valA - valB;
    });
  });

  modalSelectedProduct = computed(() => {
    const pid = this.tempSelectedProductId();
    return this.products().find(p => p.id === pid) || null;
  });

  hasVariants = computed(() => {
    const prod = this.modalSelectedProduct();
    if (!prod) return false;
    const vars = this.modalVariants();
    if (vars.length > 0) return true;

    // Check config
    if (prod.size_config) {
      if (Array.isArray(prod.size_config) && prod.size_config.length > 0) return true;
      if (typeof prod.size_config === 'object' && (prod.size_config as any).min) return true;
    }
    return false;
  });

  canAddFromModal = computed(() => {
    const pid = this.tempSelectedProductId();
    if (!pid) return false;

    if (this.hasVariants()) {
      return !!this.tempSelectedVariantId();
    }
    return true; // No variants needed
  });

  openAddItemModal(preSelectProductId?: string) {
    this.tempSelectedProductId.set(preSelectProductId || null);
    this.tempSelectedVariantId.set(null);
    this.isAddItemModalOpen.set(true);
  }

  closeAddItemModal() {
    this.isAddItemModalOpen.set(false);
  }

  onModalProductChange(target: any) {
    const pid = target.value;
    this.tempSelectedProductId.set(pid === 'null' ? null : pid);
    this.tempSelectedVariantId.set(null); // Reset variant
  }

  selectVariantInModal(variantId: string) {
    this.tempSelectedVariantId.set(variantId);
  }

  confirmAddFromModal() {
    if (!this.canAddFromModal()) return;

    const pid = this.tempSelectedProductId();
    const vid = this.tempSelectedVariantId();
    const prod = this.modalSelectedProduct();

    if (!pid || !prod) return;

    // Add to FormArray
    this.addLine({
      product_id: pid,
      variant_id: vid,
      quantity_ordered: 1, // Default
      unit_price: 0 // Could default to cost_price
    });

    this.closeAddItemModal();
  }

  // --- Form Array Logic ---

  // Modified addLine to push directly (used by loadOrder AND modal)
  addLine(data?: any) {
    const group = this.fb.group({
      product_id: [data?.product_id || null, Validators.required],
      variant_id: [data?.variant_id || null],
      quantity_ordered: [data?.quantity_ordered || 1, [Validators.required, Validators.min(1)]],
      unit_price: [data?.unit_price || 0, [Validators.required, Validators.min(0)]]
    });

    // Set variant validator if needed (though coming from modal it should be fine, but for safety/edit)
    if (data?.product_id) {
      this.setVariantValidatorInternal(group, data.product_id);
    }

    this.lines.push(group);
    this.updateTotal(); // calc totals immediately
  }

  private setVariantValidatorInternal(group: FormGroup, productId: string) {
    const variants = this.variantMap.get(productId) || [];
    const product = this.products().find(p => p.id === productId);

    let hasConfiguredVariants = false;
    if (product?.size_config) {
      if (Array.isArray(product.size_config) && product.size_config.length > 0) hasConfiguredVariants = true;
      else if (typeof product.size_config === 'object' && (product.size_config as any).min) hasConfiguredVariants = true;
    }

    const variantControl = group.get('variant_id');
    if (variants.length > 0 || hasConfiguredVariants) {
      variantControl?.setValidators(Validators.required);
    } else {
      variantControl?.clearValidators();
    }
    variantControl?.updateValueAndValidity();
  }

  removeLine(index: number) {
    this.lines.removeAt(index);
    this.updateTotal();
  }

  // Helpers for Template Display
  getProductName(index: number): string {
    const pid = this.lines.at(index).get('product_id')?.value;
    const p = this.products().find(x => x.id === pid);
    return p ? `${p.name} (${p.sku})` : 'Producto desconocido';
  }

  getLineVariantName(index: number): string {
    const pid = this.lines.at(index).get('product_id')?.value;
    const vid = this.lines.at(index).get('variant_id')?.value;
    if (!pid || !vid) return 'N/A';

    const variants = this.variantMap.get(pid) || [];
    const v = variants.find(x => x.id === vid);
    return v ? v.attribute_value : '';
  }

  // Helper for Stepper
  incrementQty(index: number) {
    const control = this.lines.at(index).get('quantity_ordered');
    const current = control?.value || 0;
    control?.setValue(current + 1);
  }

  decrementQty(index: number) {
    const control = this.lines.at(index).get('quantity_ordered');
    const current = control?.value || 0;
    if (current > 1) {
      control?.setValue(current - 1);
    }
  }

  private updateVariantValidators(index: number, productId: string | null) {
    // Compatibility wrapper if needed, or remove if unused. 
    // Since we lock the row, we might not need dynamic change listening anymore.
    // But keeping for safety.
    const control = this.lines.at(index) as FormGroup;
    if (productId) this.setVariantValidatorInternal(control, productId);
  }

  // Optional: Auto-set price from product cost if available (Future feature)
  // const prod = this.products().find(p => p.id === control.get('product_id')?.value);
  // if(prod?.cost_price) control.patchValue({ unit_price: prod.cost_price });


  calculateLineTotal(index: number): number {
    const val = this.lines.at(index).value;
    return (val.quantity_ordered || 0) * (val.unit_price || 0);
  }

  updateTotal() {
    let sum = 0;
    for (let i = 0; i < this.lines.length; i++) {
      sum += this.calculateLineTotal(i);
    }
    this.totalAmount.set(sum);
  }

  async onSubmit() {
    if (this.form.invalid) return;
    this.isSaving.set(true);

    try {
      const formValue = this.form.value;
      const poData: Partial<PurchaseOrder> = {
        supplier_id: formValue.supplier_id,
        warehouse_id: formValue.warehouse_id, // Save warehouse
        po_date: formValue.po_date,
        expected_delivery_date: formValue.expected_delivery_date,
        status: formValue.status,
        notes: formValue.notes,
        // Calculate amounts
        total_amount: this.totalAmount(),
        net_amount: this.totalAmount(), // Simplified (no tax yet)
        tax_amount: 0,
        freight_amount: 0,
        // po_number: generated by backend or trigger usually
        po_number: `PO-${Date.now().toString().slice(-6)}` // Temporary client-side ID
      };

      let order: PurchaseOrder;
      if (this.isEditMode()) {
        const id = this.route.snapshot.paramMap.get('id')!;
        order = await this.poRepo.update(id, poData);

        // Basic Line Sync Strategy: Delete all and recreate (Easiest for MVP)
        // Or diffing? For agility and MVP, usually delete/rewrite is acceptable for small orders.
        // BUT `SupabasePurchaseOrderRepository` doesn't have `deleteAllLines` method. 
        // I should add one or loop delete. looping `deleteLine` is okay.
        const oldLines = await this.poRepo.getLines(id);
        await Promise.all(oldLines.map(l => this.poRepo.deleteLine(l.id)));
      } else {
        order = await this.poRepo.create(poData);
      }

      // Save Lines
      const lines = this.form.value.lines;
      await Promise.all(lines.map((l: any, idx: number) => {
        return this.poRepo.addLine({
          purchase_order_id: order.id,
          line_number: idx + 1,
          product_id: l.product_id,
          variant_id: l.variant_id,
          quantity_ordered: l.quantity_ordered,
          quantity_received: 0,
          unit_price: l.unit_price,
          line_amount: l.quantity_ordered * l.unit_price,
          tax_percent: 0
        });
      }));

      this.router.navigate(['/cadena-suministro/compras']);

    } catch (e) {
      console.error('Error saving PO', e);
      alert('Error al guardar la orden de compra');
    } finally {
      this.isSaving.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/cadena-suministro/compras']);
  }
}
