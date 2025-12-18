import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { APP_ICONS } from '@core/constants/app-icons';
import { SupabaseStockRepository } from '@core/repositories/implementations/supabase-stock.repository';
import { SupabaseUserRepository } from '@core/repositories/implementations/supabase-user.repository';
import { WarehouseRepository } from '@core/repositories/warehouse.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { SessionService } from '@core/services/session.service';
import { ScmStockMovement } from '@core/models/erp.types';
import { FormsModule } from '@angular/forms';

// Extended Interface for UI
interface ExtendedStockMovement extends ScmStockMovement {
  warehouseName?: string;
  variantName?: string; // e.g. "Bota Vaquera - 27.5"
  productName?: string;
  userName?: string;
}

@Component({
  selector: 'app-stock-movement-history',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconsModule, FormsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="h-full flex flex-col bg-gray-50 dark:bg-slate-900">
      
      <!-- HEADER -->
      <div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
           <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
             <ng-icon [name]="ICONS.inventory" class="text-indigo-500"></ng-icon>
             Historial de Movimientos
           </h1>
           <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
             Registro completo de auditoría y trazabilidad.
           </p>
        </div>
        
        <div class="flex gap-3">
           <a [routerLink]="['/inventory/movements/new']" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2">
             <ng-icon name="heroPlusSolid" class="h-5 w-5"></ng-icon>
             Nuevo Movimiento
           </a>
        </div>
      </div>

      <!-- FILTERS BAR -->
      <div class="bg-gray-50 dark:bg-slate-900 px-6 py-4 flex flex-wrap gap-4 border-b border-gray-200 dark:border-slate-700">
         <div class="flex-1 min-w-[200px]">
             <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Movimiento</label>
             <select [(ngModel)]="filterType" class="block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-gray-200">
                 <option value="ALL">Todos</option>
                 <option *ngFor="let type of uniqueTypes()" [value]="type">{{ type }}</option>
             </select>
         </div>
         <div class="flex-1 min-w-[200px]">
             <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Almacén</label>
             <select [(ngModel)]="filterWarehouse" class="block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-gray-200">
                 <option value="ALL">Todos</option>
                 <option *ngFor="let wh of uniqueWarehouses()" [value]="wh">{{ wh }}</option>
             </select>
         </div>
         <div class="flex-1 min-w-[200px]">
             <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Producto / Variante</label>
             <select [(ngModel)]="filterVariant" class="block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-gray-200">
                 <option value="ALL">Todos</option>
                 <option *ngFor="let v of uniqueVariants()" [value]="v">{{ v }}</option>
             </select>
         </div>
         <div class="flex-1 min-w-[200px]">
             <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio</label>
             <input type="date" [(ngModel)]="filterStartDate" class="block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-gray-200">
         </div>
         <div class="flex-1 min-w-[200px]">
             <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Fin</label>
             <input type="date" [(ngModel)]="filterEndDate" class="block w-full rounded-md border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:text-gray-200">
         </div>
         <div class="flex-none self-end">
            <button (click)="resetFilters()" class="text-sm text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 font-medium px-3 py-2">
                Limpiar Filtros
            </button>
         </div>
      </div>

      <!-- TABLE CONTAINER -->
      <div class="flex-1 overflow-auto p-6">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow ring-1 ring-black ring-opacity-5 overflow-hidden">
          
          <div *ngIf="isLoading()" class="p-12 flex justify-center">
             <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>

          <table *ngIf="!isLoading()" class="min-w-full divide-y divide-gray-300 dark:divide-slate-700">
            <thead class="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-200 sm:pl-6">Fecha / Usuario</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Tipo</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Producto / Talla</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Almacén</th>
                <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-gray-200">Cantidad</th>
                <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-200">Detalles</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
              <tr *ngFor="let m of filteredMovements()" class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                
                <!-- DATE & USER -->
                <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 dark:text-gray-200 sm:pl-6">
                   <div class="font-medium">{{ m.movement_date | date:'mediumDate' }}</div>
                   <div class="text-xs text-gray-500">{{ m.movement_date | date:'shortTime' }}</div>
                   <div class="text-xs text-indigo-500 mt-1 font-medium">{{ m.userName || 'Sistema' }}</div>
                </td>

                <!-- TYPE -->
                <td class="whitespace-nowrap px-3 py-4 text-sm">
                   <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset"
                         [class.bg-green-50]="isPositive(m)" [class.text-green-700]="isPositive(m)" [class.ring-green-600/20]="isPositive(m)"
                         [class.bg-red-50]="!isPositive(m)" [class.text-red-700]="!isPositive(m)" [class.ring-red-600/20]="!isPositive(m)">
                     {{ m.movement_type }}
                   </span>
                </td>

                <!-- PRODUCT -->
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                   <div class="font-bold text-gray-900 dark:text-gray-100">{{ m.productName || 'Producto Desconocido' }}</div>
                   <div class="text-xs">{{ m.variantName || m.variant_id }}</div>
                </td>

                <!-- WAREHOUSE -->
                <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-700 dark:text-gray-300">
                   {{ m.warehouseName || m.warehouse_id }}
                </td>

                <!-- QUANTITY -->
                <td class="whitespace-nowrap px-3 py-4 text-sm text-right font-bold"
                    [class.text-green-600]="m.movement_type === 'IN'"
                    [class.text-red-600]="m.movement_type === 'OUT'">
                   {{ m.movement_type === 'OUT' ? '-' : '+' }}{{ m.quantity }}
                </td>

                <!-- NOTES -->
                <td class="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                   {{ m.notes || '—' }}
                   <div *ngIf="m.reference_type" class="text-xs text-gray-400 mt-1">Ref: {{m.reference_type}}</div>
                </td>
              </tr>
              
              <!-- EMPTY STATE -->
              <tr *ngIf="filteredMovements().length === 0 && !isLoading()">
                <td colspan="6" class="py-12 text-center">
                   <ng-icon [name]="ICONS.inventory" class="h-12 w-12 text-gray-300 mx-auto mb-3"></ng-icon>
                   <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">No se encontraron movimientos</h3>
                   <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Intenta cambiar los filtros de búsqueda.</p>
                </td>
              </tr>
            </tbody>
          </table>
          
        </div>
      </div>
    </div>
  `
})
export class StockMovementHistoryComponent implements OnInit {
  private stockRepo = inject(SupabaseStockRepository);
  private userRepo = inject(SupabaseUserRepository);
  private warehouseRepo = inject(WarehouseRepository);
  private productRepo = inject(ProductRepository);
  private session = inject(SessionService);

  public readonly ICONS = APP_ICONS;

  // Data State
  movements = signal<ExtendedStockMovement[]>([]);
  isLoading = signal(true);

  // Filter State
  filterType = signal<string>('ALL');
  filterWarehouse = signal<string>('ALL');
  filterVariant = signal<string>('ALL');
  filterStartDate = signal<string>('');
  filterEndDate = signal<string>('');

  // Computed Filters (Unique values from data)
  uniqueTypes = computed(() => {
    const types = new Set(this.movements().map(m => m.movement_type));
    return Array.from(types).sort();
  });

  uniqueWarehouses = computed(() => {
    const whs = new Set(this.movements().map(m => m.warehouseName).filter(n => !!n) as string[]);
    return Array.from(whs).sort();
  });

  uniqueVariants = computed(() => {
    const variants = new Set(this.movements().map(m =>
      m.productName && m.variantName ? `${m.productName} - ${m.variantName}` : ''
    ).filter(n => !!n));
    return Array.from(variants).sort();
  });

  // Main Logic
  filteredMovements = computed(() => {
    let filtered = this.movements();
    const type = this.filterType();
    const warehouse = this.filterWarehouse();
    const variant = this.filterVariant();
    const startDate = this.filterStartDate();
    const endDate = this.filterEndDate();

    if (type !== 'ALL') {
      filtered = filtered.filter(m => m.movement_type === type);
    }
    if (warehouse !== 'ALL') {
      filtered = filtered.filter(m => m.warehouseName === warehouse);
    }
    if (variant !== 'ALL') {
      // Complex check: reconstruct the label to compare
      filtered = filtered.filter(m =>
        (`${m.productName} - ${m.variantName}`) === variant
      );
    }
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(m => new Date(m.movement_date) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(m => new Date(m.movement_date) <= end);
    }

    return filtered;
  });

  async ngOnInit() {
    this.isLoading.set(true);
    try {
      const rawMovements = await this.stockRepo.getMovementHistory();
      if (!rawMovements.length) {
        this.movements.set([]);
        return;
      }

      const tenantId = this.session.currentTenantId();
      if (!tenantId) return;

      // 1. Bulk Load Warehouses
      const warehouses = await this.warehouseRepo.getAll(tenantId);
      const whMap = new Map(warehouses.map(w => [w.id, w.name]));

      // 2. Load Products and Variants
      const [products, variants] = await Promise.all([
        this.productRepo.getAll(tenantId),
        this.productRepo.getAllVariants(tenantId)
      ]);

      const productMap = new Map(products.map(p => [p.id, p]));
      const variantMap = new Map(variants.map(v => [v.id, v]));

      // 3. Resolve User Names
      const userCache = new Map<string, string>();

      const extended: ExtendedStockMovement[] = [];

      for (const m of rawMovements) {
        const whName = whMap.get(m.warehouse_id) || 'Almacén Desconocido';
        let userName = userCache.get(m.created_by);

        if (!userName) {
          userName = await this.userRepo.getUserDisplayName(m.created_by);
          userCache.set(m.created_by, userName);
        }

        let prodName = 'Producto Desconocido';
        let varLabel = m.variant_id ? `ID: ${m.variant_id}` : 'N/A';

        const variant = variantMap.get(m.variant_id);
        if (variant) {
          const product = productMap.get(variant.product_id);
          if (product) prodName = product.name;
          varLabel = variant.attribute_value ? `${variant.attribute_name}: ${variant.attribute_value}` : (variant.sku || 'Variante');
        } else if (m.product_id) {
          const product = productMap.get(m.product_id);
          if (product) prodName = product.name;
        }

        extended.push({
          ...m,
          warehouseName: whName,
          userName,
          productName: prodName,
          variantName: varLabel
        });
      }

      this.movements.set(extended);

    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading.set(false);
    }
  }

  resetFilters() {
    this.filterType.set('ALL');
    this.filterWarehouse.set('ALL');
    this.filterVariant.set('ALL');
    this.filterStartDate.set('');
    this.filterEndDate.set('');
  }

  isPositive(m: ScmStockMovement): boolean {
    return m.movement_type === 'IN' ||
      m.movement_type === 'PRODUCTION_OUTPUT' ||
      (m.movement_type === 'ADJUSTMENT' && m.quantity >= 0);
  }
}
