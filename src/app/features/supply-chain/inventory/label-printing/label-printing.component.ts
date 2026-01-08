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
    templateUrl: './label-printing.component.html',
    styleUrls: ['./label-printing.component.scss']
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
