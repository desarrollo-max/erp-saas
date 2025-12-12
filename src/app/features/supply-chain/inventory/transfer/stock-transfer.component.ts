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
  selector: 'app-stock-transfer',
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
            <ng-icon name="heroTruckSolid" class="text-purple-600 w-6 h-6"></ng-icon>
            Transferencia de Stock
          </h1>
        </div>
        
        <div class="flex items-center gap-4">
            <!-- Origen -->
            <div class="flex flex-col">
              <label class="text-[10px] uppercase font-bold opacity-70">Origen</label>
              <select [(ngModel)]="sourceWarehouseId" (change)="onSourceChange()" class="p-1 rounded border text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                      style="background-color: var(--subtle-bg); border-color: var(--border-color); color: var(--app-text);">
                <option [ngValue]="null">Seleccionar Origen</option>
                <option *ngFor="let w of warehouses()" [value]="w.id" [disabled]="w.id === targetWarehouseId()">{{ w.name }}</option>
              </select>
            </div>
            
            <ng-icon name="heroArrowRightSolid" class="w-5 h-5 opacity-50"></ng-icon>
  
            <!-- Destino -->
            <div class="flex flex-col">
              <label class="text-[10px] uppercase font-bold opacity-70">Destino</label>
              <select [(ngModel)]="targetWarehouseId" class="p-1 rounded border text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                      style="background-color: var(--subtle-bg); border-color: var(--border-color); color: var(--app-text);">
                <option [ngValue]="null">Seleccionar Destino</option>
                <option *ngFor="let w of warehouses()" [value]="w.id" [disabled]="w.id === sourceWarehouseId()">{{ w.name }}</option>
              </select>
            </div>
          </div>
        </div>
  
        <!-- CONTENT -->
        <div class="flex-grow flex overflow-hidden">
          
          <!-- PRODUCT GRID (Left) -->
          <div class="flex-grow flex flex-col p-6 overflow-hidden">
            
            <div class="mb-4">
              <div class="relative">
                <input type="text" [(ngModel)]="searchQuery" placeholder="Buscar productos a transferir..."
                       class="w-full pl-10 pr-4 py-3 rounded-xl border shadow-sm outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                       style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--app-text);">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                  <ng-icon name="heroMagnifyingGlassSolid" class="w-5 h-5"></ng-icon>
                </div>
              </div>
            </div>
  
            <div class="flex-grow overflow-y-auto pr-2">
               <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                 <div *ngFor="let product of filteredProducts()" 
                      (click)="addToCart(product)"
                      class="rounded-xl shadow-sm p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95 flex flex-col gap-2 relative group border"
                      style="background-color: var(--card-bg); border-color: var(--border-color);">
                   
                   <div class="aspect-square rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden mb-2">
                      <img *ngIf="product.image_url" [src]="product.image_url" class="object-cover w-full h-full" alt="Prod">
                      <span *ngIf="!product.image_url" class="text-2xl font-bold opacity-30">{{ product.name.charAt(0) }}</span>
                   </div>
  
                   <h3 class="font-semibold text-sm line-clamp-2 leading-tight">{{ product.name }}</h3>
                   <div class="flex justify-between items-center text-xs mt-auto w-full">
                     <span class="opacity-70">{{ product.sku }}</span>
                     <span [ngClass]="{'text-red-500': (stockLevels().get(product.id) || 0) <= 0, 'text-green-600': (stockLevels().get(product.id) || 0) > 0}" class="font-bold">
                       Cant: {{ stockLevels().get(product.id) || 0 }}
                     </span>
                   </div>
                 </div>
               </div>
            </div>
          </div>
  
          <!-- MANIFEST (Right) -->
          <div class="w-96 flex flex-col shadow-xl z-20 border-l" style="background-color: var(--card-bg); border-color: var(--border-color);">
            
            <div class="p-4 border-b" style="border-color: var(--border-color);">
              <h2 class="font-bold text-lg flex items-center gap-2">
                <ng-icon name="heroClipboardDocumentCheckSolid" class="w-5 h-5"></ng-icon>
                Manifiesto de Carga
              </h2>
              <p class="text-xs opacity-60">Items a transferir</p>
            </div>
  
            <!-- Items List -->
            <div class="flex-grow overflow-y-auto p-4 flex flex-col gap-2">
              <div *ngIf="cart().length === 0" class="h-full flex flex-col items-center justify-center opacity-40">
                <ng-icon name="heroTruckSolid" class="w-12 h-12 mb-2"></ng-icon>
                <p>Sin items</p>
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
              <button (click)="transfer()" 
                      [disabled]="cart().length === 0 || !sourceWarehouseId() || !targetWarehouseId() || isProcessing()"
                      class="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2"
                      [ngClass]="{
                        'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-500/30': isValid(),
                        'bg-gray-400 cursor-not-allowed': !isValid()
                      }">
                <span *ngIf="!isProcessing()">Ejecutar Transferencia</span>
                <div *ngIf="isProcessing()" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </button>
              <p *ngIf="!isValid()" class="text-xs text-red-500 text-center mt-2">
                {{ getValidationError() }}
              </p>
            </div>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class StockTransferComponent implements OnInit {
  private inventoryRepo = inject(InventoryRepository);
  private productRepo = inject(ProductRepository);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private supabase = inject(SupabaseService);
  private session = inject(SessionService);

  warehouses = signal<ScmWarehouse[]>([]);
  products = signal<ScmProduct[]>([]);

  sourceWarehouseId = signal<string | null>(null);
  targetWarehouseId = signal<string | null>(null);
  searchQuery = signal('');
  cart = signal<{ product: ScmProduct, quantity: number }[]>([]);
  isProcessing = signal(false);

  stockLevels = signal<Map<string, number>>(new Map());

  filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.products().filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  });

  async ngOnInit() {
    try {
      const tenantId = this.session.currentTenantId();
      if (!tenantId) return;

      this.warehouses.set(await this.inventoryRepo.getWarehouses(tenantId));
      this.products.set(await this.productRepo.getAll(tenantId));
    } catch (error) {
      console.error(error);
      this.notification.error('Error cargando datos de transferencia');
    }
  }

  async onSourceChange() {
    const wId = this.sourceWarehouseId();
    if (!wId) {
      this.stockLevels.set(new Map());
      return;
    }

    try {
      this.isProcessing.set(true); // Reuse isProcessing or add isLoadingStock
      const { data, error } = await this.supabase.client
        .from('scm_stock_levels')
        .select('product_id, quantity_on_hand')
        .eq('warehouse_id', wId);

      if (error) throw error;

      const map = new Map<string, number>();
      if (data) {
        data.forEach((item: any) => {
          map.set(item.product_id, item.quantity_on_hand);
        });
      }
      this.stockLevels.set(map);
    } catch (e) {
      this.notification.error('Error cargando stock de origen');
    } finally {
      this.isProcessing.set(false);
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

  isValid() {
    return this.cart().length > 0 && this.sourceWarehouseId() && this.targetWarehouseId() && this.sourceWarehouseId() !== this.targetWarehouseId();
  }

  getValidationError() {
    if (!this.sourceWarehouseId()) return 'Seleccione Origen';
    if (!this.targetWarehouseId()) return 'Seleccione Destino';
    if (this.sourceWarehouseId() === this.targetWarehouseId()) return 'Origen y Destino deben ser distintos';
    if (this.cart().length === 0) return 'Carrito vacío';
    return '';
  }

  async transfer() {
    if (!this.isValid()) return;

    this.isProcessing.set(true);
    try {
      const sourceId = this.sourceWarehouseId()!;
      const targetId = this.targetWarehouseId()!;
      const date = new Date().toISOString().split('T')[0];

      const movements: any[] = [];
      const refNumber = `TRF-${Math.floor(Date.now() / 1000)}`;

      this.cart().forEach(item => {
        // OUT from Source
        movements.push({
          product_id: item.product.id,
          warehouse_id: sourceId,
          movement_date: date,
          quantity: -item.quantity, // Negative
          movement_type: 'TRANSFER_OUT',
          notes: `Transferencia a ${targetId}`,
          reference_number: refNumber,
          reference_type: 'transfer'
        });
        // IN to Target
        movements.push({
          product_id: item.product.id,
          warehouse_id: targetId,
          movement_date: date,
          quantity: item.quantity, // Positive
          movement_type: 'TRANSFER_IN',
          notes: `Transferencia de ${sourceId}`,
          reference_number: refNumber,
          reference_type: 'transfer'
        });
      });

      const { error } = await this.supabase.client
        .from('scm_stock_movements')
        .insert(movements);

      if (error) throw error;

      this.notification.success('Transferencia exitosa');
      this.cart.set([]);

    } catch (error: any) {
      console.error('Transfer error', error);
      this.notification.error('Error al transferir');
    } finally {
      this.isProcessing.set(false);
    }
  }
}
