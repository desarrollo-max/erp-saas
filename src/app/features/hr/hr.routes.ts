
import { Routes } from '@angular/router';
import { HrComponent } from './hr.component';

export const HR_ROUTES: Routes = [
    {
        path: '',
        component: HrComponent,
        children: [
            { path: '', redirectTo: 'empleados', pathMatch: 'full' },
            {
                path: 'employees',
                redirectTo: 'empleados'
            },
            {
                path: 'empleados',
                loadComponent: () => import('./employees/employees.component').then(m => m.EmployeesComponent)
            },
            {
                path: 'time-off',
                redirectTo: 'vacaciones'
            },
            {
                path: 'vacaciones',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'recruitment',
                redirectTo: 'reclutamiento'
            },
            {
                path: 'reclutamiento',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'nomina',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'flota',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            }
        ]
    }
];
