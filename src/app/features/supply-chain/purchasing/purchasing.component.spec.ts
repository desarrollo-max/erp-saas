import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PurchasingComponent } from './purchasing.component';
import { InventoryRepository } from '@core/repositories/inventory.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { SessionService } from '@core/services/session.service';
import { SupabaseService } from '@core/services/supabase.service';
import { NotificationService } from '@core/services/notification.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

describe('PurchasingComponent', () => {
    let component: PurchasingComponent;
    let fixture: ComponentFixture<PurchasingComponent>;

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
            imports: [PurchasingComponent],
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

        fixture = TestBed.createComponent(PurchasingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load data', async () => {
        expect(inventoryRepoMock.getWarehouses).toHaveBeenCalled();
        expect(productRepoMock.getAll).toHaveBeenCalled();
    });

    it('should calculate cart correctly', () => {
        const p1 = { id: '1', name: 'P1', sku: 'S1' } as any;
        component.addToCart(p1);
        expect(component.cart().length).toBe(1);
    });
});
