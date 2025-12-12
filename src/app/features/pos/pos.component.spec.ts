import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PosComponent } from './pos.component';
import { InventoryRepository } from '@core/repositories/inventory.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { SessionService } from '@core/services/session.service';
import { SupabaseService } from '@core/services/supabase.service';
import { NotificationService } from '@core/services/notification.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('PosComponent', () => {
    let component: PosComponent;
    let fixture: ComponentFixture<PosComponent>;

    // Mocks
    const inventoryRepoMock = {
        getWarehouses: jest.fn().mockResolvedValue([])
    };
    const productRepoMock = {
        getAll: jest.fn().mockResolvedValue([])
    };
    const sessionServiceMock = {
        currentTenantId: signal('test-tenant-id')
    };
    const supabaseServiceMock = {
        client: {
            from: () => ({
                insert: jest.fn().mockResolvedValue({ error: null })
            })
        }
    };
    const notificationServiceMock = {
        success: jest.fn(),
        error: jest.fn()
    };
    const routerMock = {
        navigate: jest.fn()
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PosComponent], // Standalone
            providers: [
                { provide: InventoryRepository, useValue: inventoryRepoMock },
                { provide: ProductRepository, useValue: productRepoMock },
                { provide: SessionService, useValue: sessionServiceMock },
                { provide: SupabaseService, useValue: supabaseServiceMock },
                { provide: NotificationService, useValue: notificationServiceMock },
                { provide: Router, useValue: routerMock }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(PosComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load initial data on init', async () => {
        expect(inventoryRepoMock.getWarehouses).toHaveBeenCalledWith('test-tenant-id');
        expect(productRepoMock.getAll).toHaveBeenCalledWith('test-tenant-id');
    });

    it('should add product to cart', () => {
        const product = { id: 'p1', name: 'Test Product', sku: 'SKU1' } as any;
        component.addToCart(product);
        expect(component.cart().length).toBe(1);
        expect(component.cart()[0].quantity).toBe(1);

        // Add same product
        component.addToCart(product);
        expect(component.cart().length).toBe(1);
        expect(component.cart()[0].quantity).toBe(2);
    });
});
