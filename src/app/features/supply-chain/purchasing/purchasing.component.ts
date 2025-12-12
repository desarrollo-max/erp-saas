import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { NotificationService } from '@core/services/notification.service';
import { InventoryRepository } from '@core/repositories/inventory.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { SupabaseService } from '@core/services/supabase.service';
import { SessionService } from '@core/services/session.service';
import { ScmWarehouse, ScmProduct } from '@core/models/erp.types';

@Component({
  selector: 'app-purchasing',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIconsModule],
  template: `
    <div class="h-screen flex flex-col transition-colors duration-300" style="background-color: var(--app-bg); color: var(--app-text);">
      
      <!-- HEADER -->
      <div class="h-16 flex items-center justify-between px-6 shadow-sm z-10" style="background-color: var(--card-bg); border-bottom: 1px solid var(--border-color);">
        <div class="flex items-center gap-4">
          <button (click)="goBack()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition">
            <ng-icon name="heroArrowLeftSolid" class="w-6 h-6"></ng-icon>
          </button>
          <h1 class="text-xl font-bold flex items-center gap-2">
            <ng-icon name="heroShoppingCartSolid" class="text-cyan-600 w-6 h-6"></ng-icon>
            Compras / Abastecimiento
          </h1>
        </div>
        
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium opacity-70">Almacén de Entrada:</label>
          <select [(ngModel)]="selectedWarehouseId"
                  class="p-2 rounded-md border text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-colors"
                  style="background-color: var(--subtle-bg); border-color: var(--border-color); color: var(--app-text);">
            <option [ngValue]="null">Seleccionar Almacén</option>
            <option *ngFor="let w of warehouses()" [value]="w.id">{{ w.name }}</option>
          </select>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="flex-grow flex overflow-hidden">
        
        <!-- PRODUCT GRID (Left) -->
        <div class="flex-grow flex flex-col p-6 overflow-hidden">
          
          <!-- Search Bar -->
          <div class="mb-4">
            <div class="relative">
              <input type="text" [(ngModel)]="searchQuery" placeholder="Buscar productos en catálogo..."
                     class="w-full pl-10 pr-4 py-3 rounded-xl border shadow-sm outline-none focus:ring-2 focus:ring-cyan-500 transition-colors"
                     style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--app-text);">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                <ng-icon name="heroMagnifyingGlassSolid" class="w-5 h-5"></ng-icon>
              </div>
            </div>
          </div>

          <!-- Grid -->
          <div class="flex-grow overflow-y-auto pr-2">
             <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
               <div *ngFor="let product of filteredProducts()" 
                    (click)="addToCart(product)"
                    class="rounded-xl shadow-sm p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95 flex flex-col gap-2 relative group border"
                    style="background-color: var(--card-bg); border-color: var(--border-color);">
                 
                 <!-- Image Placeholder -->
                 <div class="aspect-square rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden mb-2">
                    <img *ngIf="product.image_url" [src]="product.image_url" class="object-cover w-full h-full" alt="Prod">
                    <span *ngIf="!product.image_url" class="text-2xl font-bold opacity-30">{{ product.name.charAt(0) }}</span>
                 </div>

                 <h3 class="font-semibold text-sm line-clamp-2 leading-tight">{{ product.name }}</h3>
                 <div class="mt-auto flex justify-between items-center">
                   <p class="text-xs opacity-70">
                     {{ product.sku }}
                   </p>
                 </div>
               </div>
             </div>
          </div>
        </div>

        <!-- ORDER (Right) -->
        <div class="w-96 flex flex-col shadow-xl z-20 border-l" style="background-color: var(--card-bg); border-color: var(--border-color);">
          
          <div class="p-4 border-b" style="border-color: var(--border-color);">
            <h2 class="font-bold text-lg flex items-center gap-2">
              <ng-icon name="heroClipboardDocumentListSolid" class="w-5 h-5"></ng-icon>
              Orden de Compra
            </h2>
            <p class="text-xs opacity-60">Entrada interna de productos</p>
          </div>

          <!-- Items List -->
          <div class="flex-grow overflow-y-auto p-4 flex flex-col gap-2">
            <div *ngIf="cart().length === 0" class="h-full flex flex-col items-center justify-center opacity-40">
              <ng-icon name="heroShoppingCartSolid" class="w-12 h-12 mb-2"></ng-icon>
              <p>Orden vacía</p>
            </div>

            <div *ngFor="let item of cart()" class="rounded-lg p-3 flex justify-between items-center group relative border" 
                 style="background-color: var(--subtle-bg); border-color: var(--border-color);">
              
              <div class="flex flex-col flex-grow min-w-0 pr-2">
                <span class="font-medium truncate">{{ item.product.name }}</span>
                <span class="text-xs opacity-60">{{ item.product.sku }}</span>
              </div>
              
              <div class="flex items-center gap-2">
                 <button (click)="updateQuantity(item, -1)" class="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center hover:bg-gray-300">-</button>
                 <span class="font-bold w-6 text-center">{{ item.quantity }}</span>
                 <button (click)="updateQuantity(item, 1)" class="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center hover:bg-gray-300">+</button>
              </div>

              <button (click)="removeFromCart(item)" class="text-red-500 opacity-0 group-hover:opacity-100 absolute -top-2 -right-2 bg-white dark:bg-slate-800 rounded-full shadow-md p-1">
                 <ng-icon name="heroXMarkSolid" class="w-4 h-4"></ng-icon>
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-4 border-t" style="border-color: var(--border-color);">
            <button (click)="checkout()" 
                    [disabled]="cart().length === 0 || !selectedWarehouseId() || isProcessing()"
                    class="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2"
                    [ngClass]="{
                      'bg-cyan-600 hover:bg-cyan-700 hover:shadow-cyan-500/30': cart().length > 0 && selectedWarehouseId(),
                      'bg-gray-400 cursor-not-allowed': cart().length === 0 || !selectedWarehouseId()
                    }">
              <span *ngIf="!isProcessing()">Confirmar Compra <span *ngIf="selectedWarehouseId()">(Entrada)</span></span>
              <div *ngIf="isProcessing()" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </button>
            <p *ngIf="!selectedWarehouseId()" class="text-xs text-red-500 text-center mt-2">Seleccione un almacén de destino</p>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class PurchasingComponent implements OnInit {
  private inventoryRepo = inject(InventoryRepository);
  private productRepo = inject(ProductRepository);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private supabase = inject(SupabaseService);
  private session = inject(SessionService);

  warehouses = signal<ScmWarehouse[]>([]);
  products = signal<ScmProduct[]>([]);

  selectedWarehouseId = signal<string | null>(null);
  searchQuery = signal('');
  cart = signal<{ product: ScmProduct, quantity: number }[]>([]);
  isProcessing = signal(false);

  filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.products().filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  });

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const tenantId = this.session.currentTenantId();
      if (!tenantId) return;

      this.warehouses.set(await this.inventoryRepo.getWarehouses(tenantId));
      this.products.set(await this.productRepo.getAll(tenantId));
    } catch (error) {
      console.error(error);
      this.notification.error('Error cargando datos de compras');
    }
  }

  addToCart(product: ScmProduct) {
    this.cart.update(current => {
      const existing = current.find(i => i.product.id === product.id);
      if (existing) {
        return current.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  updateQuantity(item: any, change: number) {
    this.cart.update(current => {
      return current.map(i => {
        if (i.product.id === item.product.id) {
          const newQ = i.quantity + change;
          return newQ > 0 ? { ...i, quantity: newQ } : i;
        }
        return i;
      });
    });
  }

  removeFromCart(item: any) {
    this.cart.update(current => current.filter(i => i !== item));
  }

  goBack() {
    this.router.navigate(['/launcher']);
  }

  async checkout() {
    if (!this.selectedWarehouseId()) return;

    this.isProcessing.set(true);
    try {
      const warehouseId = this.selectedWarehouseId()!;
      const movements = this.cart().map(item => ({
        product_id: item.product.id,
        warehouse_id: warehouseId,
        movement_date: new Date().toISOString().split('T')[0],
        quantity: item.quantity,
        movement_type: 'IN',
        notes: 'Compra Interna / Abastecimiento',
        reference_type: 'purchase_internal'
      }));

      const { error } = await this.supabase.client
        .from('scm_stock_movements')
        .insert(movements);

      if (error) throw error;

      this.notification.success('Compra registrada (Stock actualizado)');
      this.cart.set([]);

    } catch (error: any) {
      console.error('Purchase error', error);
      this.notification.error('Error al registrar compra');
    } finally {
      this.isProcessing.set(false);
    }
  }
}
