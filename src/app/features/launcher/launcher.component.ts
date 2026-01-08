import { Component, inject, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { SessionService } from '@core/services/session.service';
import { ModuleRepository } from '@core/repositories/module.repository';
import { Module } from '@core/models/module.model';
import { ThemeService } from '@core/services/theme.service';
import { ProductionMonitorService } from '@core/services/production-monitor.service';
import { MarketplaceModalComponent } from '../marketplace/marketplace-modal.component';
import { AssistantSphereComponent } from '../../shared/components/assistant-sphere/assistant-sphere.component';
import { APP_ICONS, getAppIcon } from '@core/constants/app-icons';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import {
  heroChartBarSolid,
  heroCheckCircleSolid,
  heroExclamationCircleSolid,
  heroAdjustmentsHorizontalSolid,
  heroSquares2x2Solid,
  heroListBulletSolid,
  heroSquaresPlusSolid,
  heroArrowUpRightSolid,
  heroPlusSolid,
  heroInboxSolid,
  heroCalculatorSolid,
  heroUsersSolid,
  heroArchiveBoxSolid,
  heroPresentationChartLineSolid,
  heroRocketLaunchSolid,
  heroSunSolid,
  heroMoonSolid,
  heroArrowRightOnRectangleSolid
} from '@ng-icons/heroicons/solid';


@Component({
  selector: 'app-launcher',
  standalone: true,
  imports: [
    CommonModule,
    MarketplaceModalComponent,
    AssistantSphereComponent,
    NgIconsModule
  ],
  viewProviders: [provideIcons({
    heroChartBarSolid,
    heroCheckCircleSolid,
    heroExclamationCircleSolid,
    heroAdjustmentsHorizontalSolid,
    heroSquares2x2Solid,
    heroListBulletSolid,
    heroSquaresPlusSolid,
    heroArrowUpRightSolid,
    heroPlusSolid,
    heroInboxSolid,
    heroCalculatorSolid,
    heroUsersSolid,
    heroArchiveBoxSolid,
    heroPresentationChartLineSolid,
    heroRocketLaunchSolid,
    heroSunSolid,
    heroMoonSolid,
    heroArrowRightOnRectangleSolid
  })],
  templateUrl: './launcher.component.html',
  styles: [`
    .animate-siac-in { animation: siac-fade-in-up 0.4s ease-out forwards; }
    @keyframes siac-fade-in-up { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class LauncherComponent implements OnInit {
  sessionService = inject(SessionService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private moduleRepo = inject(ModuleRepository);
  private monitorService = inject(ProductionMonitorService);

  public readonly ICONS = APP_ICONS;

  viewMode = signal<'GRID' | 'LIST' | 'GROUPED'>('GRID');
  showViewMenu = signal(false);
  pendingTasksCount = signal(3);
  searchQuery = signal(''); // Unificado a searchQuery

  installedModules = signal<Module[]>([]);
  isLoading = signal<boolean>(true);
  showMarketplace = signal<boolean>(false);
  selectedCategory = signal<string>('all');

  categories = computed(() => {
    const modules = this.installedModules();
    const cats = new Set(modules.map(m => m.category).filter(c => !!c));
    return Array.from(cats).sort();
  });

  filteredModules = computed(() => {
    const modules = this.installedModules();
    const category = this.selectedCategory();
    const search = this.searchQuery().toLowerCase();

    return modules.filter(m => {
      const matchSearch = !search ||
        m.name.toLowerCase().includes(search) ||
        m.description.toLowerCase().includes(search) ||
        m.code.toLowerCase().includes(search);

      const matchCat = category === 'all' || m.category === category;

      return matchSearch && matchCat;
    });
  });

  groupedByCategory = computed(() => {
    const modules = this.filteredModules();
    const groups: { [key: string]: Module[] } = {};

    modules.forEach(m => {
      const cat = m.category || 'OTROS';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });

    return Object.keys(groups).map(name => ({
      name,
      modules: groups[name]
    })).sort((a, b) => a.name.localeCompare(b.name));
  });

  currentCompanyId = computed(() => this.sessionService.currentCompanyId());

  constructor() {
    effect(() => {
      const tenantId = this.sessionService.currentTenantId();
      console.log('Launcher: Tenant context changed:', tenantId);
      if (tenantId) {
        this.loadInstalledModules(tenantId);
      } else {
        this.installedModules.set([]);
        this.isLoading.set(false);
      }
    });
  }

  onSearch(event: any) {
    const value = event.target.value;
    this.searchQuery.set(value);
  }

  getMaterialIcon(mode: string): string {
    switch (mode) {
      case 'GRID': return 'grid_view';
      case 'LIST': return 'list';
      case 'GROUPED': return 'category';
      default: return 'grid_view';
    }
  }

  getIconName(mod: Module): string {
    const icon = mod.icon?.toLowerCase() || '';
    if (icon.includes('calculate') || icon.includes('count')) return 'calculate';
    if (icon.includes('group') || icon.includes('user')) return 'groups';
    if (icon.includes('inventory') || icon.includes('box') || icon.includes('package')) return 'inventory_2';
    if (icon.includes('sales') || icon.includes('chart') || icon.includes('monitoring')) return 'monitoring';
    if (icon.includes('project') || icon.includes('rocket')) return 'rocket_launch';
    if (icon.includes('analytics') || icon.includes('insights')) return 'insights';
    if (icon.includes('payments') || icon.includes('money')) return 'payments';
    if (icon.includes('hub') || icon.includes('settings')) return 'hub';
    if (icon.includes('cloud')) return 'cloud_sync';
    if (icon.includes('store') || icon.includes('shopping')) return 'storefront';
    return 'apps';
  }

  changeViewMode(mode: any) {
    this.viewMode.set(mode);
    this.showViewMenu.set(false);
    localStorage.setItem('siac-launcher-view', mode);
  }

  getUserInitials(): string {
    const email = this.sessionService.user()?.email || 'U';
    return email.substring(0, 2).toUpperCase();
  }

  getUsername(): string {
    const email = this.sessionService.user()?.email;
    return email ? email.split('@')[0] : 'Usuario';
  }

  ngOnInit() {
    this.monitorService.startAutoMonitor();
    const savedView = localStorage.getItem('siac-launcher-view') as any;
    if (savedView) this.viewMode.set(savedView);
  }



  private notification = inject(NotificationService);

  async loadInstalledModules(tenantId: string) {
    try {
      this.isLoading.set(true);
      const modules = await this.moduleRepo.getInstalledModules(tenantId);
      this.installedModules.set(modules);
      console.log('Launcher: Loaded', modules.length, 'modules');
    } catch (error: any) {
      console.error('Error loading installed modules:', error);
      this.notification.error('Error al cargar sus aplicaciones: ' + (error.message || 'Error desconocido'));
    } finally {
      this.isLoading.set(false);
    }
  }

  goToSettings() {
    this.router.navigate(['/settings']);
  }

  goToModule(module: Module) {
    if (!module.route_path) return;
    this.router.navigate([module.route_path]);
  }

  goToModuleDefinition(module: Module, event: MouseEvent) {
    event.stopPropagation();
    this.router.navigate(['/modules/definition', module.id]);
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
