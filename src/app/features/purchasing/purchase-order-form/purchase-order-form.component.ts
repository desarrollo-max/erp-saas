import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { APP_ICONS } from '@core/constants/app-icons';

import { PurchaseOrderRepository } from '@core/repositories/purchase-order.repository';
import { SupplierRepository } from '@core/repositories/supplier.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { WarehouseRepository } from '@core/repositories/warehouse.repository';
import { SessionService } from '@core/services/session.service';
import { Supplier, ScmProduct, ScmProductVariant, PurchaseOrder, Warehouse } from '@core/models/erp.types';

@Component({
  selector: 'app-purchase-order-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconsModule],
  providers: [CurrencyPipe],
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
               <button type="button" (click)="addLine()" class="px-4 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-600 transition shadow-sm flex items-center gap-2">
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
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/4">Variante / Talla</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-32">Cantidad</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider w-40">Costo Unitario</th>
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

                    <!-- Product Selector -->
                    <td class="px-6 py-4">
                      <select formControlName="product_id" (change)="onProductChange(i)" 
                              class="block w-full rounded-md border-gray-300 dark:border-slate-600 bg-transparent text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-gray-200 py-2">
                         <option [ngValue]="null" class="text-gray-400">Seleccionar Producto...</option>
                         <option *ngFor="let p of products()" [value]="p.id" class="text-gray-900 dark:text-white font-medium">
                            {{ p.name }} ({{ p.sku }})
                         </option>
                      </select>
                      <div class="text-xs text-red-500 mt-1 pl-1" *ngIf="line.get('product_id')?.touched && line.get('product_id')?.invalid">
                        <span class="flex items-center gap-1"><ng-icon name="heroExclamationCircleSolid" class="h-3 w-3"></ng-icon> Requerido</span>
                      </div>
                    </td>

                    <!-- Variant Selector -->
                    <td class="px-6 py-4">
                       <ng-container *ngIf="line.get('product_id')?.value && getVariantsForLine(i).length > 0">
                         <div class="relative">
                            <select formControlName="variant_id" class="block w-full rounded-md border-gray-300 dark:border-slate-600 bg-transparent text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-gray-200 py-2 pl-3 pr-8">
                                <option [ngValue]="null">-- Seleccionar Talla --</option>
                                <option *ngFor="let v of getVariantsForLine(i)" [value]="v.id">
                                   {{ v.attribute_value }} {{ v.sku ? '('+v.sku+')' : '' }}
                                </option>
                         </select>
                         <div class="text-xs text-red-500 mt-1 pl-1" *ngIf="line.get('variant_id')?.touched && line.get('variant_id')?.invalid">
                           <span class="flex items-center gap-1"><ng-icon name="heroExclamationCircleSolid" class="h-3 w-3"></ng-icon> Talla requerida</span>
                         </div>
                       </div>
                    </ng-container>
                       <ng-container *ngIf="!line.get('product_id')?.value">
                         <span class="text-xs text-gray-400 italic block py-2 px-3 bg-gray-50 dark:bg-slate-900/50 rounded border border-gray-100 dark:border-slate-700">
                           Primero elija producto
                         </span>
                       </ng-container>
                       <ng-container *ngIf="line.get('product_id')?.value && getVariantsForLine(i).length === 0">
                          <span class="text-xs text-gray-500 italic flex items-center gap-1 py-2">
                            <ng-icon name="heroInformationCircleSolid" class="text-blue-400"></ng-icon> Producto único
                          </span>
                       </ng-container>
                    </td>

                    <!-- Quantity -->
                    <td class="px-6 py-4">
                       <input type="number" formControlName="quantity_ordered" min="1" placeholder="0" class="block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-gray-200 text-center font-medium">
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
                           <p class="text-sm mt-1">Comience agregando productos a la lista de compra.</p>
                           <button (click)="addLine()" class="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm">Agregar primer producto</button>
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
    if (!tenantId) return;

    this.isLoading.set(true);

    try {
      // Parallel Data Fetching for Agility
      const [suppliers, products, variants, warehouses] = await Promise.all([
        this.supplierRepo.getAll(tenantId),
        this.productRepo.getLightweightList(tenantId),
        this.productRepo.getAllVariants(tenantId),
        this.warehouseRepo.getAll(tenantId)
      ]);

      this.suppliers.set(suppliers);
      this.products.set(products);
      this.warehouses.set(warehouses);

      // Index variants by product
      variants.forEach(v => {
        const list = this.variantMap.get(v.product_id) || [];
        list.push(v);
        this.variantMap.set(v.product_id, list);
      });

      // Handle Edit Mode
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.isEditMode.set(true);
        await this.loadOrder(id);
      } else {
        // Init with one empty line
        this.addLine();
      }

    } catch (error) {
      console.error('Error loading data', error);
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

  addLine(data?: any) {
    const group = this.fb.group({
      product_id: [data?.product_id || null, Validators.required],
      variant_id: [data?.variant_id || null],
      quantity_ordered: [data?.quantity_ordered || 1, [Validators.required, Validators.min(1)]],
      unit_price: [data?.unit_price || 0, [Validators.required, Validators.min(0)]]
    });
    this.lines.push(group);

    // Set initial validators based on product
    if (data?.product_id) {
      this.updateVariantValidators(this.lines.length - 1, data.product_id);
    }
  }

  removeLine(index: number) {
    this.lines.removeAt(index);
  }

  getVariantsForLine(index: number): ScmProductVariant[] {
    const control = this.lines.at(index);
    const productId = control.get('product_id')?.value;
    if (!productId) return [];
    return this.variantMap.get(productId) || [];
  }

  onProductChange(index: number) {
    const control = this.lines.at(index);
    const productId = control.get('product_id')?.value;

    // Reset variant when product changes
    control.patchValue({ variant_id: null });

    this.updateVariantValidators(index, productId);
  }

  private updateVariantValidators(index: number, productId: string | null) {
    const control = this.lines.at(index);
    const variantControl = control.get('variant_id');

    if (!productId) {
      variantControl?.clearValidators();
      variantControl?.updateValueAndValidity();
      return;
    }

    const variants = this.variantMap.get(productId) || [];
    if (variants.length > 0) {
      variantControl?.setValidators(Validators.required);
    } else {
      variantControl?.clearValidators();
    }
    variantControl?.updateValueAndValidity();
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
