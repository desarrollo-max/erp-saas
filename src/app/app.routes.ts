import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  // 1. RUTA PÚBLICA: LOGIN (Añadida)
  // La ponemos primero y fuera del Layout principal
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },

  // 2. CAMBIO DE FLUJO:
  // Por defecto, mandamos al usuario al Login en lugar de a companies
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // 3. SELECCIÓN DE EMPRESA (Paso intermedio post-login)
  {
    path: 'companies',
    loadComponent: () => import('./features/companies/company-selector.component').then(m => m.CompanySelectorComponent)
  },

  // 3.5 LAUNCHER (Menú principal post-selección)
  {
    path: 'launcher',
    loadComponent: () => import('./features/launcher/launcher.component').then(m => m.LauncherComponent)
  },

  // 4. RUTAS PROTEGIDAS (Dentro del Layout con Menú)
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/product-list/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'inventory/import',
        loadComponent: () => import('./features/inventory/import/csv-importer.component').then(m => m.CsvImporterComponent)
      },
      {
        path: 'inventory/new',
        loadComponent: () => import('./features/inventory/product-form.component').then(m => m.ProductFormComponent)
      },
      {
        path: 'marketplace',
        loadComponent: () => import('./features/marketplace/marketplace.component').then(m => m.MarketplaceComponent)
      },
      // Si entran a la raíz del layout, mandar al dashboard
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // 5. SUPER ADMIN (Provisioning)
  {
    path: 'admin/provisioning',
    loadComponent: () => import('./features/admin/super-admin.component').then(m => m.SuperAdminComponent)
    // TODO: Add AuthGuard for 'owner' or 'reseller' roles
  },

  // 6. CATCH-ALL (Si escriben c ualquier cosa rara, al login)
  {
    path: '**',
    redirectTo: 'login'
  }
];