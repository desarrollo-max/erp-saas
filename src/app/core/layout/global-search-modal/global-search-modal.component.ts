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
    templateUrl: './global-search-modal.component.html'
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
