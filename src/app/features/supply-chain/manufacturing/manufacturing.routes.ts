
import { Routes } from '@angular/router';

export const PRODUCTION_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./launcher/manufacturing-launcher.component').then(m => m.ManufacturingLauncherComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/production-dashboard.component').then(m => m.ProductionDashboardComponent)
    },
    {
        path: 'work-orders',
        children: [
            {
                path: '',
                loadComponent: () => import('./work-orders/work-order-list/work-order-list.component').then(m => m.WorkOrderListComponent)
            },
            {
                path: ':id',
                loadComponent: () => import('./work-orders/work-order-form/work-order-form.component').then(m => m.WorkOrderFormComponent)
            }
        ]
    },
    // Alises para español
    { path: 'ordenes', redirectTo: 'work-orders', pathMatch: 'prefix' },
    { path: 'ordenes-trabajo', redirectTo: 'work-orders', pathMatch: 'prefix' },

    {
        path: 'processes',
        children: [
            {
                path: '',
                loadComponent: () => import('./processes/process-list/process-list.component').then(m => m.ProcessListComponent)
            },
            {
                path: ':id',
                loadComponent: () => import('./processes/process-detail/process-detail.component').then(m => m.ProcessDetailComponent)
            }
        ]
    },
    { path: 'procesos', redirectTo: 'processes', pathMatch: 'prefix' },

    {
        path: 'catalog',
        children: [
            {
                path: '',
                loadComponent: () => import('./catalog/catalog-list/catalog-list.component').then(m => m.CatalogListComponent)
            },
            {
                path: 'new',
                loadComponent: () => import('./catalog/catalog-form/catalog-form.component').then(m => m.CatalogFormComponent)
            },
            {
                path: ':id',
                loadComponent: () => import('./catalog/catalog-form/catalog-form.component').then(m => m.CatalogFormComponent)
            }
        ]
    },
    { path: 'catalogo', redirectTo: 'catalog', pathMatch: 'prefix' },

    {
        path: 'bom',
        children: [
            {
                path: '',
                loadComponent: () => import('./bom/bom-list/bom-list.component').then(m => m.BomListComponent)
            },
            {
                path: ':id',
                loadComponent: () => import('./bom/bom-form/bom-form.component').then(m => m.BomFormComponent)
            }
        ]
    },
    { path: 'recetas', redirectTo: 'bom', pathMatch: 'prefix' },
    { path: 'explosion-materiales', redirectTo: 'bom', pathMatch: 'prefix' }
];
