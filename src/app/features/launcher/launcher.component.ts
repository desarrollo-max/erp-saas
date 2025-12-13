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
            <div class="flex items-center gap-2 sm:gap-4 overflow-hidden">
              <h1 class="text-lg sm:text-xl font-bold truncate">
                Empresa: <span class="text-indigo-600 dark:text-indigo-400">{{ sessionService.currentTenantName() || 'Seleccionar...' }}</span>
              </h1>
              <button (click)="changeCompany()" class="flex-shrink-0 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1 rounded-full transition">
                Cambiar
              </button>
            </div>
            
            <div class="flex items-center gap-2 sm:gap-4">
              <!-- Theme Switcher -->
              <button (click)="toggleTheme()" class="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition focus:outline-none">
                <ng-icon [name]="themeService.isDark() ? 'heroSunSolid' : 'heroMoonSolid'" class="w-5 h-5"></ng-icon>
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
          
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            
            <!-- CARD 1: SETTINGS (Fixed) -->
            <div (click)="navigateTo('/settings')" 
                 class="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-4 sm:p-6 flex flex-col items-center justify-center group border border-transparent hover:border-gray-200 min-h-[160px] sm:h-48"
                 style="background-color: var(--card-bg);">
              <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mb-3 transition-colors"
                   style="background-color: var(--subtle-bg);">
                <ng-icon name="heroCog6ToothSolid" class="w-6 h-6 sm:w-7 sm:h-7" style="color: var(--app-text-muted);"></ng-icon>
              </div>
              <h3 class="text-sm sm:text-base font-semibold text-center" style="color: var(--app-text);">Configuración</h3>
            </div>

            <!-- CARD 2: PRODUCTION -->
            <div (click)="navigateTo('/manufactura')" 
                 class="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-4 sm:p-6 flex flex-col items-center justify-center group border min-h-[160px] sm:h-48"
                 style="background-color: var(--card-prod-bg); border-color: var(--card-prod-border);">
              <div class="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                 <!-- Note: Forcing icon color via style to ensure contrast on the specific colored bg -->
                <ng-icon name="heroBuildingOffice2Solid" class="w-6 h-6 sm:w-7 sm:h-7" style="color: var(--card-prod-text);"></ng-icon>
              </div>
              <h3 class="text-sm sm:text-base font-semibold text-center" style="color: var(--card-prod-text);">Producción</h3>
              <p class="text-xs mt-1 opacity-80 hidden md:block text-center" style="color: var(--card-prod-text);">Gestión de Órdenes</p>
            </div>
            
            <!-- CARD 3: INVENTORY -->
            <div (click)="navigateTo('/cadena-suministro/inventario')" 
                 class="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-4 sm:p-6 flex flex-col items-center justify-center group border min-h-[160px] sm:h-48"
                 style="background-color: var(--card-inv-bg); border-color: var(--card-inv-border);">
              <div class="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ng-icon name="heroArchiveBoxSolid" class="w-6 h-6 sm:w-7 sm:h-7" style="color: var(--card-inv-text);"></ng-icon>
              </div>
              <h3 class="text-sm sm:text-base font-semibold text-center" style="color: var(--card-inv-text);">Inventario</h3>
              <p class="text-xs mt-1 opacity-80 hidden md:block text-center" style="color: var(--card-inv-text);">Existencias y MP</p>
            </div>

            <!-- CARD: MARKETPLACE -->
            <div (click)="openMarketplace()" 
                 class="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-4 sm:p-6 flex flex-col items-center justify-center group border min-h-[160px] sm:h-48"
                 style="background-color: var(--card-mkt-bg); border-color: var(--card-mkt-border);">
              <div class="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ng-icon name="heroBuildingStorefrontSolid" class="w-6 h-6 sm:w-7 sm:h-7" style="color: var(--card-mkt-text);"></ng-icon>
              </div>
              <h3 class="text-sm sm:text-base font-semibold text-center" style="color: var(--card-mkt-text);">Marketplace</h3>
              <p class="text-xs mt-1 opacity-80 hidden md:block text-center" style="color: var(--card-mkt-text);">Explorar Módulos</p>
            </div>

            <!-- CARD: PURCHASES (Compras) -->
            <div (click)="navigateTo('/cadena-suministro/compras')" 
                 class="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-4 sm:p-6 flex flex-col items-center justify-center group border min-h-[160px] sm:h-48"
                 style="background-color: var(--card-buy-bg); border-color: var(--card-buy-border);">
              <div class="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-cyan-900/50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ng-icon name="heroShoppingCartSolid" class="w-6 h-6 sm:w-7 sm:h-7" style="color: var(--card-buy-text);"></ng-icon>
              </div>
              <h3 class="text-sm sm:text-base font-semibold text-center" style="color: var(--card-buy-text);">Compras</h3>
              <p class="text-xs mt-1 opacity-80 hidden md:block text-center" style="color: var(--card-buy-text);">Abastecimiento</p>
            </div>

            <!-- CARD: POS (Punto de Venta) -->
            <div (click)="navigateTo('/pos')" 
                 class="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-4 sm:p-6 flex flex-col items-center justify-center group border min-h-[160px] sm:h-48"
                 style="background-color: var(--card-pos-bg); border-color: var(--card-pos-border);">
              <div class="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-orange-900/50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ng-icon name="heroCurrencyDollarSolid" class="w-6 h-6 sm:w-7 sm:h-7" style="color: var(--card-pos-text);"></ng-icon>
              </div>
              <h3 class="text-sm sm:text-base font-semibold text-center" style="color: var(--card-pos-text);">Punto de Venta</h3>
              <p class="text-xs mt-1 opacity-80 hidden md:block text-center" style="color: var(--card-pos-text);">Ventas Mostrador</p>
            </div>

            <!-- CARD: LOGISTICS (Movimientos) -->
            <div (click)="navigateTo('/cadena-suministro/movimientos')" 
                 class="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-4 sm:p-6 flex flex-col items-center justify-center group border min-h-[160px] sm:h-48 bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800">
              <div class="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ng-icon name="heroTruckSolid" class="w-6 h-6 sm:w-7 sm:h-7 text-purple-600 dark:text-purple-300"></ng-icon>
              </div>
              <h3 class="text-sm sm:text-base font-semibold text-purple-900 dark:text-purple-100 text-center">Logística</h3>
              <p class="text-xs mt-1 opacity-80 text-purple-600 dark:text-purple-300 hidden md:block text-center">Movimientos</p>
            </div>

            <!-- CARD: WHOLESALE (Mayoreo) -->
            <div (click)="navigateTo('/ventas/mayoreo')" 
                 class="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-4 sm:p-6 flex flex-col items-center justify-center group border min-h-[160px] sm:h-48 bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800">
              <div class="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-teal-900/50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ng-icon name="heroBriefcaseSolid" class="w-6 h-6 sm:w-7 sm:h-7 text-teal-600 dark:text-teal-300"></ng-icon>
              </div>
              <h3 class="text-sm sm:text-base font-semibold text-teal-900 dark:text-teal-100 text-center">Mayoreo</h3>
              <p class="text-xs mt-1 opacity-80 text-teal-600 dark:text-teal-300 hidden md:block text-center">Cotizaciones</p>
            </div>

            <!-- DYNAMIC MODULES -->
            <div *ngFor="let module of installedModules()" 
                 (click)="goToModule(module)"
                 [ngClass]="{
                   'opacity-60 cursor-not-allowed hover:shadow-md': !module.route_path,
                   'cursor-pointer hover:shadow-xl': module.route_path
                 }"
                 class="rounded-xl shadow-md transition-all duration-300 p-4 sm:p-6 flex flex-col items-center justify-center group border border-transparent min-h-[160px] sm:h-48 relative"
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
                    [name]="getSafeIcon(module.icon)" 
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
        (closeModal)="showMarketplace.set(false)"
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

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  installedModules = signal<Module[]>([]);
  isLoading = signal<boolean>(true);
  showMarketplace = signal<boolean>(false);

  // Signal derivado para el ID del Tenant
  currentTenantId = computed(() => this.sessionService.currentTenantId());

  constructor() {
    effect(() => {
      const tenantId = this.currentTenantId();
      if (tenantId) {
        this.loadInstalledModules(tenantId);
      }
    });

    // We need to ensure NgIconsModule is configured. Since we are in standalone, we passed it in imports map below. 
    // Just to be safe, I'm verifying the imports key in the decorator.
  }

  ngOnInit() {
    // La carga se maneja via effect, pero podemos dejar validaciones aquí
    if (!this.sessionService.currentTenant()) {
      // Si entramos y no hay tenant, tal vez recargar o redirigir
    }
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
    if (!module.route_path) return; // Prevent navigation if disabled

    // START HOTFIX: Manejo especial de rutas que pueden venir inconsistentes de la BD
    if (module.code === 'inventory' || module.code === 'scm-inventory') {
      this.router.navigate(['/cadena-suministro/inventario']);
      return;
    }
    // END HOTFIX

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

  changeCompany() {
    this.router.navigate(['/companies']);
  }

  logout() {
    this.sessionService.logout();
  }

  getSafeIcon(iconName: string | undefined): string {
    if (!iconName) return 'heroCubeSolid';

    // Fallback/Mapper if the DB is not yet updated or has old Lucide names
    if (iconName === 'settings') return 'heroCog6ToothSolid';
    if (iconName === 'factory') return 'heroBuildingOffice2Solid';
    if (iconName === 'package') return 'heroArchiveBoxSolid';
    if (iconName === 'store') return 'heroBuildingStorefrontSolid';
    if (iconName === 'edit-3') return 'heroPencilSquareSolid';
    if (iconName === 'users') return 'heroUsersSolid';
    if (iconName === 'search') return 'heroMagnifyingGlassSolid';
    if (iconName === 'plus') return 'heroPlusSolid';
    if (iconName === 'trash') return 'heroTrashSolid';
    if (iconName === 'home') return 'heroHomeSolid';
    if (iconName === 'shopping-cart') return 'heroShoppingCartSolid';
    if (iconName === 'user') return 'heroUserSolid';
    if (iconName === 'file-text') return 'heroDocumentTextSolid';
    if (iconName === 'truck') return 'heroTruckSolid';

    return iconName;
  }
}

