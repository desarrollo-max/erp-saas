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
        loadComponent: () => import('./work-orders/work-order-list/work-order-list.component').then(m => m.WorkOrderListComponent)
    },
    {
        path: 'work-orders/:id',
        loadComponent: () => import('./work-orders/work-order-form/work-order-form.component').then(m => m.WorkOrderFormComponent)
    },
    {
        path: 'processes',
        loadComponent: () => import('./processes/process-list/process-list.component').then(m => m.ProcessListComponent)
    },
    {
        path: 'processes/:id',
        loadComponent: () => import('./processes/process-detail/process-detail.component').then(m => m.ProcessDetailComponent)
    },
    {
        path: 'catalog',
        loadComponent: () => import('./catalog/catalog-list/catalog-list.component').then(m => m.CatalogListComponent)
    },
    {
        path: 'catalog/new',
        loadComponent: () => import('./catalog/catalog-form/catalog-form.component').then(m => m.CatalogFormComponent)
    },
    {
        path: 'catalog/:id',
        loadComponent: () => import('./catalog/catalog-form/catalog-form.component').then(m => m.CatalogFormComponent)
    },
    {
        path: 'finished-goods',
        redirectTo: 'catalog',
        pathMatch: 'full'
    },
    {
        path: 'bom',
        loadComponent: () => import('./bom/bom-list/bom-list.component').then(m => m.BomListComponent)
    },
    {
        path: 'bom/:id',
        loadComponent: () => import('./bom/bom-form/bom-form.component').then(m => m.BomFormComponent)
    }
];
