import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { roleGuard } from './role.guard';
import { SessionService } from '../services/session.service';
import { signal } from '@angular/core';

describe('roleGuard', () => {
    const executeGuard: CanActivateFn = (...guardParameters) =>
        TestBed.runInInjectionContext(() => roleGuard(...guardParameters));

    let sessionServiceMock: any;
    let routerSpy: any;

    beforeEach(() => {
        sessionServiceMock = {
            currentUserRole: signal<string | null>(null)
        };
        routerSpy = {
            navigate: vi.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: SessionService, useValue: sessionServiceMock },
                { provide: Router, useValue: routerSpy }
            ]
        });
    });

    it('should allow access if user has required role', () => {
        sessionServiceMock.currentUserRole.set('admin');
        const route = { data: { roles: ['admin', 'user'] } } as unknown as ActivatedRouteSnapshot;

        const result = executeGuard(route, {} as RouterStateSnapshot);

        expect(result).toBe(true);
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('should deny access and redirect if user does not have required role', () => {
        sessionServiceMock.currentUserRole.set('guest');
        const route = { data: { roles: ['admin'] } } as unknown as ActivatedRouteSnapshot;

        const result = executeGuard(route, {} as RouterStateSnapshot);

        expect(result).toBe(false);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/launcher']);
    });

    it('should deny access if user has no role', () => {
        sessionServiceMock.currentUserRole.set(null);
        const route = { data: { roles: ['admin'] } } as unknown as ActivatedRouteSnapshot;

        const result = executeGuard(route, {} as RouterStateSnapshot);

        expect(result).toBe(false);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/launcher']);
    });
});
