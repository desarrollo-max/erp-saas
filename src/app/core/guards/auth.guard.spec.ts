import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { SessionService } from '../services/session.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('AuthGuard', () => {
    const executeGuard: CanActivateFn = (...guardParameters) =>
        TestBed.runInInjectionContext(() => AuthGuard(...guardParameters));

    let sessionServiceSpy: any;
    let routerSpy: any;
    const mockUrlTree = 'mockUrlTree' as any;

    beforeEach(() => {
        sessionServiceSpy = {
            isLoggedIn: vi.fn(),
            loadSession: vi.fn().mockResolvedValue(undefined),
            currentUserId: vi.fn().mockReturnValue(null)
        };
        routerSpy = {
            navigate: vi.fn(),
            createUrlTree: vi.fn().mockReturnValue(mockUrlTree)
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: SessionService, useValue: sessionServiceSpy },
                { provide: Router, useValue: routerSpy }
            ]
        });
    });

    it('should be created', () => {
        expect(executeGuard).toBeTruthy();
    });

    it('should allow access if user is logged in', async () => {
        // isLoggedIn is synchronous
        sessionServiceSpy.isLoggedIn.mockReturnValue(true);

        const result = await executeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);

        expect(result).toBe(true);
    });

    it('should return UrlTree (redirect) if user is not logged in', async () => {
        sessionServiceSpy.isLoggedIn.mockReturnValue(false);

        const result = await executeGuard({} as ActivatedRouteSnapshot, { url: '/test' } as RouterStateSnapshot);

        // Guard returns createUrlTree result
        expect(result).toBe(mockUrlTree);
        expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
    });
});
