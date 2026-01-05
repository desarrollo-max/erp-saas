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
  template: `
    <div class="bg-[#101622] font-display min-h-screen flex flex-col overflow-x-hidden text-white transition-colors duration-200">
      <!-- Top Navigation -->
      <header class="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-[#2d3648] bg-[#111318] px-4 py-3 sm:px-10 h-16">
        <div class="flex items-center gap-4 sm:gap-8">
          <div class="flex items-center gap-3 text-white group cursor-pointer" (click)="loadInstalledModules(sessionService.currentTenantId() || '')">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
              <span class="material-symbols-outlined text-[24px]">grid_view</span>
            </div>
            <h2 class="text-white text-xl font-bold leading-tight tracking-tight hidden sm:block">SIAC ERP</h2>
          </div>
          <!-- Search Bar -->
          <div class="hidden md:flex flex-col min-w-40 h-10 max-w-96 w-80">
            <div class="flex w-full flex-1 items-stretch rounded-lg h-full border border-[#2d3648] focus-within:ring-2 focus-within:ring-primary/50 bg-[#1c212c] transition-all">
              <div class="text-slate-400 flex items-center justify-center pl-3">
                <span class="material-symbols-outlined text-[20px]">search</span>
              </div>
              <input class="w-full bg-transparent border-none text-sm font-medium text-white placeholder:text-slate-500 focus:outline-0 focus:ring-0 px-3"
                     placeholder="Buscar módulo o función..."
                     (input)="onSearch($event)"/>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <button class="relative flex h-10 w-10 items-center justify-center rounded-lg bg-[#1c212c] hover:bg-slate-800 transition-all text-slate-300 border border-[#2d3648]">
            <span class="material-symbols-outlined text-[20px]">notifications</span>
            <span class="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#1c212c]"></span>
          </button>
          <div class="flex h-10 items-center gap-3 rounded-lg bg-[#1c212c] pl-2 pr-4 border border-[#2d3648]">
            <div class="h-8 w-8 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
              {{ getUserInitials() }}
            </div>
            <div class="hidden lg:flex flex-col items-start leading-none">
              <p class="text-xs font-bold text-white">{{ getUsername() }}</p>
              <p class="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">Administrador</p>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-grow flex flex-col">
        <div class="max-w-[1400px] mx-auto w-full px-4 sm:px-10 py-8">
          
          <!-- Welcome Banner Premium -->
          <div class="mb-12 grid grid-cols-1 lg:grid-cols-4 gap-6 animate-siac-in">
            <div class="col-span-1 lg:col-span-2 flex flex-col justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-700 p-10 shadow-2xl shadow-primary/20 relative overflow-hidden group">
              <div class="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700">
                <span class="material-symbols-outlined text-[180px]">rocket_launch</span>
              </div>
              <h1 class="text-3xl font-black text-white mb-3 tracking-tighter">¡Hola, {{ getUsername() }}!</h1>
              <p class="text-blue-100 text-lg mb-6 max-w-md">Bienvenido a SIAC ERP. Tienes el control total de tu organización en una sola plataforma premium.</p>
              <div class="flex gap-4">
                <span class="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md border border-white/20">
                  <span class="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                  SISTEMA ACTIVO
                </span>
              </div>
            </div>

            <!-- Stats Cards Refined -->
            <div class="siac-card p-8 flex flex-col justify-between group hover:border-primary transition-all">
              <div class="flex justify-between items-start">
                <div class="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <span class="material-symbols-outlined text-[28px]">verified_user</span>
                </div>
                <span class="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded">Ok</span>
              </div>
              <div>
                <p class="text-slate-400 text-sm font-bold uppercase tracking-tighter">Estado Saludable</p>
                <h3 class="text-2xl font-black text-white mt-1">Sincronizado</h3>
              </div>
            </div>

            <div class="siac-card p-8 flex flex-col justify-between group hover:border-orange-500 transition-all">
              <div class="flex justify-between items-start">
                <div class="p-3 rounded-xl bg-orange-500/10 text-orange-500">
                  <span class="material-symbols-outlined text-[28px]">assignment</span>
                </div>
                <span class="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2 py-1 rounded">Alert</span>
              </div>
              <div>
                <p class="text-slate-400 text-sm font-bold uppercase tracking-tighter">Pendientes</p>
                <h3 class="text-2xl font-black text-white mt-1">{{ pendingTasksCount() }} tareas</h3>
              </div>
            </div>
          </div>

          <!-- Apps Section -->
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center gap-3">
               <h2 class="text-2xl font-black text-white tracking-tighter uppercase">Mis Herramientas</h2>
               <span class="px-2 py-1 bg-[#1c212c] rounded text-[10px] font-bold text-slate-500">{{ filteredModules().length }}</span>
            </div>
            <div class="flex gap-2">
              <button class="p-2 rounded-lg bg-[#1c212c] text-slate-400 hover:text-primary transition-colors border border-[#2d3648]" (click)="showViewMenu.set(!showViewMenu())">
                <span class="material-symbols-outlined text-[20px]">sort</span>
              </button>
            </div>
          </div>

          <!-- APPS GRID -->
          <div class="w-full">
            <div *ngIf="isLoading()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div *ngFor="let i of [1,2,3,4]" class="h-64 rounded-2xl bg-[#1c212c] border border-[#2d3648] animate-pulse"></div>
            </div>

            <div *ngIf="!isLoading()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-siac-in">
              <!-- INSTALLED MODULES RENDERER -->
              <a *ngFor="let mod of filteredModules()" 
                 (click)="goToModule(mod)"
                 class="group relative flex flex-col bg-[#1c212c] rounded-2xl border border-[#2d3648] p-7 shadow-sm hover:shadow-2xl hover:border-primary hover:-translate-y-2 transition-all duration-500 cursor-pointer h-full overflow-hidden">
                
                <div class="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                   <span class="material-symbols-outlined text-[100px]">{{ getIconName(mod) }}</span>
                </div>

                <div class="flex items-center justify-between mb-6">
                  <div class="flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-110 shadow-lg"
                       [style.background-color]="(mod.color || '#135bec') + '15'"
                       [style.color]="mod.color || '#135bec'">
                    <span class="material-symbols-outlined text-[32px]">{{ getIconName(mod) }}</span>
                  </div>
                  <span class="material-symbols-outlined text-slate-700 group-hover:text-primary transition-colors">arrow_outward</span>
                </div>

                <div class="relative z-10">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-black text-white tracking-tight group-hover:text-primary transition-colors">{{ mod.name }}</h3>
                    <button 
                      (click)="goToModuleDefinition(mod, $event)"
                      class="p-1.5 rounded-lg bg-slate-800/50 text-slate-500 hover:text-white hover:bg-primary transition-all"
                      title="Detalles del módulo">
                      <span class="material-symbols-outlined text-[18px]">info</span>
                    </button>
                  </div>
                  <p class="text-sm text-slate-400 line-clamp-2 leading-relaxed">{{ mod.description }}</p>
                </div>

                <div class="mt-8 pt-5 border-t border-slate-800/50 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                     <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                     <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Activo</span>
                  </div>
                  <span class="text-[10px] font-black text-slate-700 group-hover:text-primary transition-colors uppercase tracking-widest">{{ mod.code }}</span>
                </div>
              </a>

              <!-- CTA: ADD MODULES -->
              <div (click)="openMarketplace()" class="group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2d3648] bg-transparent p-8 hover:border-primary transition-all duration-300 cursor-pointer h-full min-h-[260px]">
                <div class="flex h-16 w-16 items-center justify-center rounded-full bg-[#2d3648] text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-500 group-hover:scale-110 shadow-xl shadow-transparent group-hover:shadow-primary/20">
                  <span class="material-symbols-outlined text-[36px]">add</span>
                </div>
                <div class="text-center mt-6">
                  <h3 class="text-lg font-black text-white tracking-tight">Marketplace</h3>
                  <p class="text-sm text-slate-400 mt-1">Expandir mi sistema</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Marketplace Teaser -->
          <div class="mt-20 relative overflow-hidden rounded-3xl bg-[#0d111a] border border-slate-800 shadow-2xl animate-siac-in">
            <div class="absolute inset-0 opacity-20" style="background-image: radial-gradient(#135bec 1px, transparent 1px); background-size: 32px 32px;"></div>
            <div class="relative flex flex-col md:flex-row items-center justify-between p-12 md:p-16 gap-10">
              <div class="flex flex-col gap-6 max-w-2xl">
                <div class="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-[10px] font-black tracking-widest text-primary uppercase">
                  <span class="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                  Ecosistema SIAC
                </div>
                <h2 class="text-4xl md:text-5xl font-black text-white tracking-tighter">Potencia tu organización al máximo</h2>
                <p class="text-slate-400 text-lg leading-relaxed">Accede a docenas de integraciones y módulos inteligentes diseñados para escalar tu negocio con tecnología de punta.</p>
                <button (click)="openMarketplace()" class="flex items-center justify-center gap-3 w-fit rounded-xl bg-primary hover:bg-blue-600 text-white font-black py-4 px-8 transition-all active:scale-95 shadow-2xl">
                  <span class="material-symbols-outlined">storefront</span>
                  Explorar Marketplace
                </button>
              </div>
              
              <div class="relative w-full md:w-1/3 aspect-square flex items-center justify-center">
                <div class="absolute inset-0 bg-primary/20 blur-[100px] rounded-full"></div>
                <div class="relative grid grid-cols-2 gap-5 rotate-12 transform">
                  <div class="h-28 w-28 rounded-2xl bg-slate-900/80 border border-slate-700 p-6 shadow-2xl flex items-center justify-center backdrop-blur-xl">
                    <span class="material-symbols-outlined text-5xl text-blue-400">analytics</span>
                  </div>
                  <div class="h-28 w-28 rounded-2xl bg-slate-900/80 border border-slate-700 p-6 shadow-2xl flex items-center justify-center translate-y-6 backdrop-blur-xl">
                    <span class="material-symbols-outlined text-5xl text-emerald-400">payments</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="mt-auto border-t border-[#2d3648] bg-[#111318] py-12">
        <div class="max-w-[1400px] mx-auto w-full px-4 sm:px-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div class="flex flex-col items-center md:items-start gap-4">
            <div class="flex items-center gap-2 text-primary font-black uppercase tracking-widest text-lg">
              <span class="material-symbols-outlined">grid_view</span>
              SIAC ERP
            </div>
            <p class="text-slate-400 text-sm">© 2024 SIAC ERP Systems Group.</p>
          </div>
          <div class="flex gap-10 text-xs font-black uppercase tracking-widest text-slate-400">
            <a class="hover:text-primary transition-colors cursor-pointer">Soporte</a>
            <a class="hover:text-primary transition-colors cursor-pointer">Documentación</a>
          </div>
        </div>
      </footer>
      
      <app-marketplace-modal 
        *ngIf="showMarketplace()" 
        [installedIds]="getInstalledModuleIds()"
        (closeModal)="showMarketplace.set(false)"
        (moduleUninstalled)="onModuleUninstalled($event)"
        (moduleInstalled)="onModuleInstalled($event)">
      </app-marketplace-modal>

      <app-assistant-sphere></app-assistant-sphere>
    </div>
  `,
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
