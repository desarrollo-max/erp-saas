import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { NotificationService } from '@core/services/notification.service';

import { ProductRepository } from '@core/repositories/product.repository';
import { SupabaseService } from '@core/services/supabase.service';
import { SessionService } from '@core/services/session.service';
import { ScmWarehouse, ScmProduct } from '@core/models/erp.types';
import { APP_ICONS } from '@core/constants/app-icons';

@Component({
  selector: 'app-purchasing',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconsModule],
  template: `
    <div class="h-screen flex flex-col transition-colors duration-300" style="background-color: var(--app-bg); color: var(--app-text);">
      
      <!-- HEADER -->
      <div class="h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 shrink-0" style="background-color: var(--card-bg); border-bottom: 1px solid var(--border-color);">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition">
            <ng-icon [name]="ICONS.back" class="w-6 h-6"></ng-icon>
          </button>
          <h1 class="text-lg sm:text-xl font-bold flex items-center gap-2 truncate">
            <ng-icon [name]="ICONS.purchases" class="text-cyan-600 w-6 h-6"></ng-icon>
            <span class="hidden sm:inline">Compras / Abastecimiento</span>
            <span class="sm:hidden">Compras</span>
          </h1>
        </div>
        
        <div class="flex items-center gap-4">
          <select [(ngModel)]="selectedWarehouseId"
                  class="p-2 rounded-md border text-xs sm:text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-colors max-w-[150px] sm:max-w-xs"
                  style="background-color: var(--subtle-bg); border-color: var(--border-color); color: var(--app-text);">
            <option [ngValue]="null"> -- Destino -- </option>
            <option *ngFor="let w of warehouses()" [value]="w.id">{{ w.name }}</option>
          </select>
        </div>
      </div>

      <!-- CONTENT WRAPPER -->
      <div class="flex-grow flex overflow-hidden relative">
        
        <!-- MAIN PRODUCT AREA (Scrollable) -->
        <div class="flex-grow flex flex-col p-4 sm:p-6 overflow-hidden">
          
          <!-- Search Bar -->
          <div class="mb-4 shrink-0">
            <div class="relative">
              <input type="text" [(ngModel)]="searchQuery" placeholder="Buscar productos (Nombre, SKU)..."
                     class="w-full pl-10 pr-4 py-3 rounded-xl border shadow-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                     style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--app-text);">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                <ng-icon [name]="ICONS.search" class="w-5 h-5"></ng-icon>
              </div>
            </div>
          </div>

          <!-- Product Grid -->
          <div class="flex-grow overflow-y-auto pr-1 pb-20 sm:pb-0"> <!-- PB for mobile float button space -->
             
             <!-- Loading State -->
             <div *ngIf="isLoading()" class="flex justify-center py-10">
               <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600"></div>
             </div>

             <!-- Grid -->
             <div *ngIf="!isLoading()" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
               <div *ngFor="let product of filteredProducts()" 
                    class="rounded-xl shadow-sm p-3 sm:p-4 flex flex-col gap-2 relative group border transition-all hover:shadow-md"
                    [class.border-cyan-500]="getQuantity(product.id) > 0"
                    style="background-color: var(--card-bg); border-color: var(--border-color);">
                 
                 <!-- Image -->
                 <div class="aspect-square rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden mb-2 relative">
                    <img *ngIf="product.image_url" [src]="product.image_url" loading="lazy" class="object-cover w-full h-full" alt="Prod">
                    <span *ngIf="!product.image_url" class="text-2xl font-bold opacity-30 select-none">{{ product.name.charAt(0) }}</span>
                    
                    <!-- Selection Badge -->
                    <div *ngIf="getQuantity(product.id) > 0" class="absolute top-2 right-2 bg-cyan-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                      x{{ getQuantity(product.id) }}
                    </div>
                 </div>

                 <!-- Info -->
                 <h3 class="font-semibold text-xs sm:text-sm line-clamp-2 leading-tight min-h-[2.5em]" [title]="product.name">{{ product.name }}</h3>
                 <p class="text-xs opacity-60 mb-2 truncate">{{ product.sku }}</p>

                 <!-- Pricing & Actions Row -->
                 <div class="mt-auto pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-2">
                       <span class="text-xs font-medium opacity-80">Costo Ref.</span>
                       <span class="font-bold text-sm">{{ product.cost_price | currency }}</span>
                    </div>

                    <!-- Inline Input Control -->
                    <div class="flex items-center justify-between bg-gray-50 dark:bg-slate-800 rounded-lg p-1">
                      <button (click)="updateCart(product, -1)" 
                              class="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-colors text-gray-600 dark:text-gray-300 disabled:opacity-30"
                              [disabled]="getQuantity(product.id) === 0">
                        <ng-icon [name]="ICONS.subtract" class="w-4 h-4"></ng-icon>
                      </button>
                      
                      <input type="number" 
                             [value]="getQuantity(product.id)"
                             (input)="onInputQuantity(product, $event)"
                             class="w-10 text-center bg-transparent border-none p-0 text-sm font-bold focus:ring-0 appearance-none"
                             min="0">

                      <button (click)="updateCart(product, 1)" 
                              class="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-slate-700 shadow-sm text-cyan-600 hover:text-cyan-700 transition-colors">
                        <ng-icon [name]="ICONS.add" class="w-4 h-4"></ng-icon>
                      </button>
                    </div>
                 </div>

               </div>
             </div>
          </div>
        </div>

        <!-- SIDEBAR SUMMARY (Desktop) & FLOATING (Mobile) -->
        
        <!-- Desktop Sidebar -->
        <div class="hidden md:flex w-80 lg:w-96 flex-col shadow-xl z-20 border-l shrink-0" style="background-color: var(--card-bg); border-color: var(--border-color);">
          <div class="p-4 border-b flex items-center gap-2 font-bold text-lg" style="border-color: var(--border-color);">
             <ng-icon [name]="ICONS.list" class="w-5 h-5 text-cyan-600"></ng-icon>
             Resumen de Orden
          </div>
          
          <div class="flex-grow overflow-y-auto p-4 flex flex-col gap-2">
             <ng-container *ngIf="cartItems().length > 0; else emptyCart">
               <div *ngFor="let item of cartItems()" class="flex justify-between items-start text-sm p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                 <div class="flex flex-col max-w-[70%]">
                    <span class="font-medium truncate">{{ item.product.name }}</span>
                    <span class="text-xs opacity-60">{{ item.product.sku }}</span>
                 </div>
                 <div class="flex flex-col items-end">
                    <span class="font-bold">x{{ item.quantity }}</span>
                    <span class="text-xs text-cyan-600 cursor-pointer hover:underline" (click)="removeItem(item.product.id)">Quitar</span>
                 </div>
               </div>
             </ng-container>
             <ng-template #emptyCart>
               <div class="h-64 flex flex-col items-center justify-center opacity-40 text-center">
                 <ng-icon [name]="ICONS.purchases" class="w-12 h-12 mb-2"></ng-icon>
                 <p class="text-sm px-4">Selecciona productos del catálogo para armar tu orden.</p>
               </div>
             </ng-template>
          </div>

          <div class="p-4 border-t" style="border-color: var(--border-color);">
            <div class="flex justify-between mb-4 font-bold text-lg">
               <span>Total Items:</span>
               <span>{{ totalItems() }}</span>
            </div>
            <button (click)="checkout()" 
                    [disabled]="cartItems().length === 0 || !selectedWarehouseId() || isProcessing()"
                    class="w-full py-3 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2"
                    [ngClass]="{
                      'bg-cyan-600 hover:bg-cyan-700': cartItems().length > 0 && selectedWarehouseId(),
                      'bg-gray-400 cursor-not-allowed': cartItems().length === 0 || !selectedWarehouseId()
                    }">
               <span *ngIf="!isProcessing()">Confirmar Entrada</span>
               <div *ngIf="isProcessing()" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </button>
            <p *ngIf="!selectedWarehouseId()" class="text-xs text-red-500 text-center mt-2">Seleccione almacén de destino</p>
          </div>
        </div>

        <!-- Mobile Floating Bar -->
        <div class="md:hidden fixed bottom-0 left-0 right-0 p-4 border-t shadow-2xl z-50 flex items-center justify-between gap-4 glass-panel"
             style="background-color: var(--card-bg); border-color: var(--border-color);">
           <div class="flex flex-col">
              <span class="text-xs font-semibold opacity-70">Resumen</span>
              <span class="font-bold text-lg">{{ totalItems() }} Artículos</span>
           </div>
           
           <button (click)="checkout()" 
                    [disabled]="cartItems().length === 0 || !selectedWarehouseId() || isProcessing()"
                    class="flex-grow py-3 rounded-lg font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 max-w-[200px]"
                    [ngClass]="{
                      'bg-cyan-600 hover:bg-cyan-700': cartItems().length > 0 && selectedWarehouseId(),
                      'bg-gray-400 cursor-not-allowed': cartItems().length === 0 || !selectedWarehouseId()
                    }">
               <span *ngIf="!isProcessing()">Confirmar</span>
               <div *ngIf="isProcessing()" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
           </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* Hide number input arrows */
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { 
      -webkit-appearance: none; 
      margin: 0; 
    }
    .glass-panel {
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
  `]
})
export class PurchasingComponent implements OnInit {
  // Dependencies

