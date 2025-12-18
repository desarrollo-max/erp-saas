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
    <div class="fixed inset-0 z-[100] overflow-y-auto p-4 sm:p-6 md:p-20" role="dialog" aria-modal="true">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-500 bg-opacity-25 transition-opacity" aria-hidden="true" (click)="close()"></div>

      <!-- Modal Panel -->
      <div class="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-2xl ring-1 ring-black ring-opacity-5 transition-all">
        <div class="relative">
          <ng-icon name="heroMagnifyingGlassSolid" class="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-400"></ng-icon>
          <input 
            #searchInput
            type="text" 
            [(ngModel)]="query" 
            (ngModelChange)="onSearch()"
            class="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-0 sm:text-sm" 
            placeholder="Buscar productos, almacenes, variantes..."
            role="combobox" 
            aria-expanded="false" 
            aria-controls="options"
            autofocus>
        </div>

        <!-- Results -->
        <ul *ngIf="results().length > 0" class="max-h-96 scroll-py-3 overflow-y-auto p-3" id="options" role="listbox">
          <li *ngFor="let result of results()" (click)="select(result)" class="group flex cursor-default select-none rounded-xl p-3 hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
            <div class="flex h-10 w-10 flex-none items-center justify-center rounded-lg"
                 [class.bg-indigo-500]="result.type === 'PRODUCT'"
                 [class.bg-purple-500]="result.type === 'VARIANT'"
                 [class.bg-blue-500]="result.type === 'WAREHOUSE'">
              <ng-icon [name]="getIcon(result.type)" class="h-6 w-6 text-white"></ng-icon>
            </div>
            <div class="ml-4 flex-auto">
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ result.title }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ result.subtitle }}</p>
            </div>
          </li>
        </ul>

        <!-- Empty State -->
        <div *ngIf="query() && results().length === 0 && !isLoading()" class="py-14 px-6 text-center text-sm sm:px-14">
          <ng-icon name="heroExclamationCircleSolid" class="mx-auto h-6 w-6 text-gray-400"></ng-icon>
          <p class="mt-4 font-semibold text-gray-900 dark:text-gray-100">No se encontraron resultados</p>
          <p class="mt-2 text-gray-500">No pudimos encontrar nada con ese término. Intenta de nuevo.</p>
        </div>

        <div *ngIf="isLoading()" class="py-14 px-6 text-center text-sm sm:px-14">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-4 text-gray-500">Buscando...</p>
        </div>

        <!-- Footer Help -->
        <div class="flex flex-wrap items-center bg-gray-50 dark:bg-slate-900 py-2.5 px-4 text-xs text-gray-700 dark:text-gray-400">
           Type <kbd (click)="close()" class="mx-1 flex h-5 w-5 items-center justify-center rounded border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold text-gray-900 dark:text-gray-100 sm:mx-2 cursor-pointer">ESC</kbd> to close.
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
