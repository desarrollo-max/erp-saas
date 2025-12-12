import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '@core/services/session.service';

export const roleGuard: CanActivateFn = (route, state) => {
    const session = inject(SessionService);
    const router = inject(Router);

    const requiredRoles = route.data['roles'] as Array<string>;
    const currentRole = session.currentUserRole();

    if (currentRole && requiredRoles.includes(currentRole)) {
        return true;
    } else {
        router.navigate(['/launcher']);
        return false;
    }
};
