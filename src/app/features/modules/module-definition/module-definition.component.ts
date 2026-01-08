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
    templateUrl: './module-definition.component.html',
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
