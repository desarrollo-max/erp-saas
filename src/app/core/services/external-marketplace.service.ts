import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface ExternalProduct {
    id: number;
    title: string;
    vendor: string;
    product_type: string;
    price: string;
    image_url: string;
    description: string;
}

@Injectable({
    providedIn: 'root'
})
export class ExternalMarketplaceService {
    private http = inject(HttpClient);

    // Cache para evitar recargas constantes
    private products = signal<ExternalProduct[]>([]);
    public isLoading = signal<boolean>(false);

    async searchProducts(term: string): Promise<ExternalProduct[]> {
        if (this.products().length === 0) {
            await this.loadAll();
        }

        const t = term.toLowerCase();
        return this.products().filter(p =>
            p.title.toLowerCase().includes(t) ||
            p.vendor.toLowerCase().includes(t) ||
            p.product_type.toLowerCase().includes(t)
        );
    }

    private async loadAll() {
        this.isLoading.set(true);
        try {
            // Cargamos el JSON de ejemplo (simulando API externa)
            const response: any = await firstValueFrom(this.http.get('/agave_products.json'));

            if (response && response.products) {
                const mapped: ExternalProduct[] = response.products.map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    vendor: p.vendor,
                    product_type: p.product_type,
                    price: p.variants?.[0]?.price || '0.00',
                    image_url: p.images?.[0]?.src || '',
                    description: p.body_html?.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...'
                }));
                this.products.set(mapped);
            }
        } catch (error) {
            console.error('Error loading external products:', error);
        } finally {
            this.isLoading.set(false);
        }
    }
}
