import { Component, OnInit, signal, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ModuleRepository } from '@core/repositories/module.repository';
import { SessionService } from '@core/services/session.service';
import { Module } from '@core/models/module.model';
import { NotificationService } from '@core/services/notification.service';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

interface ModuleCategoryMap {
  [key: string]: Module[];
}

@Component({
  selector: 'app-marketplace-modal',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <!-- BACKDROP -->
    <div class="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" (click)="close()">
      
      <!-- MODAL CONTAINER -->
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden" (click)="$event.stopPropagation()">
        
        <!-- HEADER -->
        <div class="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Marketplace</h2>
            <p class="text-sm text-gray-500 mt-1">Explora y añade nuevas funcionalidades a tu empresa.</p>
          </div>
          <button (click)="close()" class="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <ng-icon name="heroXMarkSolid" class="w-6 h-6"></ng-icon>
          </button>
        </div>

        <!-- CONTENT -->
        <div class="p-8 overflow-y-auto bg-gray-50 flex-grow">
          
          <!-- LOADING/ERROR -->
          <div *ngIf="isLoading()" class="flex justify-center py-20">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
          <div *ngIf="error()" class="text-center py-20 text-red-500">
            <p class="font-medium">Error al cargar el catálogo</p>
            <p class="text-sm mt-1">{{ error() }}</p>
          </div>

          <!-- CATALOG -->
          <div *ngIf="!isLoading() && !error()">
            <div *ngFor="let category of getCategoryKeys(moduleCategories())" class="mb-10 last:mb-0">
              
              <h3 class="text-lg font-bold text-gray-800 mb-5 flex items-center">
                <span class="w-1 h-6 bg-indigo-500 rounded-full mr-3"></span>
                {{ category.replace(/_/g, ' ') }}
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div *ngFor="let module of moduleCategories().get(category)" 
                     (click)="installModule(module)"
                     class="group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 hover:border-indigo-200 relative overflow-hidden">
                  
                  <!-- Hover Effect Background -->
                  <div class="absolute inset-0 bg-gradient-to-br from-transparent to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div class="relative z-10 flex flex-col items-center text-center">
                    
                    <!-- Icon Container -->
                    <div class="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 shadow-inner"
                         [style.background-color]="(module.color || '#10B981') + '15'">
                      <ng-icon 
                        [name]="getIconName(module)" 
                        class="w-10 h-10" 
                        [color]="module.color || '#10B981'">
                      </ng-icon>
                    </div>

                    <!-- Text Content -->
                    <h4 class="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors">{{ module.name }}</h4>
                    <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">{{ module.code }}</p>
                    
                    <!-- Description (Optional, truncated) -->
                    <p class="text-sm text-gray-500 line-clamp-2 mb-4 px-2">{{ module.description }}</p>

                    <!-- Action Button (Visual only, whole card is clickable) -->
                    <div class="mt-auto">
                        <span *ngIf="!isInstalling()" class="inline-flex items-center text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full group-hover:bg-indigo-100 transition-colors">
                            {{ module.price_monthly | currency:'USD':'symbol':'1.0-0' }}/mes
                        </span>
                        <span *ngIf="isInstalling()" class="inline-flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            Procesando...
                        </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      z-index: 50;
    }
  `]
})
export class MarketplaceModalComponent implements OnInit {
  @Output() moduleInstalled = new EventEmitter<Module>();
  @Output() closeModal = new EventEmitter<void>();

  private moduleRepo = inject(ModuleRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);

  moduleCategories = signal<Map<string, Module[]>>(new Map());
  isLoading = signal(true);
  isInstalling = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMarketplace();
  }

  close() {
    this.closeModal.emit();
  }

  async loadMarketplace(): Promise<void> {
    this.isLoading.set(true);
    try {
      const allModules = await this.moduleRepo.getAllAvailable();
      const grouped = allModules.reduce((acc: ModuleCategoryMap, module) => {
        const category = module.category.replace(/_/g, ' ').toUpperCase();
        if (!acc[category]) acc[category] = [];
        acc[category].push(module);
        return acc;
      }, {});
      this.moduleCategories.set(new Map(Object.entries(grouped)));
    } catch (error: any) {
      this.error.set(error.message || 'Error al cargar el catálogo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  getCategoryKeys(map: Map<string, Module[]>): string[] {
    return Array.from(map.keys());
  }

  getIconName(module: Module): string {
    if (module.icon === 'edit-3') return 'heroPencilSquareSolid';
    if (module.icon && module.icon.startsWith('hero')) return module.icon;

    // Fallback for old icon names if they still exist
    if (module.icon === 'calculator') return 'heroCalculatorSolid';
    if (module.icon === 'users') return 'heroUsersSolid';
    if (module.icon === 'trending-up') return 'heroArrowTrendingUpSolid';
    if (module.icon === 'package') return 'heroArchiveBoxSolid';
    if (module.icon === 'megaphone') return 'heroMegaphoneSolid';
    if (module.icon === 'clipboard-check') return 'heroClipboardDocumentCheckSolid';
    if (module.icon === 'headphones') return 'heroChatBubbleLeftRightSolid';
    if (module.icon === 'box') return 'heroCubeSolid';

    if (module.icon) return 'heroCubeSolid'; // Default for unknown names

    // Fallback based on module code conventions
    const code = module.code || '';
    if (code.includes('FIN')) return 'heroCalculatorSolid';
    if (code.includes('HR')) return 'heroUsersSolid';
    if (code.includes('SALES')) return 'heroArrowTrendingUpSolid';
    if (code.includes('SC')) return 'heroArchiveBoxSolid';
    if (code.includes('MKT')) return 'heroMegaphoneSolid';
    if (code.includes('PROD')) return 'heroClipboardDocumentCheckSolid';
    if (code.includes('SVC')) return 'heroChatBubbleLeftRightSolid';

    return 'heroCubeSolid';
  }

  async installModule(module: Module): Promise<void> {
    const tenantId = this.session.currentTenantId();
    if (!tenantId) {
      this.notification.error('Error de sesión: Debe seleccionar una empresa.');
      return;
    }

    if (this.isInstalling()) return;
    this.isInstalling.set(true);

    try {
      await this.moduleRepo.installModule(tenantId, module.id);
      this.notification.success(`${module.name} instalado exitosamente.`);
      this.moduleInstalled.emit(module);
      this.closeModal.emit();
    } catch (error: any) {
      this.notification.error(`Fallo la instalación: ${error.message}`);
    } finally {
      this.isInstalling.set(false);
    }
  }
}

