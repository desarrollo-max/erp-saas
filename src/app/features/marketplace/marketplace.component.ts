import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModuleRepository } from '../../core/repositories/module.repository';
import { Module } from '../../core/models/module.model';

interface GroupedModules {
  [category: string]: Module[];
}

@Component({
  selector: 'app-marketplace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.scss'],
})
export class MarketplaceComponent implements OnInit {
  private moduleRepo = inject(ModuleRepository);
  private router = inject(Router);

  modulesByCategory = signal<GroupedModules>({});
  isLoading = signal<boolean>(true);

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      const modules = await this.moduleRepo.getAllAvailable();
      this.modulesByCategory.set(this.groupModulesByCategory(modules));
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
}
