import { TestBed } from '@angular/core/testing';
import { SessionService } from './session.service';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

describe('SessionService', () => {
    let service: SessionService;
    let supabaseSpy: any;
    let routerSpy: any;

    beforeEach(() => {
        const supabaseMock = {
            client: {
                auth: {
                    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
                    signOut: vi.fn().mockResolvedValue({ error: null })
                },
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ data: [], error: null })
                        })
                    })
                })
            }
        };

        const routerMock = {
            navigate: vi.fn()
        };

        TestBed.configureTestingModule({
            providers: [
                SessionService,
                { provide: SupabaseService, useValue: supabaseMock },
                { provide: Router, useValue: routerMock }
            ]
        });
        service = TestBed.inject(SessionService);
        supabaseSpy = TestBed.inject(SupabaseService);
        routerSpy = TestBed.inject(Router);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return false for isLoggedIn when no session exists', async () => {
        const isLoggedIn = await service.isLoggedIn();
        expect(isLoggedIn).toBe(false);
    });

    it('should return true for isLoggedIn when session exists', async () => {
        // Set tenant context to simulate logged in state
        service.currentTenantId.set('tenant-123');

        const isLoggedIn = service.isLoggedIn();
        expect(isLoggedIn).toBe(true);
    });

    it('should logout and navigate to login', async () => {
        await service.logout();
        expect(supabaseSpy.client.auth.signOut).toHaveBeenCalled();
        expect(service.currentTenantId()).toBeNull();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
    });
});
