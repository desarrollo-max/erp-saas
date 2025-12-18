import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PurchasingComponent } from './purchasing.component';
import { PurchaseOrderRepository } from '@core/repositories/purchase-order.repository';
import { SessionService } from '@core/services/session.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('PurchasingComponent', () => {
    let component: PurchasingComponent;
    let fixture: ComponentFixture<PurchasingComponent>;

    const poRepoMock = {
        getAll: vi.fn().mockResolvedValue([])
    };

    const sessionServiceMock = {
        currentTenantId: signal('test-tenant-id')
    };

    const routerMock = {
        navigate: vi.fn()
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PurchasingComponent],
            providers: [
                { provide: PurchaseOrderRepository, useValue: poRepoMock },
                { provide: SessionService, useValue: sessionServiceMock },
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

    it('should load orders on init', async () => {
        expect(poRepoMock.getAll).toHaveBeenCalledWith('test-tenant-id');
    });
});
