import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModuleRepository } from '@core/repositories/module.repository';
import { Module } from '@core/models/module.model';
import { LucideAngularModule } from 'lucide-angular';
import { SessionService } from '@core/services/session.service';

interface GroupedModules {
  [category: string]: Module[];
}

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.scss'],
})
export class MarketplaceComponent implements OnInit {
  private moduleRepo = inject(ModuleRepository);
  private session = inject(SessionService);
  private router = inject(Router);

  modulesByCategory = signal<GroupedModules>({});
  isLoading = signal<boolean>(true);

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      const [allModules, installedModules] = await Promise.all([
        this.moduleRepo.getAllAvailable(),
        this.moduleRepo.getInstalledModules(this.session.currentTenantId() || '')
      ]);

      const installedIds = new Set(installedModules.map(m => m.id));
      const modulesWithStatus = allModules.map(m => ({
        ...m,
        is_installed: installedIds.has(m.id)
      }));

      this.modulesByCategory.set(this.groupModulesByCategory(modulesWithStatus));
    } catch (error) {
      console.error('Error loading modules:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private groupModulesByCategory(modules: Module[]): GroupedModules {
    return modules.reduce((acc, module) => {
      const category = module.category || 'General';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(module);
      return acc;
    }, {} as GroupedModules);
  }

  get categories(): string[] {
    return Object.keys(this.modulesByCategory());
  }

  onModuleClick(module: Module) {
    if (module.route_path) {
      this.router.navigate([module.route_path]);
    }
  }

  getIconName(module: Module): string {
    if (module.icon) return module.icon;

    const code = module.code || '';
    if (code.includes('FIN')) return 'calculator';
    if (code.includes('HR')) return 'users';
    if (code.includes('SALES')) return 'trending-up';
    if (code.includes('SC')) return 'package';
    if (code.includes('MKT')) return 'megaphone';
    if (code.includes('PROD')) return 'clipboard-check';
    if (code.includes('SVC')) return 'headphones';

    return 'box';
  }
}
