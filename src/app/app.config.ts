import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { GlobalErrorHandler } from './core/handlers/global-error-handler';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { routes } from './app.routes';
import { SessionService } from './core/services/session.service';
import { ProductRepository } from './core/repositories/product.repository';
import { SupabaseProductRepository } from './core/repositories/implementations/supabase-product.repository';

import { CompanyRepository } from './core/repositories/company.repository';
import { SupabaseCompanyRepository } from './core/repositories/implementations/supabase-company.repository';
import { ModuleRepository } from './core/repositories/module.repository';
import { SupabaseModuleRepository } from './core/repositories/implementations/supabase-module.repository';

// Factory function to initialize the session
export function initializeSession(sessionService: SessionService) {
  return (): Promise<void> => {
    return sessionService.initSession();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    provideAnimations(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeSession,
      deps: [SessionService],
      multi: true
    },
    { provide: ProductRepository, useClass: SupabaseProductRepository },
    { provide: CompanyRepository, useClass: SupabaseCompanyRepository },
    { provide: ModuleRepository, useClass: SupabaseModuleRepository }
  ]
};
