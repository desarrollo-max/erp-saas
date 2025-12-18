import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarketplaceModalComponent } from './marketplace-modal.component';
import { signal } from '@angular/core';

describe('MarketplaceModalComponent', () => {
    let component: MarketplaceModalComponent;

    beforeEach(() => {
        // Mock services
        const mockModuleRepo = {
            getAllAvailable: vi.fn().mockResolvedValue([]),
            installModule: vi.fn().mockResolvedValue({}),
            uninstallModule: vi.fn().mockResolvedValue({})
        };
        const mockSession = {
            currentTenantId: vi.fn().mockReturnValue('tenant-1')
        };
        const mockNotification = {
            success: vi.fn(),
            error: vi.fn()
        };

        // Inject mocks using any because we are not in a full Angular Testbed for simplicity in this vitest setup
        component = new MarketplaceModalComponent() as any;
        (component as any).moduleRepo = mockModuleRepo;
        (component as any).session = mockSession;
        (component as any).notification = mockNotification;
    });

    it('debería inicializarse y cargar el marketplace', async () => {
        const spy = vi.spyOn(component, 'loadMarketplace');
        component.ngOnInit();
        expect(spy).toHaveBeenCalled();
    });

    it('debería identificar si un módulo está instalado', () => {
        component.installedIds = ['mod-1', 'mod-2'];
        expect(component.isInstalled('mod-1')).toBe(true);
        expect(component.isInstalled('mod-3')).toBe(false);
    });

    it('debería cerrar el modal al llamar a close()', () => {
        const spy = vi.spyOn(component.closeModal, 'emit');
        component.close();
        expect(spy).toHaveBeenCalled();
    });
});
