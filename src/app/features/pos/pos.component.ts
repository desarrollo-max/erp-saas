import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIconsModule } from '@ng-icons/core';
import { NotificationService } from '@core/services/notification.service';
import { WarehouseRepository } from '@core/repositories/warehouse.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { SupabaseStockRepository } from '@core/repositories/implementations/supabase-stock.repository';
import { SupabaseService } from '@core/services/supabase.service';
import { SessionService } from '@core/services/session.service';
import { ThemeService } from '@core/services/theme.service';
import { ScmWarehouse, ScmProduct } from '@core/models/erp.types';

@Component({
  selector: 'app-pos',
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
            <ng-icon name="heroCurrencyDollarSolid" class="text-primary-500 w-6 h-6"></ng-icon>
            PdV
          </h1>
        </div>
        
        <div class="flex items-center gap-4">
          <label class="text-sm font-medium opacity-70">Almacén de Salida:</label>
          <select [(ngModel)]="selectedWarehouseId" (change)="onWarehouseChange()"
                  class="p-2 rounded-md border text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-colors"
                  style="background-color: var(--subtle-bg); border-color: var(--border-color); color: var(--app-text);">
            <option [ngValue]="null">Seleccionar Almacén</option>
            <option *ngFor="let w of warehouses()" [value]="w.id">{{ w.name }}</option>
          </select>
          
          <!-- Theme Selector -->
          <button (click)="cycleThemeColor()" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 transition">
            <div class="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center">
              <div class="w-3 h-3 rounded-full" [style.background-color]="themeService.getCurrentPrimaryColor()"></div>
            </div>
          </button>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="flex-grow flex overflow-hidden">
        
        <!-- PRODUCT GRID (Left) -->
        <div class="flex-grow flex flex-col p-6 overflow-hidden">
          
          <!-- Search Bar -->
          <div class="mb-4">
            <div class="relative">
              <input type="text" [(ngModel)]="searchQuery" placeholder="Buscar productos..."
                     class="w-full pl-10 pr-4 py-3 rounded-xl border shadow-sm outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                     style="background-color: var(--card-bg); border-color: var(--border-color); color: var(--app-text);">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-50">
                <ng-icon name="heroMagnifyingGlassSolid" class="w-5 h-5"></ng-icon>
              </div>
            </div>
          </div>

           <!-- Grid -->
           <div class="flex-grow overflow-y-auto pr-2">
             <!-- No Warehouse Selected State -->
             <div *ngIf="!selectedWarehouseId()" class="h-full flex flex-col items-center justify-center opacity-70">
                <ng-icon name="heroBuildingStorefrontSolid" class="w-16 h-16 mb-4 text-orange-500"></ng-icon>
                <h3 class="text-xl font-bold mb-2">Seleccione un Almacén</h3>
                <p class="text-sm">Para comenzar a vender, elija un almacén de salida arriba.</p>
             </div>

             <!-- No Products Found State (Only if Warehouse Selected) -->
             <div *ngIf="selectedWarehouseId() && filteredProducts().length === 0" class="h-full flex flex-col items-center justify-center opacity-50">
                <ng-icon name="heroArchiveBoxXMarkSolid" class="w-16 h-16 mb-2"></ng-icon>
                <p>No hay productos con existencia en este almacén</p>
             </div>

             <!-- Product Grid -->
             <div *ngIf="selectedWarehouseId()" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
               <div *ngFor="let item of filteredProducts()" 
                    (click)="addToCart(item)"
                    class="rounded-xl shadow-sm p-4 cursor-pointer transition-all hover:shadow-md hover:scale-105 active:scale-95 flex flex-col gap-2 relative group border"
                    style="background-color: var(--card-bg); border-color: var(--border-color);">
                 
                 <!-- Image Placeholder -->
                 <div class="aspect-square rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden mb-2">
                    <img *ngIf="item.image_url" [src]="item.image_url" class="object-cover w-full h-full" alt="Prod">
                    <span *ngIf="!item.image_url" class="text-2xl font-bold opacity-30">{{ item.name.charAt(0) }}</span>
                 </div>

                 <h3 class="font-semibold text-sm line-clamp-2 leading-tight">{{ item.name }}</h3>
                  <div class="mt-auto flex justify-between items-end w-full">
                    <div class="flex flex-col">
                      <p class="font-bold text-orange-600 dark:text-orange-400">
                        {{ item.price | currency }}
                      </p>
                      <span class="text-[10px] opacity-60">{{ item.sku }}</span>
                    </div>
                    <div class="flex flex-col items-end">
                        <div class="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
                            Stock: {{ stockLevels().get(item.id) || 0 }}
                        </div>
                        <span class="text-[9px] opacity-50 mt-1 max-w-[80px] truncate">{{ selectedWarehouseName() }}</span>
                    </div>
                  </div>
               </div>
             </div>
          </div>
        </div>

        <!-- CART (Right) -->
        <div class="w-96 flex flex-col shadow-xl z-20 border-l" style="background-color: var(--card-bg); border-color: var(--border-color);">
          
          <div class="p-4 border-b" style="border-color: var(--border-color);">
            <h2 class="font-bold text-lg flex items-center gap-2">
              <ng-icon name="heroShoppingCartSolid" class="w-5 h-5"></ng-icon>
              Carrito de Venta
            </h2>
            <p class="text-xs opacity-60">{{ cart().length }} items</p>
          </div>

          <!-- Items List -->
          <div class="flex-grow overflow-y-auto p-4 flex flex-col gap-2">
            <div *ngIf="cart().length === 0" class="h-full flex flex-col items-center justify-center opacity-40">
              <ng-icon name="heroShoppingCartSolid" class="w-12 h-12 mb-2"></ng-icon>
              <p>El carrito está vacío</p>
            </div>

            <div *ngFor="let item of cart()" class="rounded-lg p-3 flex justify-between items-center group relative border" 
                 style="background-color: var(--subtle-bg); border-color: var(--border-color);">
              
              <div class="flex flex-col flex-grow min-w-0 pr-2">
                <span class="font-medium truncate">{{ item.variant.name }}</span>
                <span class="text-xs opacity-60">{{ item.variant.sku }}</span>
                <span class="text-xs font-bold text-orange-500">{{ item.variant.price | currency }} x {{ item.quantity }}</span>
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
            <div class="flex justify-between items-center mb-4 text-xl font-bold">
                <span>Total:</span>
                <span>{{ calculateTotal() | currency }}</span>
            </div>
            
            <button (click)="checkout()" 
                    [disabled]="cart().length === 0 || !selectedWarehouseId() || isProcessing()"
                    class="w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2"
                    [ngClass]="{
                      'bg-orange-600 hover:bg-orange-700 hover:shadow-orange-500/30': cart().length > 0 && selectedWarehouseId(),
                      'bg-gray-400 cursor-not-allowed': cart().length === 0 || !selectedWarehouseId()
                    }">
              <span *ngIf="!isProcessing()">Realizar Venta <span *ngIf="selectedWarehouseId()">(Salida)</span></span>
              <div *ngIf="isProcessing()" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </button>
            <p *ngIf="!selectedWarehouseId()" class="text-xs text-red-500 text-center mt-2">Seleccione un almacén para procesar</p>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: []
})
export class PosComponent implements OnInit {
  private warehouseRepo = inject(WarehouseRepository);
  private productRepo = inject(ProductRepository); // Still useful for base info if needed
  private stockRepo = inject(SupabaseStockRepository); // Use StockRepo for standardized calls
  private router = inject(Router);
  private notification = inject(NotificationService);
  private supabase = inject(SupabaseService);
  private session = inject(SessionService);
  public themeService = inject(ThemeService);

