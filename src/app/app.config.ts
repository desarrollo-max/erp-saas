import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, ErrorHandler, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { GlobalErrorHandler } from './core/handlers/global-error-handler';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { LucideAngularModule, Grid, ChevronDown, Box, Settings, Factory, Package, Store, X, Plus, Trash2, ShoppingCart, Loader2, Edit, Calculator, Users, TrendingUp, Megaphone, ClipboardCheck, Headphones, Search, Menu, Home, Check, LogOut, MoreVertical, Filter, ArrowLeft, ArrowRight } from 'lucide-angular';
import { provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

import { routes } from './app.routes';
import { SessionService } from './core/services/session.service';
import { ProductRepository } from './core/repositories/product.repository';
import { SupabaseProductRepository } from './core/repositories/implementations/supabase-product.repository';
import { CompanyRepository } from './core/repositories/company.repository';
import { SupabaseCompanyRepository } from './core/repositories/implementations/supabase-company.repository';
import { ModuleRepository } from './core/repositories/module.repository';
import { SupabaseModuleRepository } from './core/repositories/implementations/supabase-module.repository';
import { SalesRepository } from './core/repositories/sales.repository';
import { SupabaseSalesRepository } from './core/repositories/implementations/supabase-sales.repository';
import { FinanceRepository } from './core/repositories/finance.repository';
import { SupabaseFinanceRepository } from './core/repositories/implementations/supabase-finance.repository';
import { HRRepository } from './core/repositories/hr.repository';
import { SupabaseHRRepository } from './core/repositories/implementations/supabase-hr.repository';
import { ManufacturingRepository } from './core/repositories/manufacturing.repository';
import { MockManufacturingRepository } from './core/repositories/implementations/mock-manufacturing.repository';
import { InventoryRepository } from './core/repositories/inventory.repository';
import { MockInventoryRepository } from './core/repositories/implementations/mock-inventory.repository';
import { WarehouseRepository } from './core/repositories/warehouse.repository';
import { SupabaseWarehouseRepository } from './core/repositories/implementations/supabase-warehouse.repository';
import { StockRepository } from './core/repositories/stock.repository';
import { SupabaseStockRepository } from './core/repositories/implementations/supabase-stock.repository';

// Factory function to initialize the session
export function initializeSession(sessionService: SessionService) {
  return (): Promise<void> => {
    return sessionService.loadSession();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(LucideAngularModule.pick({ Grid, ChevronDown, Box, Settings, Factory, Package, Store, X, Plus, Trash2, ShoppingCart, Loader2, Edit, Calculator, Users, TrendingUp, Megaphone, ClipboardCheck, Headphones, Search, Menu, Home, Check, LogOut, MoreVertical, Filter, ArrowLeft, ArrowRight })),
    provideIcons(heroIcons),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeSession,
      deps: [SessionService],
      multi: true
    },
    { provide: ProductRepository, useClass: SupabaseProductRepository },
    { provide: CompanyRepository, useClass: SupabaseCompanyRepository },
    { provide: ModuleRepository, useClass: SupabaseModuleRepository },
    { provide: SalesRepository, useClass: SupabaseSalesRepository },
    { provide: FinanceRepository, useClass: SupabaseFinanceRepository },
    { provide: HRRepository, useClass: SupabaseHRRepository },
    { provide: ManufacturingRepository, useClass: MockManufacturingRepository },
    { provide: InventoryRepository, useClass: SupabaseWarehouseRepository },
    { provide: WarehouseRepository, useClass: SupabaseWarehouseRepository },
    { provide: StockRepository, useClass: SupabaseStockRepository }
  ]
};

