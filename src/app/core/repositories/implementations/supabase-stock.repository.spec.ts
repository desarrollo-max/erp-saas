import { TestBed } from '@angular/core/testing';
import { SupabaseStockRepository } from './supabase-stock.repository';
import { SupabaseService } from '@core/services/supabase.service';
import { SessionService } from '@core/services/session.service';
import { ScmStockMovement } from '@core/models/erp.types';

describe('SupabaseStockRepository', () => {
    let repository: SupabaseStockRepository;
    let supabaseSpy: any;
    let sessionSpy: any;

    beforeEach(() => {
        const supabaseMock = {
            client: {
                from: vi.fn(),
            }
        };

        const sessionMock = {
            currentTenantId: vi.fn().mockReturnValue('tenant-123'),
            currentCompanyId: vi.fn().mockReturnValue('company-123'),
            currentUserId: vi.fn().mockReturnValue('user-123')
        };

        TestBed.configureTestingModule({
            providers: [
                SupabaseStockRepository,
                { provide: SupabaseService, useValue: supabaseMock },
                { provide: SessionService, useValue: sessionMock }
            ]
        });

        repository = TestBed.inject(SupabaseStockRepository);
        supabaseSpy = TestBed.inject(SupabaseService);
        sessionSpy = TestBed.inject(SessionService);
    });

    it('should be created', () => {
        expect(repository).toBeTruthy();
    });

    describe('createStockMovement', () => {
        const mockMovement: Partial<ScmStockMovement> = {
            variant_id: 'var-1',
            warehouse_id: 'wh-1',
            quantity: 10,
            movement_type: 'IN'
        };

        it('should throw error if user ID is missing', async () => {
            sessionSpy.currentUserId.mockReturnValue(null);

            await expect(repository.createStockMovement(mockMovement))
                .rejects
                .toThrow('Operación denegada: Se requiere un usuario autenticado para registrar movimientos.');
        });

        it('should proceed if user ID is present', async () => {
            // Mock Supabase Chain for Movements
            const mockInsert = vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: 'move-1', ...mockMovement }, error: null })
                })
            });

            // Mock Supabase Chain for Levels
            const mockUpsert = vi.fn().mockResolvedValue({ error: null });
            const mockSelectLevel = vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({ // tenant
                    eq: vi.fn().mockReturnValue({ // company
                        eq: vi.fn().mockReturnValue({ // warehouse
                            eq: vi.fn().mockReturnValue({ // variant
                                maybeSingle: vi.fn().mockResolvedValue({ data: { quantity_on_hand: 5, quantity_available: 5 }, error: null })
                            })
                        })
                    })
                })
            });

            supabaseSpy.client.from.mockImplementation((table: string) => {
                if (table === 'scm_stock_movements') {
                    return { insert: mockInsert };
                }
                if (table === 'scm_stock_levels') {
                    return {
                        select: mockSelectLevel,
                        upsert: mockUpsert
                    };
                }
                return {};
            });

            await repository.createStockMovement(mockMovement);

            expect(sessionSpy.currentUserId).toHaveBeenCalled();
            expect(supabaseSpy.client.from).toHaveBeenCalledWith('scm_stock_movements');
        });
    });

    describe('getCriticalStockCount', () => {
        it('should return the count of items with stock below or equal to the limit', async () => {
            const limit = 4;
            const mockCount = 12;

            const mockLte = vi.fn().mockResolvedValue({ count: mockCount, error: null });
            const mockEq2 = vi.fn().mockReturnValue({ lte: mockLte });
            const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

            supabaseSpy.client.from.mockImplementation((table: string) => {
                if (table === 'scm_stock_levels') {
                    return { select: mockSelect };
                }
                return {};
            });

            const count = await repository.getCriticalStockCount(limit);

            expect(count).toBe(mockCount);
            expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
            expect(mockLte).toHaveBeenCalledWith('quantity_on_hand', limit);
        });
    });
});
