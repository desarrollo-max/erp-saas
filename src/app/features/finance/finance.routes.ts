import { Routes } from '@angular/router';

export const FINANCE_ROUTES: Routes = [
    {
        path: 'contabilidad',
        loadComponent: () => import('./accounting/accounting.component').then(m => m.AccountingComponent)
    },
    {
        path: 'facturacion',
        loadComponent: () => import('./billing/billing.component').then(m => m.BillingComponent)
    },
    {
        path: 'gastos',
        loadComponent: () => import('./expenses/expenses.component').then(m => m.ExpensesComponent)
    },
    {
        path: 'documentos',
        loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
    },
    {
        path: 'reportes',
        loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./bi/bi.component').then(m => m.BusinessIntelligenceComponent)
    },
    {
        path: 'tesoreria',
        loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
    }
];
