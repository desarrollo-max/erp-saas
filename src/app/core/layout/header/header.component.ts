import { Component, inject, computed, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { ModuleRepository } from '@core/repositories/module.repository';
import { Module } from '@core/models/module.model';
import { NgIconsModule } from '@ng-icons/core';
import { ThemeService } from '@core/services/theme.service';

interface ModuleGroup {
  category: string;
  modules: Module[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconsModule],
  template: `
    <header class="bg-white border-b border-gray-200 shadow-sm z-50 fixed top-0 w-full h-16 transition-all duration-300">
      <div class="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        <!-- LEFT: Logo & Modules Menu -->
        <div class="flex items-center gap-2 sm:gap-4">
          <div (click)="goLauncher()" class="flex items-center gap-2 cursor-pointer group max-w-[200px] sm:max-w-none">
            <ng-container *ngIf="session.currentCompany()?.logo_url || session.currentTenant()?.logo_url; else defaultLogo">
              <img [src]="session.currentCompany()?.logo_url || session.currentTenant()?.logo_url" alt="Company Logo" class="w-8 h-8 rounded-lg object-cover flex-shrink-0">
            </ng-container>
            <ng-template #defaultLogo>
              <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:bg-indigo-700 transition flex-shrink-0">
                {{ getCompanyInitial() }}
              </div>
            </ng-template>
            <span class="font-bold text-lg sm:text-xl tracking-tight text-gray-900 group-hover:text-indigo-600 transition truncate block">
              {{ session.currentCompany()?.name || session.currentTenant()?.name || 'ERP SaaS' }}
            </span>
          </div>

          <div class="h-6 w-px bg-gray-300 mx-1 sm:mx-2 hidden sm:block"></div>

          <!-- Modules Dropdown Trigger -->
          <div class="relative" #menuContainer>
            <button 
              (click)="toggleMenu()"
              class="flex items-center gap-2 p-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              [class.bg-gray-100]="isMenuOpen()">
              <ng-icon name="heroSquares2x2Solid" class="w-6 h-6 text-gray-500"></ng-icon>
              <span class="hidden sm:inline">Módulos</span>
              <ng-icon 
                name="heroChevronDownSolid" 
                class="w-4 h-4 text-gray-400 transition-transform duration-200 hidden sm:block"
                [class.rotate-180]="isMenuOpen()">
              </ng-icon>
            </button>

            <!-- Dropdown Menu (Mobile Drawer / Desktop Dropdown) -->
            <div *ngIf="isMenuOpen()" 
                 class="fixed inset-x-0 top-16 bottom-0 bg-white z-[60] overflow-y-auto lg:absolute lg:inset-auto lg:top-full lg:left-0 lg:mt-2 lg:w-80 lg:rounded-xl lg:shadow-2xl lg:ring-1 lg:ring-black lg:ring-opacity-5 lg:py-2 lg:overflow-hidden animate-in fade-in slide-in-from-top-2 origin-top-left">
              
              <div class="lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto w-full">
                <ng-container *ngFor="let group of groupedModules()">
                  <div class="px-4 py-3 sm:py-2 bg-gray-50 border-y border-gray-100 first:border-t-0 sticky top-0 z-10">
                    <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ group.category }}</span>
                  </div>
                  
                  <div class="py-1">
                    <a *ngFor="let module of group.modules"
                       [routerLink]="module.route_path"
                       (click)="closeMenu()"
                       class="group flex items-center gap-4 px-6 py-4 lg:px-4 lg:py-3 hover:bg-indigo-50 transition-colors border-l-4 border-transparent hover:border-indigo-500 cursor-pointer">
                      <div 
                        class="flex-shrink-0 w-10 h-10 lg:w-8 lg:h-8 rounded-lg flex items-center justify-center transition-colors"
                        [style.backgroundColor]="(module.color || '#6366f1') + '20'"
                        [style.color]="module.color || '#6366f1'">
                        <ng-icon [name]="getSafeIcon(module.icon)" class="w-6 h-6 lg:w-5 lg:h-5"></ng-icon>
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-base lg:text-sm font-medium text-gray-900 group-hover:text-indigo-700 truncate">{{ module.name }}</p>
                        <p class="text-sm lg:text-xs text-gray-500 truncate">{{ module.description }}</p>
                      </div>
                    </a>
                  </div>
                </ng-container>

                <div *ngIf="groupedModules().length === 0" class="px-4 py-8 text-center text-sm text-gray-500">
                  <ng-icon name="heroCubeTransparent" class="w-8 h-8 mx-auto mb-2 text-gray-300"></ng-icon>
                  No hay módulos disponibles.
                </div>
              </div>

              <div class="border-t border-gray-100 p-4 lg:p-2 bg-gray-50">
                <a routerLink="/launcher" (click)="closeMenu()" class="block w-full text-center px-4 py-3 lg:py-2 text-base lg:text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors">
                  Ver Dashboard Principal
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: User Profile & Context -->
        <div class="flex items-center gap-2 sm:gap-4">
          <!-- Context Info (Role) -->
          <div class="hidden md:flex flex-col items-end mr-2">
             <span class="text-xs text-gray-500 dark:text-gray-400 font-medium" *ngIf="session.currentUserRole()">
               {{ session.currentUserRole() | titlecase }}
             </span>
          </div>
          
          <!-- Theme Switcher -->
          <button (click)="toggleTheme()" class="p-3 lg:p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500">
             <ng-icon [name]="themeService.isDark() ? 'heroSunSolid' : 'heroMoonSolid'" class="w-6 h-6 lg:w-5 lg:h-5"></ng-icon>
          </button>

          <div class="h-8 w-px bg-gray-200 hidden md:block"></div>

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
  `,
  styles: []
})
export class HeaderComponent {
  session = inject(SessionService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private moduleRepo = inject(ModuleRepository);

  // State
  isMenuOpen = signal(false);
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

  getSafeIcon(iconName: string | undefined | null): string {
    if (!iconName) return 'heroCubeSolid';
    if (iconName === 'edit-3') return 'heroPencilSquareSolid';
    if (iconName.startsWith('hero')) return iconName;

    // Mapping for old Lucide names if they still appear
    if (iconName === 'grid') return 'heroSquares2x2Solid';
    if (iconName === 'settings') return 'heroCog6ToothSolid';
    if (iconName === 'users') return 'heroUsersSolid';
    if (iconName === 'package') return 'heroArchiveBoxSolid';
    if (iconName === 'shopping-cart') return 'heroShoppingCartSolid';
    if (iconName === 'file-text') return 'heroDocumentTextSolid';
    if (iconName === 'bar-chart-2') return 'heroChartBarSolid';

    return 'heroCubeSolid';
  }
}