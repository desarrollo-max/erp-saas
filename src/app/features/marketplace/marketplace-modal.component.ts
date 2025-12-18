import { Component, OnInit, signal, inject, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
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
    <div class="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex items-center justify-center p-4 backdrop-blur-md" (click)="close()">
      
      <!-- MODAL CONTAINER -->
      <div class="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden transition-all duration-300 transform scale-100 border border-white/20" (click)="$event.stopPropagation()">
        
        <!-- HEADER -->
        <div class="px-8 py-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div>
            <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Marketplace Premium</h2>
            <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">Potencia tu negocio con módulos especializados de alta fidelidad.</p>
          </div>
          <button (click)="close()" class="p-2 rounded-xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-all duration-200">
            <ng-icon name="heroXMarkSolid" class="w-6 h-6"></ng-icon>
          </button>
        </div>

        <!-- CONTENT -->
        <div class="p-8 overflow-y-auto bg-gray-50/50 dark:bg-slate-950/50 flex-grow">
          
          <!-- LOADING/ERROR -->
          <div *ngIf="isLoading()" class="flex flex-col items-center justify-center py-32">
            <div class="relative w-16 h-16">
              <div class="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-900/30"></div>
              <div class="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
            </div>
            <p class="mt-4 text-gray-500 dark:text-slate-400 font-medium animate-pulse">Cargando catálogo...</p>
          </div>

          <div *ngIf="error()" class="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
               <ng-icon name="heroExclamationTriangleSolid" class="w-8 h-8"></ng-icon>
            </div>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Error al cargar el catálogo</h3>
            <p class="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{{ error() }}</p>
            <button (click)="loadMarketplace()" class="mt-6 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-semibold shadow-lg shadow-indigo-200 dark:shadow-none">Reintentar</button>
          </div>

          <!-- CATALOG -->
          <div *ngIf="!isLoading() && !error()">
            <div *ngFor="let category of getCategoryKeys(moduleCategories())" class="mb-14 last:mb-0">
              
              <div class="flex items-center mb-8">
                <div class="p-2 mr-4 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none">
                  <ng-icon name="heroSquares2x2Solid" class="text-white w-5 h-5"></ng-icon>
                </div>
                <h3 class="text-xl font-black text-gray-900 dark:text-white tracking-wide uppercase">
                  {{ category.replace(/_/g, ' ') }}
                </h3>
                <div class="flex-grow ml-6 h-px bg-gradient-to-r from-gray-200 dark:from-slate-800 to-transparent"></div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <div *ngFor="let module of moduleCategories().get(category)" 
                     (click)="toggleModule(module)"
                     [ngClass]="{
                       'ring-2 ring-indigo-500 ring-offset-4 ring-offset-white dark:ring-offset-slate-900 shadow-xl': isInstalled(module.id),
                       'hover:shadow-2xl hover:-translate-y-1': true
                     }"
                     class="group bg-white dark:bg-slate-900 rounded-3xl p-7 transition-all duration-300 cursor-pointer border border-gray-100 dark:border-slate-800 relative overflow-hidden flex flex-col items-center text-center">
                  
                  <!-- Glossy background effect -->
                  <div class="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-500"></div>

                  <!-- Icon Container -->
                  <div class="relative w-24 h-24 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 shadow-2xl"
                       [style.background-color]="(module.color || '#6366F1') + '15'">
                    
                    <!-- Decorative Ring -->
                    <div class="absolute inset-0 rounded-2xl border-2 border-white/20 dark:border-slate-700/50"></div>
                    
                    <ng-icon 
                      [name]="getIconName(module)" 
                      class="w-12 h-12 relative z-10" 
                      [color]="module.color || '#6366F1'">
                    </ng-icon>

                    <!-- Status Indicator Mini Badge -->
                    <div *ngIf="isInstalled(module.id)" class="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg transform scale-110">
                      <ng-icon name="heroCheckSolid" class="w-5 h-5"></ng-icon>
                    </div>
                  </div>

                  <!-- Text Content -->
                  <div class="relative z-10 px-2">
                    <h4 class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ module.name }}</h4>
                    <p class="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">{{ module.code }}</p>
                    <p class="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mb-6 font-medium leading-relaxed">{{ module.description }}</p>
                  </div>

                  <!-- Action Button -->
                  <div class="mt-auto w-full relative z-10">
                    <button 
                      class="w-full py-3 rounded-2xl text-sm font-bold transition-all duration-300 transform group-active:scale-95"
                      [ngClass]="{
                        'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30': isInstalled(module.id),
                        'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700': !isInstalled(module.id) && !isProcessing(),
                        'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed': isProcessing()
                      }">
                      
                      <span *ngIf="isProcessing()" class="flex items-center justify-center gap-2">
                        <div class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Procesando...
                      </span>

                      <ng-container *ngIf="!isProcessing()">
                        <span *ngIf="isInstalled(module.id)">Desinstalar</span>
                        <span *ngIf="!isInstalled(module.id)">
                          Instalar ({{ module.price_monthly | currency:'USD':'symbol':'1.0-0' }}/mes)
                        </span>
                      </ng-container>
                    </button>
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
  @Input() installedIds: string[] = [];
  @Output() moduleInstalled = new EventEmitter<Module>();
  @Output() moduleUninstalled = new EventEmitter<string>();
  @Output() closeModal = new EventEmitter<void>();

  private moduleRepo = inject(ModuleRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);

  moduleCategories = signal<Map<string, Module[]>>(new Map());
  isLoading = signal(true);
  isProcessing = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMarketplace();
  }

  close() {
    this.closeModal.emit();
  }

  isInstalled(moduleId: string): boolean {
    return this.installedIds.includes(moduleId);
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

    // Fallback names
    if (module.icon === 'calculator') return 'heroCalculatorSolid';
    if (module.icon === 'users') return 'heroUsersSolid';
    if (module.icon === 'trending-up') return 'heroArrowTrendingUpSolid';
    if (module.icon === 'package') return 'heroArchiveBoxSolid';
    if (module.icon === 'megaphone') return 'heroMegaphoneSolid';
    if (module.icon === 'clipboard-check') return 'heroClipboardDocumentCheckSolid';
    if (module.icon === 'box') return 'heroCubeSolid';

    if (module.icon) return 'heroCubeSolid';

    const code = module.code || '';
    if (code.includes('FIN')) return 'heroCalculatorSolid';
    if (code.includes('HR')) return 'heroUsersSolid';
    if (code.includes('SALES')) return 'heroArrowTrendingUpSolid';
    if (code.includes('SC')) return 'heroArchiveBoxSolid';

    return 'heroCubeSolid';
  }

  async toggleModule(module: Module): Promise<void> {
    const tenantId = this.session.currentTenantId();
    if (!tenantId) {
      this.notification.error('Error de sesión: Debe seleccionar una empresa.');
      return;
    }

    if (this.isProcessing()) return;

    if (this.isInstalled(module.id)) {
      if (confirm(`¿Estás seguro de que deseas desinstalar ${module.name}?`)) {
        await this.uninstallModule(tenantId, module);
      }
    } else {
      await this.installModule(tenantId, module);
    }
  }

  private async installModule(tenantId: string, module: Module): Promise<void> {
    this.isProcessing.set(true);
    try {
      await this.moduleRepo.installModule(tenantId, module.id);
      this.notification.success(`${module.name} instalado exitosamente.`);
      this.moduleInstalled.emit(module);
    } catch (error: any) {
      this.notification.error(`Fallo la instalación: ${error.message}`);
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async uninstallModule(tenantId: string, module: Module): Promise<void> {
    this.isProcessing.set(true);
    try {
      await this.moduleRepo.uninstallModule(tenantId, module.id);
      this.notification.success(`${module.name} desinstalado correctamente.`);
      this.moduleUninstalled.emit(module.id);
    } catch (error: any) {
      this.notification.error(`Error al desinstalar: ${error.message}`);
    } finally {
      this.isProcessing.set(false);
    }
  }
}
