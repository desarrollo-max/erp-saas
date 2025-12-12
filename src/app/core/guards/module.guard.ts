import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';
import { ModuleRepository } from '../repositories/module.repository';

export const ModuleGuard: CanActivateFn = async (route, state) => {
    const session = inject(SessionService);
    const router = inject(Router);
    const moduleRepo = inject(ModuleRepository);

    const requiredModuleCode = route.data['moduleCode'] as string;
    const tenantId = session.currentTenantId();

    if (!tenantId) {
        router.navigate(['/companies']);
        return false;
    }

    if (!requiredModuleCode) {
        return true; // No specific module required
    }

    try {
        // Optimization: This could be cached in a service to avoid API calls on every navigation
        const installedModules = await moduleRepo.getInstalledModules(tenantId);
        const hasModule = installedModules.some(m => m.code === requiredModuleCode);

        if (hasModule) {
            return true;
        } else {
            // Module not installed or available
            console.warn(`Access denied: Module ${requiredModuleCode} is not installed.`);
            router.navigate(['/dashboard']); // Or a "Module Not Installed" page
            return false;
        }
    } catch (error) {
        console.error('Error checking module access:', error);
        router.navigate(['/dashboard']);
        return false;
    }
};
