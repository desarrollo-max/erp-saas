import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockTransferComponent } from './stock-transfer.component';
import { InventoryRepository } from '@core/repositories/inventory.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { SessionService } from '@core/services/session.service';
import { SupabaseService } from '@core/services/supabase.service';
import { NotificationService } from '@core/services/notification.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

describe('StockTransferComponent', () => {
    let component: StockTransferComponent;
    let fixture: ComponentFixture<StockTransferComponent>;

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
            imports: [StockTransferComponent],
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

        fixture = TestBed.createComponent(StockTransferComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should require different source and target', () => {
        component.sourceWarehouseId.set('w1');
        component.targetWarehouseId.set('w1');
        expect(component.isValid()).toBeFalsy();
        expect(component.getValidationError()).toContain('Origen y Destino deben ser distintos');
    });

    it('should be valid with correct data', () => {
        component.sourceWarehouseId.set('w1');
        component.targetWarehouseId.set('w2');
        component.cart.set([{ product: { id: 'p1' } as any, quantity: 10 }]);
        expect(component.isValid()).toBeTruthy();
    });
});