  private productRepo = inject(ProductRepository);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private supabase = inject(SupabaseService);
  private session = inject(SessionService);
  public readonly ICONS = APP_ICONS;

  // Data Signals
  warehouses = signal<ScmWarehouse[]>([]);
  products = signal<ScmProduct[]>([]);
  isLoading = signal(true);

  // State Signals
  selectedWarehouseId = signal<string | null>(null);
  searchQuery = signal('');
  isProcessing = signal(false);

  // Cart Logic: Map<ProductId, Quantity>
  // We use a simple object/map approach or array. Let's use a signal holding the array for easier iteration.
  // Actually, a Map might be cleaner for O(1) lookups in template. But let's stick to array of objects to match previous logc but optimized.
  // Let's use a signal of detailed items.
  cartItems = signal<Array<{ product: ScmProduct, quantity: number }>>([]);

  // Computed
  filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.products().filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  });

  totalItems = computed(() => {
    return this.cartItems().reduce((acc, item) => acc + item.quantity, 0);
  });

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      this.isLoading.set(true);
      const tenantId = this.session.currentTenantId();
      if (!tenantId) return;

      const [whResponse, prods] = await Promise.all([
        this.supabase.client.from('scm_warehouses').select('*').eq('tenant_id', tenantId),
        this.productRepo.getAll(tenantId)
      ]);

      if (whResponse.error) throw whResponse.error;

      this.warehouses.set(whResponse.data as ScmWarehouse[]);
      this.products.set(prods);
    } catch (error) {
      console.error(error);
      this.notification.error('Error cargando datos de compras');
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- Agile Logic ---

  getQuantity(productId: string): number {
    const item = this.cartItems().find(i => i.product.id === productId);
    return item ? item.quantity : 0;
  }

  updateCart(product: ScmProduct, change: number) {
    this.cartItems.update(items => {
      const existingIndex = items.findIndex(i => i.product.id === product.id);

      if (existingIndex > -1) {
        const currentQ = items[existingIndex].quantity;
        const newQ = currentQ + change;

        if (newQ <= 0) {
          // Remove
          return items.filter((_, index) => index !== existingIndex);
        } else {
          // Update
          const newItems = [...items];
          newItems[existingIndex] = { ...newItems[existingIndex], quantity: newQ };
          return newItems;
        }
      } else {
        if (change > 0) {
          // Add
          return [...items, { product, quantity: change }];
        }
        return items;
      }
    });
  }

  onInputQuantity(product: ScmProduct, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10);

    if (isNaN(val) || val < 0) return;

    this.setQuantity(product, val);
  }

  setQuantity(product: ScmProduct, quantity: number) {
    this.cartItems.update(items => {
      if (quantity <= 0) {
        return items.filter(i => i.product.id !== product.id);
      }

      const existingIndex = items.findIndex(i => i.product.id === product.id);
      if (existingIndex > -1) {
        const newItems = [...items];
        newItems[existingIndex] = { ...newItems[existingIndex], quantity };
        return newItems;
      } else {
        return [...items, { product, quantity }];
      }
    });
  }

  removeItem(productId: string) {
    this.cartItems.update(items => items.filter(i => i.product.id !== productId));
  }

  goBack() {
    this.router.navigate(['/launcher']);
  }

  async checkout() {
    if (!this.selectedWarehouseId()) {
      this.notification.error('Seleccione un almacén de destino');
      return;
    }

    this.isProcessing.set(true);
    try {
      const warehouseId = this.selectedWarehouseId()!;
      // Using today's date
      const date = new Date().toISOString().split('T')[0];

      const movements = this.cartItems().map(item => ({
        product_id: item.product.id,
        warehouse_id: warehouseId,
        movement_date: date,
        quantity: item.quantity,
        movement_type: 'IN', // Assuming purchase adds stock directly for now as per previous logic
        notes: 'Compra Integrada desde Módulo de Abastecimiento',
        reference_type: 'purchase_agile'
      }));

      const { error } = await this.supabase.client
        .from('scm_stock_movements')
        .insert(movements);

      if (error) throw error;

      this.notification.success('Entrada de mercancía registrada exitosamente.');
      this.cartItems.set([]);

    } catch (error: any) {
      console.error('Purchase error', error);
      this.notification.error('Error al procesar la compra.');
    } finally {
      this.isProcessing.set(false);
    }
  }
}
