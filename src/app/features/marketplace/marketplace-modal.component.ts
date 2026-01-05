import { Component, OnInit, signal, inject, Output, EventEmitter, Input, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModuleRepository } from '@core/repositories/module.repository';
import { SessionService } from '@core/services/session.service';
import { Module } from '@core/models/module.model';
import { NotificationService } from '@core/services/notification.service';
import { ExternalMarketplaceService, ExternalProduct } from '@core/services/external-marketplace.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-marketplace-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 transition-all animate-fade-in" (click)="close()">
      <div class="flex flex-col w-full max-w-6xl h-[91vh] bg-[#1c212c] rounded-2xl shadow-2xl border border-[#2d3648] overflow-hidden animate-siac-in" (click)="$event.stopPropagation()">
        
        <!-- Premium Header -->
        <div class="flex items-center justify-between px-8 py-7 border-b border-[#2d3648] bg-[#1c212c] z-10 shrink-0">
          <div class="flex items-center gap-5">
            <div class="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
               <span class="material-symbols-outlined text-3xl">storefront</span>
            </div>
            <div>
              <h2 class="text-2xl font-black text-white tracking-tighter uppercase">
                Marketplace SIAC
              </h2>
              <p class="text-sm text-slate-400 font-medium">Arquitectura de módulos inteligentes para su ecosistema ERP.</p>
            </div>
          </div>
          <button (click)="close()" class="group p-2.5 rounded-xl hover:bg-slate-800 transition-all text-slate-400 hover:text-white border border-transparent hover:border-[#2d3648]">
            <span class="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>

        <!-- Toolbar: Tabs & Search -->
        <div class="flex flex-col flex-1 overflow-hidden bg-[#111318]/50">
          <div class="px-8 py-6 border-b border-[#2d3648]/50 bg-[#1c212c]/50 shrink-0 shadow-sm z-20">
            <div class="grid gap-6 grid-cols-1 lg:grid-cols-12 items-center">
              
              <!-- Premium Segmented Control -->
              <div class="lg:col-span-3 flex p-1.5 bg-[#111318] rounded-xl border border-[#2d3648] shadow-inner">
                <button (click)="currentTab.set('APPS')" 
                        [class]="currentTab() === 'APPS' ? 'bg-[#1c212c] text-white shadow-lg border-slate-700' : 'text-slate-500 border-transparent'"
                        class="flex-1 px-4 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all border">Aplicaciones</button>
                <button (click)="currentTab.set('SUPPLIES')" 
                        [class]="currentTab() === 'SUPPLIES' ? 'bg-[#1c212c] text-white shadow-lg border-slate-700' : 'text-slate-500 border-transparent'"
                        class="flex-1 px-4 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all border">Suministros</button>
              </div>

              <!-- Integrated Search -->
              <div class="lg:col-span-5 relative group">
                <span class="material-symbols-outlined absolute left-4 top-3.5 text-slate-500 group-focus-within:text-primary transition-colors">search</span>
                <input class="w-full pl-12 pr-4 py-3.5 bg-[#111318] border border-[#2d3648] rounded-xl text-sm text-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-medium placeholder:text-slate-500" 
                       placeholder="Buscar herramientas o servicios..." 
                       type="text"
                       [value]="searchTerm()"
                       (input)="searchTerm.set($any($event.target).value)"/>
              </div>

              <!-- Category Select (Only APPS) -->
              <div class="lg:col-span-4" *ngIf="currentTab() === 'APPS'">
                <div class="relative">
                  <select class="w-full pl-5 pr-12 py-3.5 bg-[#111318] border border-[#2d3648] rounded-xl text-sm text-slate-300 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary cursor-pointer appearance-none font-bold tracking-tight"
                          (change)="selectedCategory.set($any($event.target).value)">
                    <option value="">Todas las Categorías</option>
                    <option *ngFor="let cat of allCategories()" [value]="cat">{{ cat }}</option>
                  </select>
                  <span class="material-symbols-outlined absolute right-4 top-3.5 pointer-events-none text-slate-500">expand_more</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Content Area -->
          <div class="flex-1 overflow-y-auto p-8 lg:p-10 scroll-smooth custom-scrollbar">
            
            <!-- APPS GRID -->
            <ng-container *ngIf="currentTab() === 'APPS'">
              <div *ngIf="isLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div *ngFor="let i of [1,2,3,4,5,6]" class="h-72 rounded-3xl bg-[#1c212c] border border-[#2d3648] animate-pulse"></div>
              </div>

              <div *ngIf="!isLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-siac-in">
                <div *ngFor="let module of filteredModules()" 
                     class="flex flex-col bg-[#1c212c] rounded-3xl border border-[#2d3648] p-8 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 transition-all group h-full relative overflow-hidden">
                  
                  <div class="flex justify-between items-start mb-8">
                    <div class="h-16 w-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-3"
                         [style.background-color]="(module.color || '#135bec') + '15'"
                         [style.color]="module.color || '#135bec'">
                      <span class="material-symbols-outlined text-[36px] font-light">{{ getIconName(module) }}</span>
                    </div>
                    <span class="px-3 py-1.5 rounded-xl bg-[#111318] text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-800">
                      {{ module.category }}
                    </span>
                  </div>

                  <h3 class="text-xl font-black text-white mb-3 tracking-tighter group-hover:text-primary transition-colors">{{ module.name }}</h3>
                  <p class="text-sm text-slate-400 mb-8 line-clamp-3 leading-relaxed font-medium">{{ module.description }}</p>

                  <div class="mt-auto pt-7 border-t border-slate-800/50 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <span class="material-symbols-outlined text-yellow-400 text-[20px] fill-current">star</span>
                      <span class="text-sm font-black text-white">4.9</span>
                    </div>
                    
                    <div class="flex gap-2">
			<button (click)="goToModuleDefinition(module)"
                            class="p-3 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-slate-700"
                            title="Ver detalles">
                      <span class="material-symbols-outlined text-[18px]">info</span>
                    </button>
                    <button (click)="toggleModule(module)"
                            [disabled]="isProcessing()"
                            [class]="isInstalled(module.id) ? 'bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-950/20 border-slate-700' : 'bg-primary hover:bg-primary-hover text-white shadow-2xl shadow-primary/30 active:scale-95'"
                            class="px-6 py-3 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 border border-transparent hover:-translate-y-1 disabled:opacity-50">
                      <span class="material-symbols-outlined text-[18px] font-bold">{{ isInstalled(module.id) ? 'done_all' : 'add' }}</span>
                      {{ isInstalled(module.id) ? 'Instalado' : 'Instalar' }}
                    </button>
		    </div>
                  </div>
                </div>
              </div>
            </ng-container>

            <!-- SUPPLIES GRID -->
            <ng-container *ngIf="currentTab() === 'SUPPLIES'">
              <div *ngIf="externalMarketplace.isLoading()" class="flex flex-col items-center justify-center py-40 animate-siac-in">
                <div class="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-8 shadow-xl"></div>
                <p class="text-sm text-slate-500 font-black uppercase tracking-widest animate-pulse">Consultando Red de Proveedores SIAC...</p>
              </div>

              <div *ngIf="!externalMarketplace.isLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <div *ngFor="let prod of externalProducts()" 
                     class="flex flex-col bg-[#1c212c] rounded-3xl border border-[#2d3648] overflow-hidden hover:border-primary transition-all group h-full shadow-lg hover:shadow-2xl">
                  <div class="aspect-video bg-slate-900/50 relative overflow-hidden border-b border-white/5">
                    <img *ngIf="prod.image_url" [src]="prod.image_url" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000">
                    <div *ngIf="!prod.image_url" class="absolute inset-0 flex items-center justify-center text-slate-800">
                      <span class="material-symbols-outlined text-8xl">inventory_2</span>
                    </div>
                    <div class="absolute top-5 right-5 px-4 py-2 bg-[#1c212c]/90 backdrop-blur-xl rounded-2xl text-sm font-black text-primary shadow-2xl border border-white/20">
                      {{ prod.price | currency:'USD' }}
                    </div>
                  </div>
                  <div class="p-8 flex flex-col flex-1">
                    <span class="text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-4">{{ prod.vendor }}</span>
                    <h3 class="text-xl font-black text-white mb-3 line-clamp-1 tracking-tight group-hover:text-primary transition-colors">{{ prod.title }}</h3>
                    <p class="text-sm text-slate-400 mb-10 line-clamp-2 leading-relaxed font-medium">{{ prod.description }}</p>
                    <button class="mt-auto w-full py-4.5 siac-gradient-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:shadow-2xl hover:-translate-y-1.5 active:scale-95 shadow-primary/40">
                      Solicitar Suministro
                    </button>
                  </div>
                </div>
              </div>
            </ng-container>

            <!-- Unified Empty State -->
            <div *ngIf="!isLoading() && ((currentTab() === 'APPS' && filteredModules().length === 0) || (currentTab() === 'SUPPLIES' && externalProducts().length === 0))" 
                 class="flex flex-col items-center justify-center py-40 text-center animate-siac-in">
              <div class="h-28 w-28 rounded-full bg-[#111318] flex items-center justify-center mb-8 border border-[#2d3648] shadow-inner group">
                <span class="material-symbols-outlined text-6xl text-slate-700 group-hover:text-primary transition-colors duration-500">search_off</span>
              </div>
              <h3 class="text-2xl font-black text-white tracking-tighter uppercase">Sin coincidencias</h3>
              <p class="text-slate-400 mt-3 max-w-sm text-base font-medium">No hay resultados para su búsqueda actual. Intente con términos más generales.</p>
              <button (click)="searchTerm.set(''); selectedCategory.set('')" class="mt-10 px-8 py-3 bg-slate-800 rounded-xl text-primary font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all shadow-sm">Restablecer filtros</button>
            </div>
          </div>
        </div>

        <!-- Premium Footer -->
        <div class="px-8 py-7 border-t border-[#2d3648] bg-[#1c212c] flex flex-col sm:flex-row justify-between items-center gap-6 z-10 shrink-0 shadow-2xl">
          <div class="flex items-center gap-5">
             <div class="flex items-center gap-2 text-primary">
                <span class="material-symbols-outlined text-xl">verified</span>
                <p class="font-black uppercase tracking-tighter text-[11px] text-slate-400">SIAC Marketplace Enterprise</p>
             </div>
             <span class="h-1.5 w-1.5 rounded-full bg-slate-800"></span>
             <p class="font-bold text-xs text-slate-500">Versión 4.2.0-STABLE</p>
          </div>
          <div class="flex gap-4">
            <button class="px-7 py-3 rounded-xl border border-[#2d3648] hover:bg-slate-800 transition-all disabled:opacity-30 font-black text-[10px] uppercase tracking-widest" disabled>Anterior</button>
            <button class="px-7 py-3 rounded-xl border border-[#2d3648] hover:bg-slate-800 transition-all text-white font-black text-[10px] uppercase tracking-widest">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      z-index: 100;
    }
  `]
})
export class MarketplaceModalComponent implements OnInit {
  @Input() installedIds: string[] = [];
  @Output() moduleInstalled = new EventEmitter<Module>();
  @Output() moduleUninstalled = new EventEmitter<string>();
  @Output() closeModal = new EventEmitter<void>();

  private moduleRepo = inject(ModuleRepository);
  public externalMarketplace = inject(ExternalMarketplaceService);
  private session = inject(SessionService);
  private notification = inject(NotificationService);
  private router = inject(Router);

  allModules = signal<Module[]>([]);
  isLoading = signal(true);
  isProcessing = signal(false);
  error = signal<string | null>(null);

  searchTerm = signal<string>('');
  selectedCategory = signal<string>('');
  currentTab = signal<'APPS' | 'SUPPLIES'>('APPS');

  externalProducts = signal<ExternalProduct[]>([]);

  // Derived signals
  allCategories = computed(() => {
    const cats = new Set(this.allModules().map(m => m.category));
    return Array.from(cats).sort();
  });

  filteredModules = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const category = this.selectedCategory();

    return this.allModules().filter(m => {
      const matchTerm = !term ||
        m.name.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term);
      const matchCat = !category || m.category === category;
      return matchTerm && matchCat;
    });
  });

  constructor() {
    effect(() => {
      if (this.currentTab() === 'SUPPLIES') {
        this.searchExternal();
      }
    });
  }

  ngOnInit(): void {
    this.loadMarketplace();
  }

  async searchExternal() {
    const products = await this.externalMarketplace.searchProducts(this.searchTerm());
    this.externalProducts.set(products.slice(0, 20));
  }

  close() {
    this.closeModal.emit();
  }

  goToModuleDefinition(module: Module) {
    this.close();
    this.router.navigate(['/modules/definition', module.id]);
  }

  isInstalled(moduleId: string): boolean {
    return this.installedIds.includes(moduleId);
  }

  async loadMarketplace(): Promise<void> {
    this.isLoading.set(true);
    try {
      const available = await this.moduleRepo.getAllAvailable();
      this.allModules.set(available);
    } catch (error: any) {
      this.error.set(error.message || 'Error al cargar el catálogo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  getIconName(module: Module): string {
    // Map existing icon names or types to Material Symbols
    const icon = module.icon?.toLowerCase() || '';
    if (icon.includes('calculate') || icon.includes('count')) return 'calculate';
    if (icon.includes('user') || icon.includes('group')) return 'groups';
    if (icon.includes('inventory') || icon.includes('box') || icon.includes('package')) return 'inventory_2';
    if (icon.includes('sales') || icon.includes('chart') || icon.includes('monitoring')) return 'monitoring';
    if (icon.includes('rocket') || icon.includes('project')) return 'rocket_launch';
    if (icon.includes('analytics') || icon.includes('insights')) return 'insights';
    if (icon.includes('payments') || icon.includes('money')) return 'payments';
    if (icon.includes('hub') || icon.includes('settings')) return 'hub';
    if (icon.includes('cloud')) return 'cloud_sync';
    if (icon.includes('store') || icon.includes('shopping')) return 'storefront';

    return 'grid_view';
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
      this.notification.error(`Falló la instalación: ${error.message}`);
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
