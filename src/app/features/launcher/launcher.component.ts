import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { ModuleRepository } from '../../core/repositories/module.repository';
import { Module } from '../../core/models/module.model';

@Component({
    selector: 'app-launcher',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- HEADER -->
      <div class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16 items-center">
            <h1 class="text-xl font-bold text-gray-800">
              Empresa: <span class="text-indigo-600">{{ sessionService.currentCompany()?.name || 'Seleccionar...' }}</span>
            </h1>
            <button (click)="logout()" class="text-sm text-gray-500 hover:text-gray-700">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <!-- CONTENT -->
      <div class="flex-grow flex items-center justify-center p-6">
        <div class="max-w-6xl w-full">
          
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            
            <!-- CARD 1: SETTINGS (Fixed) -->
            <div (click)="navigateTo('/settings')" 
                 class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-6 flex flex-col items-center justify-center group border border-transparent hover:border-gray-200 h-48">
              <div class="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-gray-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 class="text-base font-semibold text-gray-900">Configuración</h3>
            </div>

            <!-- CARD 2: MARKETPLACE (Fixed) -->
            <div (click)="navigateTo('/marketplace')" 
                 class="bg-indigo-50 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-6 flex flex-col items-center justify-center group border border-indigo-100 hover:border-indigo-300 h-48">
              <div class="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 class="text-base font-semibold text-indigo-900">Marketplace</h3>
              <p class="text-xs text-indigo-600 mt-1">Añadir Módulos</p>
            </div>

            <!-- DYNAMIC MODULES -->
            <div *ngFor="let module of installedModules()" 
                 (click)="onModuleClick(module)"
                 class="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer p-6 flex flex-col items-center justify-center group border border-transparent hover:border-blue-100 h-48">
              <div 
                class="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-colors"
                [style.background-color]="module.color ? module.color + '20' : '#EFF6FF'"
                [style.color]="module.color || '#3B82F6'"
              >
                <!-- Icon Placeholder: First letter if no icon -->
                <span class="text-xl font-bold">{{ module.name.charAt(0) }}</span>
              </div>
              <h3 class="text-base font-semibold text-gray-900 text-center">{{ module.name }}</h3>
              <p class="text-xs text-gray-500 mt-1 text-center truncate w-full px-2">{{ module.description }}</p>
            </div>

            <!-- LOADING STATE -->
            <div *ngIf="isLoading()" class="col-span-full flex justify-center py-10">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class LauncherComponent implements OnInit {
    sessionService = inject(SessionService);
    private router = inject(Router);
    private moduleRepo = inject(ModuleRepository);

    installedModules = signal<Module[]>([]);
    isLoading = signal<boolean>(true);

    async ngOnInit() {
        await this.loadInstalledModules();
    }

    async loadInstalledModules() {
        const tenant = this.sessionService.currentTenant();
        if (!tenant) {
            console.warn('No tenant found in session.');
            this.isLoading.set(false);
            return;
        }

        try {
            this.isLoading.set(true);
            const modules = await this.moduleRepo.getInstalledModules(tenant.id);
            this.installedModules.set(modules);
        } catch (error) {
            console.error('Error loading installed modules:', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    navigateTo(path: string) {
        this.router.navigate([path]);
    }

    onModuleClick(module: Module) {
        if (module.route_path) {
            this.router.navigate([module.route_path]);
        } else {
            console.warn('Module has no route path:', module.name);
        }
    }

    logout() {
        this.sessionService.logout();
    }
}
