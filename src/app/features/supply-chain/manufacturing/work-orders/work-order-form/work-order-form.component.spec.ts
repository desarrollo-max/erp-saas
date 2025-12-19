
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkOrderFormComponent } from './work-order-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ManufacturingRepository } from '@core/repositories/manufacturing.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { of } from 'rxjs';
import { NgIconsModule } from '@ng-icons/core';

describe('WorkOrderFormComponent', () => {
    let component: WorkOrderFormComponent;
    let fixture: ComponentFixture<WorkOrderFormComponent>;

    const mockManufacturingRepository = {
        getProcesses: jasmine.createSpy('getProcesses').and.returnValue(Promise.resolve([])),
        getProcessStages: jasmine.createSpy('getProcessStages').and.returnValue(Promise.resolve([])),
        getOrderById: jasmine.createSpy('getOrderById').and.returnValue(Promise.resolve(null)),
        createProductionOrder: jasmine.createSpy('createProductionOrder').and.returnValue(Promise.resolve({}))
    };

    const mockProductRepository = {
        getAll: jasmine.createSpy('getAll').and.returnValue(Promise.resolve([]))
    };

    const mockSessionService = {
        currentTenantId: jasmine.createSpy('currentTenantId').and.returnValue('tenant-1'),
        currentCompanyId: jasmine.createSpy('currentCompanyId').and.returnValue('company-1')
    };

    const mockNotificationService = {
        success: jasmine.createSpy('success'),
        error: jasmine.createSpy('error')
    };

    const mockActivatedRoute = {
        snapshot: {
            paramMap: {
                get: (key: string) => 'nuevo'
            }
        }
    };

    const mockRouter = {
        navigate: jasmine.createSpy('navigate')
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WorkOrderFormComponent, ReactiveFormsModule, NgIconsModule],
            providers: [
                { provide: ManufacturingRepository, useValue: mockManufacturingRepository },
                { provide: ProductRepository, useValue: mockProductRepository },
                { provide: SessionService, useValue: mockSessionService },
                { provide: NotificationService, useValue: mockNotificationService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: Router, useValue: mockRouter }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WorkOrderFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize as new when ID is "nuevo"', () => {
        expect(component.isNew()).toBeTrue();
        expect(component.orderForm.get('order_number')?.value).toContain('WO-');
    });

    it('should load products and processes on init', () => {
        expect(mockProductRepository.getAll).toHaveBeenCalled();
        expect(mockManufacturingRepository.getProcesses).toHaveBeenCalled();
    });
});
