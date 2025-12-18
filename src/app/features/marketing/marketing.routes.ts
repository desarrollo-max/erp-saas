
import { Routes } from '@angular/router';
import { MarketingComponent } from './marketing.component';

export const MARKETING_ROUTES: Routes = [
    {
        path: '',
        component: MarketingComponent,
        children: [
            { path: '', redirectTo: 'campanas', pathMatch: 'full' },
            {
                path: 'campanas',
                loadComponent: () => import('./campaigns/campaigns.component').then(m => m.CampaignsComponent)
            },
            {
                path: 'automation',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'email',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'social',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'eventos',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            },
            {
                path: 'encuestas',
                loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
            }
        ]
    }
];
