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
import { provideIcons } from '@ng-icons/core';
import { heroSunSolid, heroMoonSolid } from '@ng-icons/heroicons/solid';
import { NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';





interface ModuleGroup {
  category: string;
  modules: Module[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIconsModule, GlobalSearchModalComponent],
  providers: [provideIcons({ heroSunSolid, heroMoonSolid })],
  templateUrl: './header.component.html',
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
    this.setupAutoTheme();
  }

  private setupAutoTheme() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      this.updateThemeFromRoute();
    });
  }

  private updateThemeFromRoute() {
    const currentUrl = this.router.url;
    const modules = this.modules();

    // Buscar el módulo cuya ruta coincida con el inicio de la URL actual
    const activeModule = modules.find(m => m.route_path && currentUrl.startsWith(m.route_path));

    if (activeModule) {
      this.themeService.applyThemeByColor(activeModule.color);
    } else if (currentUrl === '/launcher' || currentUrl === '/') {
      this.themeService.applyThemeByColor('#135bec'); // Azul por defecto para el launcher
    }
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

  cycleThemeColor() {
    this.themeService.cycleColorTheme();
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
        this.updateThemeFromRoute(); // Actualizar tema después de cargar módulos
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
