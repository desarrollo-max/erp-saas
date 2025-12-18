import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LabelPrintingComponent } from './label-printing.component';
import { ProductRepository } from '@core/repositories/product.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs'; // For mocking if needed, though productRepo uses Promises in the interface I saw
import { NgIconsModule } from '@ng-icons/core';
import { heroPrinterSolid } from '@ng-icons/heroicons/solid';

// Mock Classes
class MockProductRepository {
    getAll(tenantId: string) {
        return Promise.resolve([
            { id: '1', name: 'Product 1', sku: 'SKU1', sale_price: 100, variants: [] }
        ]);
    }
    getVariantsByProductId(id: string) {
        if (id === '1') {
            return Promise.resolve([
                { id: 'v1', attribute_name: 'Size', attribute_value: 'M', sku: 'SKU1-M' }
            ]);
        }
        return Promise.resolve([]);
    }
}

class MockSessionService {
    currentTenantId() {
        return 'tenant-1';
    }
}

class MockNotificationService {
    success(msg: string) { }
    error(msg: string) { }
}

describe('LabelPrintingComponent', () => {
    let component: LabelPrintingComponent;
    let fixture: ComponentFixture<LabelPrintingComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                LabelPrintingComponent,
                NgIconsModule.withIcons({ heroPrinterSolid })
            ],
            providers: [
                { provide: ProductRepository, useClass: MockProductRepository },
                { provide: SessionService, useClass: MockSessionService },
                { provide: NotificationService, useClass: MockNotificationService },
                { provide: ActivatedRoute, useValue: { params: of({}) } }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(LabelPrintingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load products on init', async () => {
        await component.loadProducts();
        expect(component.products().length).toBe(1);
        expect(component.products()[0].name).toBe('Product 1');
    });

    it('should load variants when product is selected', async () => {
        // Manually trigger value change logic or call method directly
        const prod = component.products()[0];
        component.form.controls.product.setValue(prod);

        // Wait for async operations if any (the subscription calls loadVariants)
        // Since it is async, we might need to wait. 
        // Current impl: control.valueChanges.subscribe(async...)

        // Simulate waiting
        await fixture.whenStable();

        expect(component.availableVariants().length).toBe(1);
        expect(component.availableVariants()[0].attribute_value).toBe('M');
    });

    it('should add item to queue', async () => {
        const prod = component.products()[0];
        component.form.controls.product.setValue(prod);
        await fixture.whenStable();

        // Select variant
        const variant = component.availableVariants()[0];
        component.form.controls.variant.setValue(variant);
        component.form.controls.quantity.setValue(5);

        await component.addToQueue();

        expect(component.labelQueue().length).toBe(1);
        expect(component.labelQueue()[0].quantity).toBe(5);
        expect(component.labelQueue()[0].qrCodeDataUrl).toBeDefined();
    });

    it('should remove item from queue', () => {
        component.labelQueue.set([{
            product: { id: '1', name: 'P1', sku: 'S1' } as any,
            variant: null,
            quantity: 1,
            includePrice: true
        }]);

        component.removeItem(0);
        expect(component.labelQueue().length).toBe(0);
    });
});
