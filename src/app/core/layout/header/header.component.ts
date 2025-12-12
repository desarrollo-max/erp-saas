import { Component, inject, computed, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { ModuleRepository } from '@core/repositories/module.repository';
import { Module } from '@core/models/module.model';
import { NgIconsModule } from '@ng-icons/core';
import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconsModule],
  template: `
    <header class="bg-white border-b border-gray-200 shadow-sm z-50 fixed top-0 w-full h-16 transition-all duration-300">
      <div class="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        <!-- LEFT: Logo & Modules Menu -->
        <div class="flex items-center gap-4">
          <!-- Logo -->
          <div (click)="goLauncher()" class="flex items-center gap-2 cursor-pointer group">
            <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:bg-indigo-700 transition">
              E
            </div>
            <span class="font-bold text-xl tracking-tight text-gray-900 group-hover:text-indigo-600 transition">ERP<span class="text-indigo-600">SaaS</span></span>
          </div>

          <div class="h-6 w-px bg-gray-300 mx-2"></div>

          <!-- Modules Dropdown Trigger -->
          <div class="relative" #menuContainer>
            <button 
              (click)="toggleMenu()"
              class="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              [class.bg-gray-100]="isMenuOpen()">
              <ng-icon name="heroSquares2x2Solid" class="w-5 h-5 text-gray-500"></ng-icon>
              <span>Módulos</span>
              <ng-icon 
                name="heroChevronDownSolid" 
                class="w-4 h-4 text-gray-400 transition-transform duration-200"
                [class.rotate-180]="isMenuOpen()">
              </ng-icon>
            </button>

            <!-- Dropdown Menu -->
            <div *ngIf="isMenuOpen()" 
                 class="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 py-2 animate-in fade-in slide-in-from-top-2 origin-top-left overflow-hidden z-[60]">
              
              <div class="px-4 py-2 border-b border-gray-100 bg-gray-50">
                <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Navegación Rápida</span>
              </div>

              <div class="max-h-[calc(100vh-200px)] overflow-y-auto py-2">
                <!-- Group by Category (Simplified for now just list) -->
                <!-- TODO: Implement grouping if needed, for now flat list is fine or grouped by backend -->
                <ng-container *ngFor="let module of modules()">
                  <a *ngIf="module.route_path"
                     [routerLink]="module.route_path"
                     (click)="closeMenu()"
                     class="group flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-colors border-l-4 border-transparent hover:border-indigo-500">
                    <div 
                      class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      [style.backgroundColor]="(module.color || '#6366f1') + '20'"
                      [style.color]="module.color || '#6366f1'">
                      <ng-icon [name]="getSafeIcon(module.icon)" class="w-5 h-5"></ng-icon>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900 group-hover:text-indigo-700">{{ module.name }}</p>
                      <p class="text-xs text-gray-500 truncate">{{ module.description }}</p>
                    </div>
                  </a>
                </ng-container>

                <div *ngIf="modules().length === 0" class="px-4 py-4 text-center text-sm text-gray-500">
                  No hay módulos disponibles.
                </div>
              </div>

              <div class="border-t border-gray-100 p-2 bg-gray-50">
                <a routerLink="/launcher" (click)="closeMenu()" class="block w-full text-center px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors">
                  Ver Todo
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT: User Profile & Context -->
        <div class="flex items-center gap-4">
          <!-- Context Info -->
          <div class="hidden md:flex flex-col items-end mr-2">
            <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ session.currentTenant()?.name || '' }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400" *ngIf="session.currentUserRole()">{{ session.currentUserRole() | titlecase }}</span>
          </div>
          
          <!-- Theme Switcher -->
          <button (click)="toggleTheme()" class="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-indigo-500">
             <ng-icon [name]="themeService.isDark() ? 'heroSunSolid' : 'heroMoonSolid'" class="w-5 h-5"></ng-icon>
          </button>

          <div class="h-8 w-px bg-gray-200 hidden md:block"></div>

          <!-- User Avatar -->
          <button (click)="goSettings()" class="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
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
  themeService = inject(ThemeService); // Made public for template access
  private router = inject(Router);
  private moduleRepo = inject(ModuleRepository);

  // State
  isMenuOpen = signal(false);
  modules = signal<Module[]>([]);

  // Refs
  // ViewChild('menuContainer') not strictly needed with simple click outside logic or backdrop, 
  // but HostListener is cleaner for quick implementation.

  constructor() {
    this.loadModules();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Simple check: if click is NOT inside a .relative container with the menu logic
    //Ideally use a template ref check, but strictly checking simplistic classes for now
    if (this.isMenuOpen() && !target.closest('.relative')) {
      // this.closeMenu(); // Too aggressive without proper ref, user HostListener properly with ElementRef if needed
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
        // Filter only those with routes? Or show all?
        // Let's show all but visual cues for those without routes are handled in template
        this.modules.set(mods.filter(m => m.route_path));

        // Manual Additions for Hardcoded Routes if they aren't in DB yet or for dev convenience
        // (Optional: Merge with static list if needed)
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

  getSafeIcon(iconName: string | undefined): string {
    if (!iconName) return 'heroCubeSolid';
    if (iconName === 'edit-3') return 'heroPencilSquareSolid';
    if (iconName.startsWith('hero')) return iconName;

    // Mapping for old Lucide names if they still appear
    if (iconName === 'grid') return 'heroSquares2x2Solid';
    if (iconName === 'settings') return 'heroCog6ToothSolid';
    if (iconName === 'users') return 'heroUsersSolid';

    return 'heroCubeSolid';
  }
}

