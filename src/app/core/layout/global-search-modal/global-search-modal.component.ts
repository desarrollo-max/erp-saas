import { Component, inject, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { APP_ICONS } from '@core/constants/app-icons';
import { ProductRepository } from '@core/repositories/product.repository';
import { WarehouseRepository } from '@core/repositories/warehouse.repository';
import { SessionService } from '@core/services/session.service';
import { Router } from '@angular/router';

interface SearchResult {
    type: 'PRODUCT' | 'VARIANT' | 'WAREHOUSE';
    id: string;
    title: string;
    subtitle: string;
    route: string;
}

@Component({
    selector: 'app-global-search-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, NgIconsModule],
    viewProviders: [provideIcons(heroIcons)],
    template: `
    <div class="fixed inset-0 z-[100] overflow-y-auto p-4 sm:p-6 md:p-20 animate-fade-in" role="dialog" aria-modal="true">
      <!-- Backdrop with heavy blur -->
      <div class="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-md transition-opacity" aria-hidden="true" (click)="close()"></div>

      <!-- Modal Panel: Glassmorphism -->
      <div class="mx-auto max-w-2xl transform overflow-hidden rounded-[2.5rem] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-2xl ring-1 ring-slate-200 dark:ring-slate-800 transition-all relative z-10 border border-white dark:border-slate-800">
        
        <!-- Search Input Header -->
        <div class="relative p-6 border-b border-slate-100 dark:border-slate-800">
          <ng-icon name="heroMagnifyingGlassSolid" class="pointer-events-none absolute top-10 left-10 h-6 w-6 text-indigo-500"></ng-icon>
          <input 
            #searchInput
            type="text" 
            [(ngModel)]="query" 
            (ngModelChange)="onSearch()"
            class="h-14 w-full border-2 border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 pl-14 pr-6 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-bold text-lg" 
            placeholder="Buscar inteligencia de negocio..."
            role="combobox" 
            aria-expanded="false" 
            autofocus>
          
          <div class="absolute right-10 top-10 flex gap-1 items-center pointer-events-none">
             <span class="px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md text-[9px] font-black text-slate-500 uppercase tracking-tighter">CMD</span>
             <span class="px-2 py-1 bg-slate-200 dark:bg-slate-800 rounded-md text-[9px] font-black text-slate-500 uppercase tracking-tighter">K</span>
          </div>
        </div>

        <!-- Results -->
        <div class="overflow-y-auto max-h-[60vh] custom-scrollbar">
            <ul *ngIf="results().length > 0" class="p-6 space-y-3" id="options" role="listbox">
              <li *ngFor="let result of results()" (click)="select(result)" 
                  class="group flex items-center select-none rounded-[1.5rem] p-4 hover:bg-slate-100 dark:hover:bg-indigo-500/10 cursor-pointer transition-all border border-transparent hover:border-indigo-500/20 active:scale-[0.98]">
                
                <div class="flex h-14 w-14 flex-none items-center justify-center rounded-2xl shadow-lg group-hover:scale-110 transition-transform"
                     [class.bg-indigo-600]="result.type === 'PRODUCT'"
                     [class.bg-purple-600]="result.type === 'VARIANT'"
                     [class.bg-blue-600]="result.type === 'WAREHOUSE'">
                  <ng-icon [name]="getIcon(result.type)" class="h-7 w-7 text-white"></ng-icon>
                </div>
                
                <div class="ml-5 flex-auto">
                  <div class="flex items-center justify-between gap-4">
                    <p class="text-base font-black text-slate-900 dark:text-white uppercase italic tracking-tight">{{ result.title }}</p>
                    <span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400 group-hover:text-indigo-400 transition-colors">
                        {{ result.type }}
                    </span>
                  </div>
                  <p class="text-xs font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-tighter">{{ result.subtitle }}</p>
                </div>
                
                <div class="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                   <ng-icon name="heroArrowRightSolid" class="w-5 h-5 text-indigo-500"></ng-icon>
                </div>
              </li>
            </ul>

            <!-- Empty State -->
            <div *ngIf="query() && results().length === 0 && !isLoading()" class="py-20 px-10 text-center">
              <div class="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-700">
                <ng-icon name="heroFaceFrownSolid" class="h-10 w-10"></ng-icon>
              </div>
              <p class="text-xl font-black text-slate-900 dark:text-white uppercase italic">Sin coincidencias</p>
              <p class="mt-2 text-xs font-black uppercase tracking-widest text-slate-400">Prueba con términos técnicos o códigos SKU</p>
            </div>

            <!-- Loading -->
            <div *ngIf="isLoading()" class="py-20 text-center">
                <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Indexando Datos...</p>
            </div>
        </div>

        <!-- Footer Help -->
        <div class="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 py-4 px-8 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/50">
           <div class="flex items-center gap-6">
              <span class="flex items-center gap-2"><kbd class="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-700">ESC</kbd> Cerrar</span>
              <span class="flex items-center gap-2"><kbd class="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-700">↵</kbd> Seleccionar</span>
           </div>
           <div class="hidden sm:block italic opacity-50">SIAC Global Search v2.0</div>
        </div>
      </div>
    </div>
  `
})
export class GlobalSearchModalComponent {
    @Output() closed = new EventEmitter<void>();

    query = signal('');
    results = signal<SearchResult[]>([]);
    isLoading = signal(false);

    private productRepo = inject(ProductRepository);
    private warehouseRepo = inject(WarehouseRepository);
    private session = inject(SessionService);
    private router = inject(Router);

    close() {
        this.closed.emit();
    }

    async onSearch() {
        const q = this.query().toLowerCase();
        if (q.length < 2) {
            this.results.set([]);
            return;
        }

        this.isLoading.set(true);
        try {
            const tenantId = this.session.currentTenantId();
            if (!tenantId) return;

            const [products, variants, warehouses] = await Promise.all([
                this.productRepo.getAll(tenantId),
                this.productRepo.getAllVariants(tenantId),
                this.warehouseRepo.getAll(tenantId)
            ]);

            const hits: SearchResult[] = [];

            // Filter Products
            products.forEach(p => {
                if (p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)) {
                    hits.push({
                        type: 'PRODUCT',
                        id: p.id,
                        title: p.name,
                        subtitle: `SKU: ${p.sku}`,
                        route: `/inventory/edit/${p.id}`
                    });
                }
            });

            // Filter Variants
            variants.forEach(v => {
                if (v.sku?.toLowerCase().includes(q) || v.attribute_value?.toLowerCase().includes(q)) {
                    // Find parent name if possible, for now just show SKU/Attr
                    hits.push({
                        type: 'VARIANT',
                        id: v.id,
                        title: v.sku,
                        subtitle: `Variante: ${v.attribute_value}`,
                        route: `/inventory/edit/${v.product_id}` // Go to parent product
                    });
                }
            });

            // Filter Warehouses
            warehouses.forEach(w => {
                if (w.name.toLowerCase().includes(q) || w.code.toLowerCase().includes(q)) {
                    hits.push({
                        type: 'WAREHOUSE',
                        id: w.id,
                        title: w.name,
                        subtitle: `Código: ${w.code}`,
                        route: `/cadena-suministro/almacenes/edit/${w.id}`
                    });
                }
            });

            this.results.set(hits.slice(0, 10)); // Limit to 10
        } finally {
            this.isLoading.set(false);
        }
    }

    getIcon(type: string): string {
        switch (type) {
            case 'PRODUCT': return 'heroTagSolid';
            case 'VARIANT': return 'heroSwatchSolid';
            case 'WAREHOUSE': return 'heroHomeModernSolid';
            default: return 'heroMagnifyingGlassSolid';
        }
    }

    select(result: SearchResult) {
        this.router.navigate([result.route]);
        this.close();
    }
}
