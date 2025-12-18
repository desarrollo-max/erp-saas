import { Component, inject, computed, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { ModuleRepository } from '@core/repositories/module.repository';
import { Module } from '@core/models/module.model';
import { NgIconsModule } from '@ng-icons/core';
import { ThemeService } from '@core/services/theme.service';
import { APP_ICONS, getAppIcon } from '@core/constants/app-icons';
import { GlobalSearchModalComponent } from '../global-search-modal/global-search-modal.component';

interface ModuleGroup {
  category: string;
  modules: Module[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconsModule, GlobalSearchModalComponent],
  template: `
    <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm z-50 fixed top-0 w-full h-16 transition-colors duration-300">
      <div class="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        <!-- LEFT: Logo & Modules Menu -->
        <div class="flex items-center gap-2 sm:gap-4">
          <div (click)="goLauncher()" class="flex items-center gap-2 cursor-pointer group max-w-[150px] sm:max-w-none">
            <ng-container *ngIf="session.currentCompany()?.logo_url || session.currentTenant()?.logo_url; else defaultLogo">
              <img [src]="session.currentCompany()?.logo_url || session.currentTenant()?.logo_url" alt="Company Logo" class="w-8 h-8 rounded-lg object-cover flex-shrink-0 bg-white">
            </ng-container>
            <ng-template #defaultLogo>
              <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:bg-indigo-700 transition flex-shrink-0">
                {{ getCompanyInitial() }}
              </div>
            </ng-template>
            <span class="font-bold text-lg sm:text-xl tracking-tight text-gray-900 dark:text-white group-hover:text-indigo-500 transition truncate block">
              {{ session.currentCompany()?.name || session.currentTenant()?.name || 'ERP SaaS' }}
            </span>
          </div>

          <div class="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1 sm:mx-2 hidden sm:block"></div>

          <!-- Modules Dropdown Trigger -->
          <div class="relative" #menuContainer id="header-modules-menu">
            <button 
              (click)="toggleMenu()"
              class="flex items-center gap-2 p-3 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              [class.bg-gray-100]="isMenuOpen()"
              [class.dark:bg-gray-800]="isMenuOpen()">
              <ng-icon [name]="ICONS.menu" class="w-6 h-6 text-gray-500 dark:text-gray-400"></ng-icon>
              <span class="hidden sm:inline">Módulos</span>
              <ng-icon 
                [name]="ICONS.dropdown" 
                class="w-4 h-4 text-gray-400 transition-transform duration-200 hidden sm:block"
                [class.rotate-180]="isMenuOpen()">
              </ng-icon>
            </button>

            <!-- Dropdown Menu (Mobile Drawer / Desktop Dropdown) -->
            <div *ngIf="isMenuOpen()" 
                 class="fixed inset-x-0 top-16 bottom-0 bg-white dark:bg-gray-800 z-[60] overflow-y-auto lg:absolute lg:inset-auto lg:top-full lg:left-0 lg:mt-2 lg:w-80 lg:rounded-xl lg:shadow-2xl lg:ring-1 lg:ring-black lg:ring-opacity-5 lg:py-2 lg:overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-left border dark:border-gray-700">
              
              <div class="lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto w-full">
                <ng-container *ngFor="let group of groupedModules()">
                  <div class="px-4 py-3 sm:py-2 bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-700 first:border-t-0 sticky top-0 z-10">
                    <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ group.category }}</span>
                  </div>
                  
                  <div class="py-1">
                    <a *ngFor="let module of group.modules"
                       [routerLink]="module.route_path"
                       (click)="closeMenu()"
                       class="group flex items-center gap-4 px-6 py-4 lg:px-4 lg:py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors border-l-4 border-transparent hover:border-indigo-500 cursor-pointer">
                      <div 
                        class="flex-shrink-0 w-10 h-10 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center transition-colors"
                        [style.backgroundColor]="(module.color || '#6366f1') + '20'"
                        [style.color]="module.color || '#6366f1'">
                        <ng-icon [name]="resolveIcon(module.icon)" class="w-6 h-6 lg:w-5 lg:h-5"></ng-icon>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-base lg:text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 truncate">{{ module.name }}</p>
                        <p class="text-sm lg:text-xs text-gray-500 dark:text-gray-400 truncate">{{ module.description }}</p>
                      </div>
                    </a>
                  </div>
                </ng-container>

                <div *ngIf="groupedModules().length === 0" class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  <ng-icon [name]="ICONS.empty" class="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600"></ng-icon>
                  No hay módulos disponibles.
                </div>
              </div>

              <div class="border-t border-gray-100 dark:border-gray-700 p-4 lg:p-2 bg-gray-50 dark:bg-gray-900">
                <a routerLink="/launcher" (click)="closeMenu()" class="block w-full text-center px-4 py-3 lg:py-2 text-lg lg:text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-colors">
                  Ver Dashboard Principal
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: User Profile & Context -->
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- SEARCH TRIGGER -->
          <button (click)="openSearch()" class="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none transition-colors">
            <span class="sr-only">Buscar</span>
            <ng-icon name="heroMagnifyingGlassSolid" class="h-6 w-6"></ng-icon>
          </button>

          <!-- Context Info (Role) -->
          <div class="hidden md:flex flex-col items-end mr-2">
             <span class="text-xs text-gray-500 dark:text-gray-400 font-medium" *ngIf="session.currentUserRole()">
               {{ session.currentUserRole() | titlecase }}
             </span>
          </div>
          
          <!-- Theme Switcher -->
          <button (click)="toggleTheme()" id="header-theme-toggle" class="p-3 lg:p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500">
             <ng-icon [name]="themeService.isDark() ? ICONS.themeSun : ICONS.themeMoon" class="w-6 h-6 lg:w-5 lg:h-5"></ng-icon>
          </button>

          <div class="h-8 w-px bg-gray-200 dark:bg-gray-700 hidden md:block"></div>

          <!-- User Avatar -->
          <button (click)="goSettings()" class="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 group">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm group-hover:shadow-md transition-shadow">
              {{ getUserInitials() }}
            </div>
          </button>
        </div>
      </div>
    </header>
    <!-- Spacer to prevent content overlap -->
    <div class="h-16"></div>

    <!-- GLOBAL SEARCH MODAL -->
    <ng-container *ngIf="isSearchOpen()">
        <app-global-search-modal (closed)="isSearchOpen.set(false)"></app-global-search-modal>
    </ng-container>
  `,
  styles: []
})
export class HeaderComponent {
  session = inject(SessionService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private moduleRepo = inject(ModuleRepository);

  public readonly ICONS = APP_ICONS;

  // State
  isMenuOpen = signal(false);
  isSearchOpen = signal(false);
  modules = signal<Module[]>([]);
  groupedModules = computed(() => {
    const modules = this.modules();
    const groups: { [key: string]: Module[] } = {};

    // Group by category
    modules.forEach(m => {
      const cat = m.category || 'General';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(m);
    });

    // Convert to array and sort
    return Object.keys(groups).sort().map(category => ({
      category,
      modules: groups[category].sort((a, b) => a.sort_order - b.sort_order)
    }));
  });

  constructor() {
    this.loadModules();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (this.isMenuOpen() && !target.closest('.relative')) {
      this.closeMenu();
    }
  }

  toggleMenu() {
    this.isMenuOpen.update(v => !v);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  openSearch() {
    this.isSearchOpen.set(true);
  }

  async loadModules() {
    const tenantId = this.session.currentTenantId();
    if (tenantId) {
      try {
        const mods = await this.moduleRepo.getInstalledModules(tenantId);
        // Only show modules with a route path
        this.modules.set(mods.filter(m => m.route_path));
      } catch (err) {
        console.error('Error loading modules for menu', err);
      }
    }
  }

  goLauncher() {
    this.router.navigate(['/launcher']);
  }

  goSettings() {
    this.router.navigate(['/settings']);
  }

  getUserInitials(): string {
    const email = this.session.user()?.email || '';
    return email.substring(0, 2).toUpperCase();
  }

  getCompanyInitial(): string {
    const name = this.session.currentCompany()?.name || this.session.currentTenant()?.name || 'E';
    return name.charAt(0).toUpperCase();
  }

  resolveIcon(iconName: string | undefined | null): string {
    return getAppIcon(iconName);
  }
}