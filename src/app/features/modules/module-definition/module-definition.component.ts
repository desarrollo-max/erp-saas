import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ModuleRepository } from '@core/repositories/module.repository';
import { Module } from '@core/models/module.model';
import { NotificationService } from '@core/services/notification.service';
import { SessionService } from '@core/services/session.service';
import { ThemeService } from '@core/services/theme.service';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
    selector: 'app-module-definition',
    standalone: true,
    imports: [CommonModule, RouterModule, NgIconsModule],
    viewProviders: [provideIcons(heroIcons)],
    template: `
    <div class="min-h-screen bg-[#111022] text-white font-display flex flex-col overflow-x-hidden">
      
      <!-- Main Content Container -->
      <main *ngIf="module()" class="flex-1 w-full max-w-[1200px] mx-auto p-6 lg:p-10 flex flex-col gap-8 animate-siac-in">
        
        <!-- Breadcrumbs -->
        <nav aria-label="Breadcrumb" class="flex flex-wrap items-center gap-2 text-sm">
          <a routerLink="/launcher" class="text-[#9d9db9] hover:text-primary transition-colors flex items-center gap-1">
            <span class="material-symbols-outlined !text-[18px]">home</span>
            Inicio
          </a>
          <span class="text-[#9d9db9]">/</span>
          <span class="text-[#9d9db9]">Módulos</span>
          <span class="text-[#9d9db9]">/</span>
          <span class="text-[#9d9db9]">{{ module()?.category }}</span>
          <span class="text-[#9d9db9]">/</span>
          <span class="text-white font-medium">{{ module()?.name }}</span>
        </nav>

        <!-- Module Header Hero -->
        <section class="bg-[#181825] border border-[#282839] rounded-xl p-6 lg:p-8 shadow-lg relative overflow-hidden group">
          <div class="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700"></div>
          
          <div class="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:items-start relative z-10">
            <!-- Icon Box -->
            <div class="flex-shrink-0">
              <div class="size-24 lg:size-32 rounded-2xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center shadow-lg shadow-primary/20 text-white">
                <span class="material-symbols-outlined !text-[48px] lg:!text-[64px]">{{ getIconName() }}</span>
              </div>
            </div>

            <!-- Title & Description -->
            <div class="flex-1 flex flex-col gap-3">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="text-2xl lg:text-3xl font-bold text-white tracking-tight">{{ module()?.name }}</h1>
                <span class="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wide">
                  {{ module()?.is_available ? 'Disponible' : 'Próximamente' }}
                </span>
                <span class="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold uppercase tracking-wide">
                  {{ module()?.version || 'v1.0.0-stable' }}
                </span>
              </div>
              <p class="text-[#9d9db9] text-lg leading-relaxed max-w-3xl">
                {{ module()?.description }}
              </p>
              <div class="flex flex-wrap gap-4 mt-2">
                <div class="flex items-center gap-2 text-sm text-[#9d9db9]">
                  <span class="material-symbols-outlined text-primary !text-[18px]">category</span>
                  <span class="font-medium text-white">{{ module()?.category }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-[#9d9db9]">
                  <span class="material-symbols-outlined text-primary !text-[18px]">verified_user</span>
                  <span>Desarrollado por SIAC</span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[200px] mt-4 lg:mt-0">
              <button 
                (click)="toggleModule()"
                [class]="isInstalled() ? 'bg-[#282839] hover:bg-rose-900/20 text-white hover:text-rose-400' : 'bg-primary hover:bg-primary/90 text-white'"
                class="flex items-center justify-center gap-2 font-semibold py-2.5 px-4 rounded-lg transition-all shadow-lg border border-transparent">
                <span class="material-symbols-outlined !text-[20px]">{{ isInstalled() ? 'delete' : 'download' }}</span>
                {{ isInstalled() ? 'Desinstalar' : 'Instalar Módulo' }}
              </button>
              <button class="flex items-center justify-center gap-2 bg-[#282839] hover:bg-[#32324a] text-white font-medium py-2.5 px-4 rounded-lg border border-[#282839] transition-colors">
                <span class="material-symbols-outlined !text-[20px]">description</span>
                Documentación
              </button>
            </div>
          </div>
        </section>

        <!-- Tab Navigation -->
        <div class="border-b border-[#282839] overflow-x-auto">
          <nav class="flex gap-8 min-w-max">
            <a (click)="activeTab.set('info')" 
               [class.border-primary]="activeTab() === 'info'"
               [class.text-white]="activeTab() === 'info'"
               class="flex items-center gap-2 pb-3 border-b-2 border-transparent text-[#9d9db9] font-medium text-sm px-1 cursor-pointer transition-all">
              <span class="material-symbols-outlined !text-[18px]">info</span>
              Información General
            </a>
            <a (click)="activeTab.set('config')" 
               [class.border-primary]="activeTab() === 'config'"
               [class.text-white]="activeTab() === 'config'"
               class="flex items-center gap-2 pb-3 border-b-2 border-transparent text-[#9d9db9] font-medium text-sm px-1 cursor-pointer transition-all">
              <span class="material-symbols-outlined !text-[18px]">settings</span>
              Configuración
            </a>
          </nav>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <!-- Left Column: Details -->
          <div class="lg:col-span-2 flex flex-col gap-8">
            <section *ngIf="activeTab() === 'info'">
              <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">feed</span>
                Descripción Detallada
              </h3>
              <div class="bg-[#181825] border border-[#282839] rounded-xl p-6 text-[#9d9db9] leading-relaxed space-y-4">
                <p>
                  El módulo de {{ module()?.name }} es una herramienta fundamental dentro del ecosistema de SIAC ERP.
                  Diseñado para integrarse perfectamente con el resto de las aplicaciones, permite una gestión fluida y eficiente
                  de los procesos de {{ module()?.category?.toLowerCase() }}.
                </p>
                <p>
                  Su arquitectura robusta asegura la integridad de los datos y proporciona una experiencia de usuario premium,
                  con interfaces intuitivas y reportes en tiempo real.
                </p>
                
                <div class="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="flex items-start gap-3">
                    <div class="p-2 rounded-lg bg-[#111022] border border-[#282839] text-emerald-400">
                      <span class="material-symbols-outlined">bolt</span>
                    </div>
                    <div>
                      <h4 class="text-white font-medium text-sm">Alto Rendimiento</h4>
                      <p class="text-xs mt-1">Operaciones optimizadas para grandes volúmenes de datos.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="p-2 rounded-lg bg-[#111022] border border-[#282839] text-blue-400">
                      <span class="material-symbols-outlined">hub</span>
                    </div>
                    <div>
                      <h4 class="text-white font-medium text-sm">Integración Total</h4>
                      <p class="text-xs mt-1">Conectado nativamente con otros módulos Core.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section *ngIf="activeTab() === 'info'">
              <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">image</span>
                Capturas de Pantalla
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="aspect-video bg-[#181825] rounded-xl border border-[#282839] flex items-center justify-center text-slate-700">
                   <span class="material-symbols-outlined text-6xl">image</span>
                </div>
                <div class="aspect-video bg-[#181825] rounded-xl border border-[#282839] flex items-center justify-center text-slate-700">
                   <span class="material-symbols-outlined text-6xl">image</span>
                </div>
              </div>
            </section>
          </div>

          <!-- Right Column: Sidebar Info -->
          <aside class="flex flex-col gap-6">
            <!-- Pricing Card -->
            <div class="bg-[#181825] border border-[#282839] rounded-xl p-6">
              <h4 class="text-[#9d9db9] text-sm font-semibold uppercase tracking-wider mb-2">Suscripción</h4>
              <div class="flex items-baseline gap-1 mb-4">
                <span class="text-3xl font-bold text-white">{{ module()?.price_monthly || '$0.00' }}</span>
                <span class="text-[#9d9db9] text-sm">/ mes</span>
              </div>
              <div class="space-y-3 mb-6">
                <div class="flex items-center gap-2 text-sm text-[#9d9db9]">
                  <span class="material-symbols-outlined text-emerald-500 !text-[18px]">check_circle</span>
                  Usuarios ilimitados
                </div>
                <div class="flex items-center gap-2 text-sm text-[#9d9db9]">
                  <span class="material-symbols-outlined text-emerald-500 !text-[18px]">check_circle</span>
                  Soporte 24/7 incluido
                </div>
              </div>
            </div>

            <!-- Technical Specs Card -->
            <div class="bg-[#181825] border border-[#282839] rounded-xl p-6">
              <h4 class="text-white text-lg font-bold mb-4">Detalles Técnicos</h4>
              <div class="space-y-4">
                <div class="flex justify-between items-center py-2 border-b border-[#282839]">
                  <span class="text-[#9d9db9] text-sm">Versión</span>
                  <span class="text-white text-sm font-medium">{{ module()?.version || '4.2.0' }}</span>
                </div>
                <div class="flex justify-between items-center py-2 border-b border-[#282839]">
                  <span class="text-[#9d9db9] text-sm">Tamaño</span>
                  <span class="text-white text-sm font-medium">~{{ module()?.requires_storage_mb || 0 }} MB</span>
                </div>
                <div class="flex justify-between items-center py-2">
                  <span class="text-[#9d9db9] text-sm">Licencia</span>
                  <span class="text-white text-sm font-medium">Empresarial</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <!-- Loading State -->
      <div *ngIf="isLoading()" class="flex-1 flex flex-col items-center justify-center py-20">
        <div class="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
        <p class="text-[#9d9db9] animate-pulse">Cargando definición de módulo...</p>
      </div>

    </div>
  `,
    styles: [`
    .animate-siac-in { animation: siac-fade-in-up 0.4s ease-out forwards; }
    @keyframes siac-fade-in-up { 
      from { opacity: 0; transform: translateY(10px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
  `]
})
export class ModuleDefinitionComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private moduleRepo = inject(ModuleRepository);
    private notification = inject(NotificationService);
    private session = inject(SessionService);
    public themeService = inject(ThemeService);

    module = signal<Module | null>(null);
    isLoading = signal(true);
    activeTab = signal<'info' | 'config'>('info');
    isInstalled = signal(false);

    async ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            this.notification.error('ID de módulo no proporcionado.');
            this.router.navigate(['/launcher']);
            return;
        }

        await this.loadModule(id);
    }

    async loadModule(id: string) {
        this.isLoading.set(true);
        try {
            const data = await this.moduleRepo.getById(id);
            if (!data) {
                this.notification.error('Módulo no encontrado.');
                this.router.navigate(['/launcher']);
                return;
            }
            this.module.set(data);

            const tenantId = this.session.currentTenantId();
            if (tenantId) {
                const installed = await this.moduleRepo.getInstalledModules(tenantId);
                this.isInstalled.set(installed.some(m => m.id === id));
            }

        } catch (error) {
            this.notification.error('Error al cargar los detalles del módulo.');
        } finally {
            this.isLoading.set(false);
        }
    }

    getIconName(): string {
        const icon = this.module()?.icon?.toLowerCase() || '';
        if (icon.includes('calculate')) return 'calculate';
        if (icon.includes('group') || icon.includes('user')) return 'groups';
        if (icon.includes('inventory') || icon.includes('box')) return 'inventory_2';
        if (icon.includes('monitoring') || icon.includes('chart')) return 'monitoring';
        if (icon.includes('rocket')) return 'rocket_launch';
        if (icon.includes('insights')) return 'insights';
        if (icon.includes('payments')) return 'payments';
        if (icon.includes('hub')) return 'hub';
        return 'apps';
    }

    async toggleModule() {
        const m = this.module();
        const tenantId = this.session.currentTenantId();
        if (!m || !tenantId) return;

        try {
            if (this.isInstalled()) {
                if (confirm(`¿Deseas desinstalar ${m.name}?`)) {
                    await this.moduleRepo.uninstallModule(tenantId, m.id);
                    this.isInstalled.set(false);
                    this.notification.success('Módulo desinstalado.');
                }
            } else {
                await this.moduleRepo.installModule(tenantId, m.id);
                this.isInstalled.set(true);
                this.notification.success('Módulo instalado exitosamente.');
            }
        } catch (error) {
            this.notification.error('Error al procesar la solicitud.');
        }
    }
}
