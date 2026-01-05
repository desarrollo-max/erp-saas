import { TestBed } from '@angular/core/testing';
import { SupabasePurchaseOrderRepository } from './supabase-purchase-order.repository';
import { SupabaseService } from '@core/services/supabase.service';
import { SessionService } from '@core/services/session.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('SupabasePurchaseOrderRepository', () => {
    let repository: SupabasePurchaseOrderRepository;
    let supabaseSpy: any;
    let sessionSpy: any;

    const mockTenantId = 'tenant-123';
    const mockCompanyId = 'company-456';

    beforeEach(() => {
        const supabaseMock = {
            client: {
                from: vi.fn(),
            }
        };

        const sessionMock = {
            currentTenantId: vi.fn().mockReturnValue(mockTenantId),
            currentCompanyId: vi.fn().mockReturnValue(mockCompanyId),
            user: vi.fn().mockReturnValue({ id: 'user-789' })
        };

        TestBed.configureTestingModule({
            providers: [
                SupabasePurchaseOrderRepository,
                { provide: SupabaseService, useValue: supabaseMock },
                { provide: SessionService, useValue: sessionMock }
            ]
        });

        repository = TestBed.inject(SupabasePurchaseOrderRepository);
        supabaseSpy = TestBed.inject(SupabaseService);
        sessionSpy = TestBed.inject(SessionService);
    });

    it('should be created', () => {
        expect(repository).toBeTruthy();
    });

    describe('updateLineQuantity', () => {
        it('should fetch the current quantity and update it with the sum', async () => {
            const lineId = 'line-1';
            const receivedNow = 5;
            const currentReceived = 10;

            const mockSingle = vi.fn().mockResolvedValue({
                data: { quantity_received: currentReceived },
                error: null
            });

            const mockEq3 = vi.fn().mockReturnValue({ single: mockSingle });
            const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3 });
            const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

            const mockUpdateEq3 = vi.fn().mockResolvedValue({ error: null });
            const mockUpdateEq2 = vi.fn().mockReturnValue({ eq: mockUpdateEq3 });
            const mockUpdateEq1 = vi.fn().mockReturnValue({ eq: mockUpdateEq2 });
            const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq1 });

            supabaseSpy.client.from.mockImplementation((table: string) => {
                if (table === 'scm_po_lines') {
                    return {
                        select: mockSelect,
                        update: mockUpdate
                    };
                }
                return {};
            });

            await repository.updateLineQuantity(lineId, receivedNow);

            // Verify fetch
            expect(mockSelect).toHaveBeenCalledWith('quantity_received');
            expect(mockEq3).toHaveBeenCalledWith('company_id', mockCompanyId);

            // Verify update
            expect(mockUpdate).toHaveBeenCalledWith({ quantity_received: 15 });
            expect(mockUpdateEq3).toHaveBeenCalledWith('company_id', mockCompanyId);
        });
    });

    describe('receivePo', () => {
        it('should update PO status to RECEIVED if all lines are completed', async () => {
            const poId = 'po-123';

            // Mock lines: all completed
            const mockLines = [
                { quantity_ordered: 10, quantity_received: 10 },
                { quantity_ordered: 5, quantity_received: 5 }
            ];

            const mockLinesEq3 = vi.fn().mockResolvedValue({ data: mockLines, error: null });
            const mockLinesEq2 = vi.fn().mockReturnValue({ eq: mockLinesEq3 });
            const mockLinesEq1 = vi.fn().mockReturnValue({ eq: mockLinesEq2 });
            const mockLinesSelect = vi.fn().mockReturnValue({ eq: mockLinesEq1 });

            // Mock PO update
            const mockPoUpdateEq3 = vi.fn().mockResolvedValue({ error: null });
            const mockPoUpdateEq2 = vi.fn().mockReturnValue({ eq: mockPoUpdateEq3 });
            const mockPoUpdateEq1 = vi.fn().mockReturnValue({ eq: mockPoUpdateEq2 });
            const mockPoUpdate = vi.fn().mockReturnValue({ eq: mockPoUpdateEq1 });

            supabaseSpy.client.from.mockImplementation((table: string) => {
                if (table === 'scm_po_lines') {
                    return { select: mockLinesSelect };
                }
                if (table === 'scm_purchase_orders') {
                    return { update: mockPoUpdate };
                }
                return {};
            });

            await repository.receivePo(poId);

            // Verify status update
            expect(mockPoUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'RECEIVED' }));
            expect(mockPoUpdateEq3).toHaveBeenCalledWith('company_id', mockCompanyId);
        });

        it('should NOT update PO status if some lines are incomplete', async () => {
            const poId = 'po-123';

            // Mock lines: one incomplete
            const mockLines = [
                { quantity_ordered: 10, quantity_received: 8 },
                { quantity_ordered: 5, quantity_received: 5 }
            ];

            const mockLinesEq3 = vi.fn().mockResolvedValue({ data: mockLines, error: null });
            const mockLinesEq2 = vi.fn().mockReturnValue({ eq: mockLinesEq3 });
            const mockLinesEq1 = vi.fn().mockReturnValue({ eq: mockLinesEq2 });
            const mockLinesSelect = vi.fn().mockReturnValue({ eq: mockLinesEq1 });

            const mockPoUpdate = vi.fn();

            supabaseSpy.client.from.mockImplementation((table: string) => {
                if (table === 'scm_po_lines') {
                    return { select: mockLinesSelect };
                }
                if (table === 'scm_purchase_orders') {
                    return { update: mockPoUpdate };
                }
                return {};
            });

            await repository.receivePo(poId);

            // Verify status update NOT called
            expect(mockPoUpdate).not.toHaveBeenCalled();
        });
    });

    describe('getPendingOrdersCount', () => {
        it('should return the count of pending and approved orders', async () => {
            const mockCount = 5;

            const mockIn = vi.fn().mockResolvedValue({ count: mockCount, error: null });
            const mockEq2 = vi.fn().mockReturnValue({ in: mockIn });
            const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
            const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });

            supabaseSpy.client.from.mockImplementation((table: string) => {
                if (table === 'scm_purchase_orders') {
                    return { select: mockSelect };
                }
                return {};
            });

            const count = await repository.getPendingOrdersCount();

            expect(count).toBe(mockCount);
            expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
            expect(mockIn).toHaveBeenCalledWith('status', ['APPROVED', 'PENDING_APPROVAL']);
            expect(mockEq2).toHaveBeenCalledWith('company_id', mockCompanyId);
        });
    });
});
