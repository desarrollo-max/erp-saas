import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { ModuleRepository } from '@core/repositories/module.repository';
import { Module } from '@core/models/module.model';
import { ThemeService } from '@core/services/theme.service';
import { MarketplaceModalComponent } from '../marketplace/marketplace-modal.component';
import { AssistantSphereComponent } from '../../shared/components/assistant-sphere/assistant-sphere.component';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { APP_ICONS, getAppIcon } from '@core/constants/app-icons';

@Component({
  selector: 'app-launcher',
  standalone: true,
  imports: [
    CommonModule,
    MarketplaceModalComponent,
    AssistantSphereComponent,
    NgIconsModule
  ],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen flex flex-col transition-colors duration-300" style="background-color: var(--app-bg); color: var(--app-text);">
      <!-- HEADER -->
      <div class="shadow-sm transition-colors duration-300" style="background-color: var(--card-bg); border-bottom: 1px solid var(--border-color);">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <div class="flex items-center gap-2 sm:gap-4 overflow-hidden" id="header-company-info">
              <div class="flex items-center gap-3">
                <ng-container *ngIf="sessionService.currentTenant()?.logo_url">
                  <img [src]="sessionService.currentTenant()?.logo_url" alt="Logo" class="h-8 w-8 sm:h-10 sm:w-10 rounded-md object-contain bg-white border border-gray-200">
                </ng-container>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-500 uppercase font-semibold tracking-wider">Empresa</span>
                  <h1 class="text-lg sm:text-xl font-bold truncate text-indigo-600 dark:text-indigo-400 leading-tight">
                    {{ sessionService.currentTenantName() || 'Seleccionar...' }}
                  </h1>
                </div>
              </div>
              
              <button (click)="changeCompany()" class="flex-shrink-0 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full transition ml-2">
                Cambiar
              </button>
            </div>
            
            <div class="flex items-center gap-2 sm:gap-4">
              <!-- Theme Switcher -->
              <button (click)="toggleTheme()" id="header-theme-toggle" class="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition focus:outline-none">
                <ng-icon [name]="themeService.isDark() ? ICONS.themeSun : ICONS.themeMoon" class="w-5 h-5"></ng-icon>
              </button>

              <button (click)="logout()" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 whitespace-nowrap">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="flex-grow flex items-center justify-center p-3 sm:p-6">
        <div class="max-w-6xl w-full">
          
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6" id="launcher-grid">
            
            <!-- CARD 1: SETTINGS (Fixed) -->
            <div (click)="navigateTo('/settings')" 
                 class="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-4 sm:p-6 flex flex-col items-center justify-center group border border-transparent hover:border-gray-200 min-h-[140px] sm:h-48"
                 style="background-color: var(--card-bg);">
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 transition-colors"
                   style="background-color: var(--subtle-bg);">
                <ng-icon [name]="ICONS.settings" class="w-6 h-6 sm:w-7 sm:h-7" style="color: var(--app-text-muted);"></ng-icon>
              </div>
              <h3 class="text-sm sm:text-base font-semibold text-center" style="color: var(--app-text);">Configuración</h3>
            </div>


            
            <!-- CARD: MARKETPLACE -->
            <div (click)="openMarketplace()" 
                 class="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-4 sm:p-6 flex flex-col items-center justify-center group border min-h-[140px] sm:h-48"
                 style="background-color: var(--card-mkt-bg); border-color: var(--card-mkt-border);">
              <div class="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ng-icon [name]="ICONS.marketplace" class="w-6 h-6 sm:w-7 sm:h-7" style="color: var(--card-mkt-text);"></ng-icon>
              </div>
              <h3 class="text-sm sm:text-base font-semibold text-center" style="color: var(--card-pos-text);">Marketplace</h3>
              <p class="text-xs mt-1 opacity-80 hidden md:block text-center" style="color: var(--card-mkt-text);">Explorar Módulos</p>
            </div>

            <!-- DYNAMIC MODULES -->
            <div *ngFor="let module of installedModules()" 
                 (click)="goToModule(module)"
                 [ngClass]="{
                   'opacity-60 cursor-not-allowed hover:shadow-md': !module.route_path,
                   'cursor-pointer hover:shadow-xl': module.route_path
                 }"
                 class="rounded-xl shadow-md transition-all duration-300 p-4 sm:p-6 flex flex-col items-center justify-center group border border-transparent min-h-[140px] sm:h-48 relative"
                 style="background-color: var(--card-bg);">
              
              <!-- Badge "Próximamente" -->
              <span *ngIf="!module.route_path" class="absolute top-2 right-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-[10px] font-bold px-2 py-1 rounded-full">
                Prox.
              </span>

              <div 
                class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 transition-colors"
                [style.background-color]="themeService.isDark() ? (module.color ? module.color + '30' : '#334155') : (module.color ? module.color + '20' : '#EFF6FF')"
                [style.color]="module.color || '#3B82F6'"
              >
                <!-- Dynamic Icon -->
                <ng-container *ngIf="module.icon; else fallbackIcon">
                  <ng-icon 
                    [name]="resolveIcon(module.icon)" 
                    class="w-6 h-6 sm:w-8 sm:h-8"
                    [color]="module.color || '#3B82F6'"
                  ></ng-icon>
                </ng-container>
                
                <!-- Fallback: First letter -->
                <ng-template #fallbackIcon>
                  <span class="text-xl font-bold">{{ module.name.charAt(0) }}</span>
                </ng-template>
              </div>
              <h3 class="text-sm sm:text-base font-semibold text-center" style="color: var(--app-text);">{{ module.name }}</h3>
              <p class="text-xs mt-1 text-center truncate w-full px-2 hidden md:block" style="color: var(--app-text-muted);">{{ module.description }}</p>
            </div>

            <!-- LOADING STATE -->
            <div *ngIf="isLoading()" class="col-span-full flex justify-center py-10">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>

          </div>
        </div>
      </div>
      
      <!-- MARKETPLACE MODAL -->
      <app-marketplace-modal 
        *ngIf="showMarketplace()" 
        [installedIds]="getInstalledModuleIds()"
        (closeModal)="showMarketplace.set(false)"
        (moduleUninstalled)="onModuleUninstalled($event)"
        (moduleInstalled)="onModuleInstalled($event)">
      </app-marketplace-modal>

      <!-- ESFERA FLOTANTE -->
      <app-assistant-sphere></app-assistant-sphere>
    </div>
  `
})
export class LauncherComponent implements OnInit {
  sessionService = inject(SessionService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private moduleRepo = inject(ModuleRepository);

  public readonly ICONS = APP_ICONS;

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  installedModules = signal<Module[]>([]);
  isLoading = signal<boolean>(true);
  showMarketplace = signal<boolean>(false);

  // Use Company ID as the primary context for modules
  currentCompanyId = computed(() => this.sessionService.currentCompanyId());

  constructor() {
    effect(() => {
      const companyId = this.currentCompanyId();
      if (companyId) {
        // Load modules based on Company Context (User Requirement)
        // Note: Repository likely needs tenantId, so we can pass it, 
        // but the trigger is definitely the companyId changing.
        const tenantId = this.sessionService.currentTenantId();
        // Since we are strictly strictly following "dependa únicamente de session.currentCompanyId()",
        // we assume the validity of the call relies on this signal being present.
        if (tenantId) {
          this.loadInstalledModules(tenantId);
        }
      } else {
        // Reset modules if company context is lost
        this.installedModules.set([]);
      }
    });
  }

  ngOnInit() {
    // Logic handled in effect
  }

  async loadInstalledModules(tenantId: string) {
    try {
      this.isLoading.set(true);
      const modules = await this.moduleRepo.getInstalledModules(tenantId);
      this.installedModules.set(modules);
    } catch (error) {
      console.error('Error loading installed modules:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  goToModule(module: Module) {
    if (!module.route_path) return;

    if (module.route_path) {
      this.router.navigate([module.route_path]);
    } else {
      console.warn('Module has no route path:', module.name);
    }
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  openMarketplace() {
    this.showMarketplace.set(true);
  }

  onModuleInstalled(module: Module) {
    const current = this.installedModules();
    if (!current.find(m => m.id === module.id)) {
      this.installedModules.set([...current, module]);
    }
  }

  onModuleUninstalled(moduleId: string) {
    const current = this.installedModules();
    this.installedModules.set(current.filter(m => m.id !== moduleId));
  }

  getInstalledModuleIds(): string[] {
    return this.installedModules().map(m => m.id);
  }

  changeCompany() {
    this.router.navigate(['/companies']);
  }

  logout() {
    this.sessionService.logout();
  }

  resolveIcon(iconName: string | undefined): string {
    return getAppIcon(iconName);
  }
}
