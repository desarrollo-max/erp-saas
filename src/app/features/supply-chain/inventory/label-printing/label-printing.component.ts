import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProductRepository } from '@core/repositories/product.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { ScmProduct, ScmProductVariant } from '@core/models/erp.types';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import { heroPrinterSolid, heroTrashSolid, heroPlusSolid, heroArrowLeftSolid } from '@ng-icons/heroicons/solid';
import QRCode from 'qrcode';

interface LabelItem {
    product: ScmProduct;
    variant: ScmProductVariant | null; // Null if no variant selected or product has no variants
    quantity: number;
    includePrice: boolean;
    qrCodeDataUrl?: string; // Generated on add
}

@Component({
    selector: 'app-label-printing',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconsModule],
    viewProviders: [provideIcons({ heroPrinterSolid, heroTrashSolid, heroPlusSolid, heroArrowLeftSolid })],
    template: `
    <div class="min-h-screen bg-gray-50 flex flex-col no-print">
      
      <!-- HEADER -->
      <div class="bg-white border-b border-gray-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="md:flex md:items-center md:justify-between">
            <div class="flex items-center gap-4">
               <button routerLink="/cadena-suministro/inventario" class="text-gray-500 hover:text-gray-700">
                  <ng-icon name="heroArrowLeftSolid" class="h-6 w-6"></ng-icon>
               </button>
               <div>
                  <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Impresión de Etiquetas
                  </h2>
                  <p class="mt-1 text-sm text-gray-500">
                    Genera y manda a imprimir etiquetas con código QR para tus productos.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN CONTENT -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- FORM PANEL -->
            <div class="lg:col-span-1">
                <div class="bg-white shadow rounded-lg p-6 border border-gray-100 sticky top-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Agregar a la Cola</h3>
                    
                    <form [formGroup]="form" (ngSubmit)="addToQueue()" class="space-y-4">
                        
                        <!-- Product Select -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Producto</label>
                            <select formControlName="product" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm">
                                <option [ngValue]="null">Seleccione un producto...</option>
                                <option *ngFor="let p of products()" [ngValue]="p">{{ p.name }} ({{ p.sku }})</option>
                            </select>
                        </div>

                        <!-- Variant Select (if applicable) -->
                        <div *ngIf="availableVariants().length > 0">
                            <label class="block text-sm font-medium text-gray-700">Talla / Variante</label>
                            <select formControlName="variant" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm">
                                <option [ngValue]="null">Seleccione opción...</option>
                                <option *ngFor="let v of availableVariants()" [ngValue]="v">
                                    {{ v.attribute_name }}: {{ v.attribute_value }}
                                </option>
                            </select>
                        </div>

                        <!-- Quantity -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700">Cantidad de Etiquetas</label>
                            <input type="number" formControlName="quantity" min="1" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                        </div>

                        <!-- Options -->
                        <div class="flex items-center">
                            <input id="include_price" type="checkbox" formControlName="includePrice" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                            <label for="include_price" class="ml-2 block text-sm text-gray-900">
                                Incluir Precio ({{ selectedProductPrice() | currency }})
                            </label>
                        </div>

                        <!-- Add Button -->
                        <button type="submit" [disabled]="form.invalid || isGenerating()" 
                            class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ng-icon *ngIf="!isGenerating()" name="heroPlusSolid" class="h-5 w-5 mr-2"></ng-icon>
                            <span *ngIf="isGenerating()">Generando...</span>
                            <span *ngIf="!isGenerating()">Agregar a la Lista</span>
                        </button>

                    </form>
                </div>
            </div>

            <!-- TABLE PANEL -->
            <div class="lg:col-span-2">
                <div class="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <h3 class="text-lg font-medium text-gray-900">Cola de Impresión</h3>
                        <div class="text-sm text-gray-500">
                            {{ totalLabels() }} etiquetas en total
                        </div>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variante</th>
                                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cant.</th>
                                    <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                    <th scope="col" class="relative px-6 py-3">
                                        <span class="sr-only">Eliminar</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                <tr *ngFor="let item of labelQueue(); let i = index">
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="flex items-center">
                                            <div class="h-10 w-10 flex-shrink-0">
                                                <img *ngIf="item.product.image_url" [src]="item.product.image_url" class="h-10 w-10 rounded-full object-cover">
                                                <div *ngIf="!item.product.image_url" class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                                    <ng-icon name="heroPrinterSolid" class="h-5 w-5"></ng-icon>
                                                </div>
                                            </div>
                                            <div class="ml-4">
                                                <div class="text-sm font-medium text-gray-900">{{ item.product.name }}</div>
                                                <div class="text-xs text-gray-500">{{ item.product.sku }}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {{ item.variant ? item.variant.attribute_value : 'N/A' }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                                        {{ item.quantity }}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                                        <span *ngIf="item.includePrice" class="text-green-600 font-medium">Sí</span>
                                        <span *ngIf="!item.includePrice" class="text-gray-400">No</span>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button (click)="removeItem(i)" class="text-red-600 hover:text-red-900">
                                            <ng-icon name="heroTrashSolid" class="h-5 w-5"></ng-icon>
                                        </button>
                                    </td>
                                </tr>
                                <tr *ngIf="labelQueue().length === 0">
                                    <td colspan="5" class="px-6 py-10 text-center text-sm text-gray-500">
                                        No hay etiquetas en la cola. Agrega productos desde el formulario.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                     <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                        <button (click)="printLabels()" [disabled]="labelQueue().length === 0"
                                class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                            <ng-icon name="heroPrinterSolid" class="h-5 w-5 mr-3"></ng-icon>
                            Imprimir Etiquetas
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>

    <!-- PRINT AREA (Hidden on Screen, Visible on Print) -->
    <div id="print-area" class="print-only hidden">
       <div class="label-grid">
           <ng-container *ngFor="let item of labelQueue()">
               <div *ngFor="let _ of [].constructor(item.quantity)" class="label-container">
                   <div class="label-content border border-black p-2 flex flex-col items-center justify-center text-center h-full">
                       <!-- Image (B&W Filter via CSS) -->
                       <div *ngIf="item.product.image_url" class="w-16 h-16 mb-1 grayscale">
                            <img [src]="item.product.image_url" class="w-full h-full object-contain filter grayscale contrast-125">
                       </div>
                       
                       <!-- Product Name -->
                       <div class="text-[10px] font-bold leading-tight mb-1 line-clamp-2 w-full uppercase">
                           {{ item.product.name }}
                       </div>

                       <!-- Variant/Size -->
                       <div *ngIf="item.variant" class="text-xs font-black mb-1">
                           {{ item.variant.attribute_value }}
                       </div>

                         <!-- QR Code -->
                       <div class="w-16 h-16 mb-1">
                            <img [src]="item.qrCodeDataUrl" class="w-full h-full object-contain">
                       </div>

                       <!-- Price -->
                       <div *ngIf="item.includePrice" class="text-sm font-bold">
                           {{ (item.product.sale_price || 0) | currency }}
                       </div>
                   </div>
               </div>
           </ng-container>
       </div>
    </div>
  `,
    styles: [`
    /* Print Styles */
    @media print {
      .no-print {
        display: none !important;
      }
      .print-only {
        display: block !important;
      }
      
      /* Grid Layout for Labels */
      .label-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, 4cm); /* Adjust based on label stock */
        grid-auto-rows: 6cm; /* Adjust based on label stock */
        gap: 0.2cm;
      }

      .label-container {
        width: 4cm;
        height: 6cm;
        overflow: hidden;
        page-break-inside: avoid;
      }

      body {
          margin: 0;
          padding: 0;
      }

      /* Force background graphics for images */
      * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
    
    .grayscale img {
        filter: grayscale(100%);
    }
  `]
})
export class LabelPrintingComponent implements OnInit {
    private productRepo = inject(ProductRepository);
    private session = inject(SessionService);
    private fb = inject(FormBuilder);

