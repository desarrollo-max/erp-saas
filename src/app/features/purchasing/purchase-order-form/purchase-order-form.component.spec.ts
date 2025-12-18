import 'zone.js';
import 'zone.js/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { PurchaseOrderFormComponent } from './purchase-order-form.component';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SessionService } from '@core/services/session.service';
import { PurchaseOrderRepository } from '@core/repositories/purchase-order.repository';
import { SupplierRepository } from '@core/repositories/supplier.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { WarehouseRepository } from '@core/repositories/warehouse.repository';
import { of } from 'rxjs';

// Mock Services
class MockSessionService {
    currentTenantId = () => 'tenant-123';
    currentCompanyId = () => 'company-123';
    user = () => ({ id: 'user-123' });
}

class MockPurchaseOrderRepository {
    create = jasmine.createSpy('create').and.returnValue(Promise.resolve({ id: 'po-123' }));
    update = jasmine.createSpy('update').and.returnValue(Promise.resolve({ id: 'po-123' }));
    addLine = jasmine.createSpy('addLine').and.returnValue(Promise.resolve({ id: 'line-123' }));
    getById = jasmine.createSpy('getById').and.returnValue(Promise.resolve(null));
    getLines = jasmine.createSpy('getLines').and.returnValue(Promise.resolve([]));
}

class MockSupplierRepository {
    getAll = jasmine.createSpy('getAll').and.returnValue(Promise.resolve([]));
}

class MockProductRepository {
    getLightweightList = jasmine.createSpy('getLightweightList').and.returnValue(Promise.resolve([]));
    getAllVariants = jasmine.createSpy('getAllVariants').and.returnValue(Promise.resolve([]));
    syncMissingVariants = jasmine.createSpy('syncMissingVariants').and.returnValue(Promise.resolve());
}

class MockWarehouseRepository {
    getAll = jasmine.createSpy('getAll').and.returnValue(Promise.resolve([]));
}

describe('PurchaseOrderFormComponent', () => {
    let component: PurchaseOrderFormComponent;
    let fixture: ComponentFixture<PurchaseOrderFormComponent>;

    beforeEach(waitForAsync(() => {
        TestBed.configureTestingModule({
            imports: [
                PurchaseOrderFormComponent, // Standalone
                RouterTestingModule,
                NgIconsModule
            ],
            providers: [
                { provide: SessionService, useClass: MockSessionService },
                { provide: PurchaseOrderRepository, useClass: MockPurchaseOrderRepository },
                { provide: SupplierRepository, useClass: MockSupplierRepository },
                { provide: ProductRepository, useClass: MockProductRepository },
                { provide: WarehouseRepository, useClass: MockWarehouseRepository },
                provideIcons(heroIcons),
                CurrencyPipe
            ]
        })
            .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(PurchaseOrderFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize form with default values', () => {
        expect(component.form).toBeDefined();
        expect(component.form.get('status')?.value).toBe('DRAFT');
        expect(component.form.get('lines')?.value).toEqual([]);
    });

    it('should call repositories on init', () => {
        const supplierRepo = TestBed.inject(SupplierRepository);
        expect(supplierRepo.getAll).toHaveBeenCalled();
    });
});