  warehouses = signal<ScmWarehouse[]>([]);
  products = signal<any[]>([]); // Using 'any' for now to mix product + variant info

  selectedWarehouseId = signal<string | null>(null);
  searchQuery = signal('');
  cart = signal<{ variant: any, quantity: number, price: number }[]>([]);
  isProcessing = signal(false);

  // Stock Map: VariantID -> Quantity
  stockLevels = signal<Map<string, number>>(new Map());

  filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const warehouseId = this.selectedWarehouseId();
    const stockMap = this.stockLevels();

    // STRICT: Do not show ANY products if no warehouse is selected
    if (!warehouseId) {
      return [];
    }

    let items = this.products();

    // 1. Filter by Stock (MUST be > 0)
    items = items.filter(p => (stockMap.get(p.id) || 0) > 0);

    // 2. Filter by Search Query
    if (q) {
      items = items.filter(p => {
        const nameMatch = (p.product_name || p.name || '').toLowerCase().includes(q);
        const skuMatch = (p.sku || '').toLowerCase().includes(q);
        return nameMatch || skuMatch;
      });
    }

    return items;
  });

  selectedWarehouseName = computed(() => {
    const id = this.selectedWarehouseId();
    if (!id) return '';
    const w = this.warehouses().find(wh => wh.id === id);
    return w ? w.name : '';
  });

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    try {
      const tenantId = this.session.currentTenantId();
      if (!tenantId) return;

      // 1. Load Warehouses
      const w = await this.warehouseRepo.getAll(tenantId);
      this.warehouses.set(w);

      // 2. Load "Sellable Items" (Variants joined with Products)
      // We need a custom query here because standard repositories might return pure products or pure variants
      // We want a flattened view: Variant Name (Product + Size) | SKU | Price

      const { data: variants, error } = await this.supabase.client
        .from('scm_product_variants')
        .select(`
            id,
            sku,
            attribute_value,
            price_adjustment,
            product:scm_products (
                id,
                name,
                image_url,
                sale_price,
                category_id
            )
        `)
        .eq('tenant_id', tenantId)
        .eq('company_id', this.session.currentCompanyId()) // Security Constraint: Strict Company Isolation
        .eq('is_active', true);

      if (error) throw error;

      // Transform for Grid
      const sellableItems = (variants || []).map((v: any) => ({
        id: v.id, // Variant ID
        product_id: v.product.id,
        name: `${v.product.name} - ${v.attribute_value}`,
        sku: v.sku,
        image_url: v.product.image_url,
        price: (v.product.sale_price || 0) + (v.price_adjustment || 0),
        category_id: v.product.category_id
      }));

      this.products.set(sellableItems);

    } catch (error) {
      console.error('Error loading POS data', error);
      this.notification.error('Error cargando datos del POS');
    }
  }

  async onWarehouseChange() {
    if (!this.selectedWarehouseId()) {
      this.stockLevels.set(new Map());
      return;
    }

    try {
      this.isProcessing.set(true);

      // Fetch stock levels for ALL variants in this warehouse
      const levels = await this.stockRepo.getAllStockByWarehouse(this.selectedWarehouseId()!);

      const map = new Map<string, number>();
      levels.forEach(l => {
        if (l.variant_id) map.set(l.variant_id, l.quantity_on_hand);
      });

      this.stockLevels.set(map);

    } catch (error) {
      console.error('Error loading stock', error);
      this.notification.error('Error cargando existencias');
    } finally {
      this.isProcessing.set(false);
    }
  }

  addToCart(item: any) {
    // Check stock if warehouse selected
    if (this.selectedWarehouseId()) {
      const stock = this.stockLevels().get(item.id) || 0;
      if (stock <= 0) {
        this.notification.warning('Advertencia: Producto sin stock en almacén seleccionado.');
      }
    }

    this.cart.update(current => {
      const existing = current.find(i => i.variant.id === item.id);
      if (existing) {
        return current.map(i => i.variant.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...current, { variant: item, quantity: 1, price: item.price }];
    });
  }

  updateQuantity(item: any, change: number) {
    this.cart.update(current => {
      return current.map(i => {
        if (i.variant.id === item.variant.id) {
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
    if (!this.selectedWarehouseId()) {
      this.notification.error('Seleccione un almacén de salida');
      return;
    }

    if (this.cart().length === 0) return;

    this.isProcessing.set(true);
    try {
      const warehouseId = this.selectedWarehouseId()!;
      const currentCart = [...this.cart()]; // Snapshot for receipt

      // Create movements
      for (const item of currentCart) {
        // IMPORTANT: The repository handles subtraction for 'OUT' type.
        // We must pass POSITIVE quantity.
        await this.stockRepo.createStockMovement({
          tenant_id: this.session.currentTenantId()!, // Ensure tenant context
          warehouse_id: warehouseId,
          variant_id: item.variant.id,
          // Removed product_id passed explicitly to avoid ambiguous column errors.
          // The DB uses variant_id as the primary link now.
          quantity: Math.abs(item.quantity), // Positive value
          movement_type: 'OUT',
          notes: 'Venta POS Ref: ' + new Date().toLocaleTimeString(),
          reference_type: 'pos_sale',
          movement_date: new Date().toISOString()
        });
      }

      this.printTicket(currentCart, this.calculateTotal());

      this.notification.success('Venta registrada con éxito');
      this.cart.set([]);

      // Refresh stock
      this.awaitingRefresh = true; // Flag for UI or wait
      await this.onWarehouseChange();

    } catch (error: any) {
      console.error('Checkout error', error);
      this.notification.error(`Error en venta: ${error.message}`);
    } finally {
      this.isProcessing.set(false);
      this.awaitingRefresh = false;
    }
  }

  private awaitingRefresh = false;

  printTicket(items: any[], total: number) {
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;

    const date = new Date().toLocaleString();
    const warehouseName = this.selectedWarehouseName();

    // Generate HTML for receipt
    const html = `
      <html>
      <head>
        <title>Ticket de Venta</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .line { border-bottom: 1px dashed #000; margin: 10px 0; }
          .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .total { font-weight: bold; font-size: 14px; text-align: right; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="margin-bottom: 10px;">
            <span style="font-size: 24px; font-weight: 900; letter-spacing: -1px;">SIAC</span>
            <span style="font-size: 14px; letter-spacing: 2px; color: #666;">ERP</span>
          </div>
          <p>Ticket de Venta</p>
          <p>${date}</p>
          <p>Almacén: ${warehouseName}</p>
        </div>
        <div class="line"></div>
        ${items.map(item => `
          <div class="item">
            <span>${item.quantity} x ${item.variant.name.substring(0, 20)}</span>
            <span>$${(item.quantity * item.price).toFixed(2)}</span>
          </div>
        `).join('')}
        <div class="line"></div>
        <div class="total">TOTAL: $${total.toFixed(2)}</div>
        <div class="footer">
          <p>¡Gracias por su compra!</p>
        </div>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }

  calculateTotal(): number {
    return this.cart().reduce((acc, item) => acc + (item.quantity * item.price), 0);
  }

  cycleThemeColor(): void {
    this.themeService.cycleColorTheme();
  }
}
