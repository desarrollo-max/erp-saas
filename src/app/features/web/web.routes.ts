import { Routes } from '@angular/router';

export const WEB_ROUTES: Routes = [
    {
        path: 'site',
        loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
    },
    {
        path: 'ecommerce',
        loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
    },
    {
        path: 'blog',
        loadComponent: () => import('./blog/blog.component').then(m => m.BlogComponent)
    },
    {
        path: 'learning',
        loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
    },
    {
        path: 'forum',
        loadComponent: () => import('../../shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
    }
];
