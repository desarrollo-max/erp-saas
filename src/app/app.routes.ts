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
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
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
        path: 'inventory/movements/new',
        loadComponent: () => import('./features/inventory/stock-movement-form/stock-movement-form.component').then(m => m.StockMovementFormComponent)
      },
      {
        path: 'inventory/movements/history',
        loadComponent: () => import('./features/inventory/stock-movement-history/stock-movement-history.component').then(m => m.StockMovementHistoryComponent)
      },
      {
        path: 'cadena-suministro/inventario',
        loadComponent: () => import('./features/supply-chain/inventory/inventory.component').then(m => m.InventoryComponent)
      },
      {
        path: 'cadena-suministro/inventario/etiquetas',
        loadComponent: () => import('./features/supply-chain/inventory/label-printing/label-printing.component').then(m => m.LabelPrintingComponent)
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
        path: 'purchasing/orders/new',
        loadComponent: () => import('./features/purchasing/purchase-order-form/purchase-order-form.component').then(m => m.PurchaseOrderFormComponent)
      },
      {
        path: 'cadena-suministro/compras/new',
        loadComponent: () => import('./features/purchasing/purchase-order-form/purchase-order-form.component').then(m => m.PurchaseOrderFormComponent)
      },
      {
        path: 'purchasing/orders/edit/:id',
        loadComponent: () => import('./features/purchasing/purchase-order-form/purchase-order-form.component').then(m => m.PurchaseOrderFormComponent)
      },
      {
        path: 'cadena-suministro/proveedores',
        loadComponent: () => import('./features/supply-chain/suppliers/supplier-list.component').then(m => m.SupplierListComponent)
      },
      {
        path: 'cadena-suministro/proveedores/nuevo',
        loadComponent: () => import('./features/supply-chain/suppliers/supplier-form.component').then(m => m.SupplierFormComponent)
      },
      {
        path: 'cadena-suministro/proveedores/editar/:id',
        loadComponent: () => import('./features/supply-chain/suppliers/supplier-form.component').then(m => m.SupplierFormComponent)
      },
      {
        path: 'pos',
        loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent)
      },
      {
        path: 'ventas/pdv-retail',
        loadComponent: () => import('./features/pos/pos.component').then(m => m.PosComponent)
      },
      {
        path: 'cadena-suministro/movimientos',
        loadComponent: () => import('./features/supply-chain/inventory/transfer/stock-transfer.component').then(m => m.StockTransferComponent)
      },
      {
        path: 'finanzas',
        loadChildren: () => import('./features/finance/finance.routes').then(m => m.FINANCE_ROUTES)
      },
      // SALES / WHOLESALE
      {
        path: 'ventas/pedidos',
        loadComponent: () => import('./features/sales/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'ventas/ordenes',
        loadComponent: () => import('./features/sales/orders/orders.component').then(m => m.OrdersComponent)
      },
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

      // HR ROUTES
      {
        path: 'rrhh',
        loadChildren: () => import('./features/hr/hr.routes').then(m => m.HR_ROUTES)
      },
      {
        path: 'hr',
        loadChildren: () => import('./features/hr/hr.routes').then(m => m.HR_ROUTES)
      },

      // MARKETING ROUTES
      {
        path: 'marketing',
        loadChildren: () => import('./features/marketing/marketing.routes').then(m => m.MARKETING_ROUTES)
      },

      // WEB ROUTES
      {
        path: 'web',
        loadChildren: () => import('./features/web/web.routes').then(m => m.WEB_ROUTES)
      },

      // SERVICES ROUTES
      {
        path: 'servicios',
        children: [
          { path: 'proyectos', loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent) },
          { path: 'horas', loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent) },
          { path: 'campo', loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent) },
          { path: 'soporte', loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent) },
          { path: 'planificacion', loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent) },
          { path: 'citas', loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent) },
        ]
      },

      // PRODUCTIVITY ROUTES
      {
        path: 'productividad',
        children: [
          { path: 'contactos', loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent) },
          { path: 'calendario', loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent) },
          { path: 'notas', loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent) },
          { path: 'chat', loadComponent: () => import('./shared/components/placeholder/placeholder.component').then(m => m.PlaceholderComponent) },
        ]
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