    // State
    products = signal<ScmProduct[]>([]);
    availableVariants = signal<ScmProductVariant[]>([]);
    labelQueue = signal<LabelItem[]>([]);
    isGenerating = signal(false);

    // Form
    form = this.fb.group({
        product: [null as ScmProduct | null, Validators.required],
        variant: [null as ScmProductVariant | null],
        quantity: [1, [Validators.required, Validators.min(1)]],
        includePrice: [true]
    });

    // Computed helper for UI
    selectedProductPrice = signal(0);
    totalLabels = signal(0);

    constructor() {
        // Listen to product changes to fetch variants
        this.form.controls.product.valueChanges.subscribe(async (p) => {
            if (p) {
                this.selectedProductPrice.set(p.sale_price || 0);
                await this.loadVariants(p.id);
            } else {
                this.selectedProductPrice.set(0);
                this.availableVariants.set([]);
            }
        });

        // Update total helper
        // Note: Can't use computed effectively here inside constructor easily without effects, so just manual update or getter
    }

    ngOnInit() {
        this.loadProducts();
    }

    async loadProducts() {
        const tenantId = this.session.currentTenantId();
        if (!tenantId) return;
        const data = await this.productRepo.getAll(tenantId);
        this.products.set(data);
    }

    async loadVariants(productId: string) {
        const variantsRaw = await this.productRepo.getVariantsByProductId(productId);
        // Assuming structure matches ScmProductVariant or similar
        this.availableVariants.set(variantsRaw);

        // Auto-select first if exists? No, force user to pick.
        if (variantsRaw.length > 0) {
            this.form.controls.variant.setValidators(Validators.required);
        } else {
            this.form.controls.variant.clearValidators();
        }
        this.form.controls.variant.updateValueAndValidity();
    }

    async addToQueue() {
        if (this.form.invalid) return;

        this.isGenerating.set(true);
        const val = this.form.value;
        const product = val.product as ScmProduct;
        const variant = val.variant as ScmProductVariant | null;

        // Generate QR
        // QR Content: SKU is a good identifier. Or a JSON object.
        // User requested: Product Name, QR, Size. 
        // QR usually encodes the SKU so the scanner can read it.
        const qrContent = variant ? variant.sku : product.sku;

        try {
            const qrDataUrl = await QRCode.toDataURL(qrContent, { errorCorrectionLevel: 'M', width: 100 });

            const newItem: LabelItem = {
                product,
                variant,
                quantity: val.quantity || 1,
                includePrice: val.includePrice || false,
                qrCodeDataUrl: qrDataUrl
            };

            this.labelQueue.update(q => [...q, newItem]);
            this.updateTotal();

            // Reset valid parts of form
            this.form.patchValue({ quantity: 1 });
        } catch (err) {
            console.error('QR Gen Error', err);
        } finally {
            this.isGenerating.set(false);
        }
    }

    removeItem(index: number) {
        this.labelQueue.update(q => q.filter((_, i) => i !== index));
        this.updateTotal();
    }

    updateTotal() {
        const total = this.labelQueue().reduce((acc, item) => acc + item.quantity, 0);
        this.totalLabels.set(total);
    }

    printLabels() {
        window.print();
    }
}
