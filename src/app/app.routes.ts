import { Routes } from '@angular/router';
import { MainLayoutComponent } from './core/layout/main-layout.component';
import { AuthGuard } from './core/guards/auth.guard';


export const routes: Routes = [
  // ===========================================
  // 1. RUTAS DE CONTEXTO Y AUTENTICACIÓN (NIVEL SUPERIOR)
  // ===========================================
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'companies',
    loadComponent: () => import('./features/companies/company-selector.component').then(m => m.CompanySelectorComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'launcher',
    loadComponent: () => import('./features/launcher/launcher.component').then(m => m.LauncherComponent),
    canActivate: [AuthGuard]
  },

  // RUTA DE SUPER ADMINISTRACIÓN ELIMINADA POR SOLICITUD


  // ===========================================
  // 2. LAYOUT PRINCIPAL (Contiene la Sidebar y Motor Dinámico)
  // ===========================================
  {
    path: '', // Este path vacío engloba todas las rutas de trabajo
    component: MainLayoutComponent,
    canActivate: [AuthGuard], // Bloquea todo el layout si no hay sesión
    children: [
      {
        path: 'dashboard', // Única ruta fija
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent)
      },

      // RUTAS DE UTILIDAD DEL MÓDULO INVENTARIO (Especificas antes de la dinámica)
      {
        path: 'inventory/new',
        loadComponent: () => import('./features/inventory/product-form.component').then(m => m.ProductFormComponent)
      },
      {
        path: 'inventory/edit/:id',
        loadComponent: () => import('./features/inventory/product-form.component').then(m => m.ProductFormComponent)
      },
      {
        path: 'inventory/import',
        loadComponent: () => import('./features/inventory/import/csv-importer.component').then(m => m.CsvImporterComponent)
      },
      {
        path: 'cadena-suministro/inventario',
        loadComponent: () => import('./features/supply-chain/inventory/inventory.component').then(m => m.InventoryComponent)
      },
      {
        path: 'cadena-suministro/almacenes',
        loadComponent: () => import('./features/supply-chain/warehouses/warehouse-list/warehouse-list.component').then(m => m.WarehouseListComponent)
      },
      {
        path: 'cadena-suministro/almacenes/new',
        loadComponent: () => import('./features/supply-chain/warehouses/warehouse-form/warehouse-form.component').then(m => m.WarehouseFormComponent)
      },
      {
        path: 'cadena-suministro/almacenes/edit/:id',
        loadComponent: () => import('./features/supply-chain/warehouses/warehouse-form/warehouse-form.component').then(m => m.WarehouseFormComponent)
      },
      {
        path: 'cadena-suministro/almacenes/stock/:id',
        loadComponent: () => import('./features/supply-chain/warehouses/warehouse-stock-view/warehouse-stock-view.component').then(m => m.WarehouseStockViewComponent)
      },
      {
        path: 'inventory', // Ruta base del módulo de Inventario (Actualizada a Supply Chain Dashboard)
        loadComponent: () => import('./features/supply-chain/inventory/inventory.component').then(m => m.InventoryComponent)
      },
      {
        path: 'production',
        loadChildren: () => import('./features/supply-chain/manufacturing/manufacturing.routes').then(m => m.PRODUCTION_ROUTES)
      },
      {
        path: 'produccion',
        loadChildren: () => import('./features/supply-chain/manufacturing/manufacturing.routes').then(m => m.PRODUCTION_ROUTES)
      },
      {
        path: 'manufactura',
        loadChildren: () => import('./features/supply-chain/manufacturing/manufacturing.routes').then(m => m.PRODUCTION_ROUTES)
      },
      {
        path: 'cadena-suministro/manufactura',
        loadChildren: () => import('./features/supply-chain/manufacturing/manufacturing.routes').then(m => m.PRODUCTION_ROUTES)
      },
      {
        path: 'cadena-suministro/compras',
        loadComponent: () => import('./features/supply-chain/purchasing/purchasing.component').then(m => m.PurchasingComponent)
      },
      {
        path: 'pos',
        loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent)
      },
      {
        path: 'cadena-suministro/movimientos',
        loadComponent: () => import('./features/supply-chain/inventory/transfer/stock-transfer.component').then(m => m.StockTransferComponent)
      },
      // SALES / WHOLESALE
      {
        path: 'ventas/mayoreo',
        loadComponent: () => import('./features/sales/wholesale/wholesale.component').then(m => m.WholesaleComponent)
      },
      {
        path: 'ventas/mayoreo/nuevo',
        loadComponent: () => import('./features/sales/wholesale/wholesale-form.component').then(m => m.WholesaleFormComponent)
      },
      {
        path: 'ventas/mayoreo/editar/:id',
        loadComponent: () => import('./features/sales/wholesale/wholesale-form.component').then(m => m.WholesaleFormComponent)
      },

      // CRM ROUTES
      {
        path: 'ventas/crm',
        loadChildren: () => import('./features/sales/crm/crm.routes').then(m => m.CRM_ROUTES)
      },
      {
        path: 'sales/crm',
        loadChildren: () => import('./features/sales/crm/crm.routes').then(m => m.CRM_ROUTES)
      },

      // 🟢 MOTOR DE RUTAS DINÁMICAS (Captura todas las rutas de la tabla modules, ej: /finanzas/contabilidad)
      // El PlaceholderComponent servirá de host para todas las rutas SCM/FINANZAS/VENTAS
      // IMPORTANTE: Esta ruta debe ir AL FINAL de los hijos para no ocultar rutas específicas
      {
        path: ':category/:feature',
        loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent),
      },

      // Ruta por defecto si entran al layout sin path
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // 3. CATCH-ALL
  {
    path: '**',
    redirectTo: 'login'
  }
];