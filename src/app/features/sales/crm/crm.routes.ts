import { Routes } from '@angular/router';
import { CrmComponent } from './crm.component';

export const CRM_ROUTES: Routes = [
    {
        path: '',
        component: CrmComponent,
        children: [
            { path: '', loadComponent: () => import('./dashboard/crm-dashboard.component').then(m => m.CrmDashboardComponent) },
            { path: 'dashboard', loadComponent: () => import('./dashboard/crm-dashboard.component').then(m => m.CrmDashboardComponent) },
            {
                path: 'companies',
                loadComponent: () => import('./companies/company-list/company-list.component').then(m => m.CompanyListComponent)
            },
            {
                path: 'companies/new',
                loadComponent: () => import('./companies/company-form/company-form.component').then(m => m.CompanyFormComponent)
            },
            {
                path: 'companies/:id',
                loadComponent: () => import('./companies/company-form/company-form.component').then(m => m.CompanyFormComponent)
            },
            {
                path: 'contacts',
                loadComponent: () => import('./contacts/contact-list/contact-list.component').then(m => m.ContactListComponent)
            },
            {
                path: 'contacts/new',
                loadComponent: () => import('./contacts/contact-form/contact-form.component').then(m => m.ContactFormComponent)
            },
            {
                path: 'contacts/:id',
                loadComponent: () => import('./contacts/contact-form/contact-form.component').then(m => m.ContactFormComponent)
            },
            {
                path: 'opportunities',
                loadComponent: () => import('./opportunities/opportunity-board/opportunity-board.component').then(m => m.OpportunityBoardComponent)
            },
            {
                path: 'opportunities/new',
                loadComponent: () => import('./opportunities/opportunity-form/opportunity-form.component').then(m => m.OpportunityFormComponent)
            },
            {
                path: 'opportunities/:id',
                loadComponent: () => import('./opportunities/opportunity-form/opportunity-form.component').then(m => m.OpportunityFormComponent)
            }
            // Future routes for opportunities
        ]
    }
];
