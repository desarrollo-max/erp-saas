
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SessionService } from '@core/services/session.service';
import { ProductRepository } from '@core/repositories/product.repository';
import { NotificationService } from '@core/services/notification.service';
import { ScmProduct } from '@core/models/erp.types';

@Component({
  selector: 'app-catalog-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 animate-fade-in relative overflow-hidden text-slate-800 dark:text-slate-100">
      
      <!-- Background Decorative Elements -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -ml-48 -mb-48"></div>

      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
        <div>
           <h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2 italic uppercase">Catálogo Industrial</h1>
           <p class="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Maestro de Artículos Manufacturables</p>
        </div>
        
        <button (click)="navigateToNew()" 
                class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2">
            <ng-icon name="heroPlusCircleSolid" class="w-5 h-5"></ng-icon>
            Nuevo Producto
        </button>
      </div>

      <!-- Search & Filters -->
      <div class="mb-8 relative z-10">
          <div class="max-w-md relative group">
              <ng-icon name="heroMagnifyingGlassSolid" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors"></ng-icon>
              <input type="text" [formControl]="searchControl" placeholder="Buscar por nombre o SKU..." 
                     class="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-none rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-sm text-slate-900 dark:text-white">
          </div>
      </div>

      <!-- Grid List -->
      <div class="relative z-10">
          <div *ngIf="isLoading()" class="h-64 flex flex-col items-center justify-center">
              <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p class="text-slate-400 text-xs font-black uppercase tracking-widest">Sincronizando Catálogo...</p>
          </div>

          <div *ngIf="!isLoading() && filteredProducts().length === 0" class="py-20 text-center">
              <ng-icon name="heroArchiveBoxSolid" class="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4"></ng-icon>
              <p class="text-slate-400 font-bold">No se encontraron productos manufacturables.</p>
          </div>

          <div *ngIf="!isLoading() && filteredProducts().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div *ngFor="let product of filteredProducts()" 
                   class="group bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative overflow-hidden">
                  
                  <div class="flex items-start justify-between mb-6">
                      <div class="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center text-slate-300 transition-all group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 group-hover:text-indigo-600">
                          <img *ngIf="product.image_url" [src]="product.image_url" alt="" class="w-full h-full object-cover">
                          <ng-icon *ngIf="!product.image_url" name="heroCubeTransparentSolid" class="w-8 h-8"></ng-icon>
                      </div>
                      <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button (click)="navigateToEdit($event, product.id)" class="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all">
                              <ng-icon name="heroPencilSquareSolid" class="w-5 h-5"></ng-icon>
                          </button>
                          <button (click)="deleteProduct($event, product.id)" class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all">
                              <ng-icon name="heroTrashSolid" class="w-5 h-5"></ng-icon>
                          </button>
                      </div>
                  </div>

                  <h3 class="text-lg font-black text-slate-900 dark:text-white mb-1 uppercase italic leading-tight group-hover:text-indigo-600 transition-colors">{{ product.name }}</h3>
                  <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">SKU: {{ product.sku }}</p>

                  <div class="flex justify-between items-end pt-4 border-t border-slate-50 dark:border-slate-800">
                      <div>
                          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio Venta</p>
                          <p class="text-xl font-black text-slate-900 dark:text-white">{{ product.sale_price | currency }}</p>
                      </div>
                      <div class="text-right">
                          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo Est.</p>
                          <p class="text-sm font-black text-indigo-500">{{ product.cost_price | currency }}</p>
                      </div>
                  </div>

                  <!-- Status Badge -->
                  <div class="absolute top-6 right-6">
                      <span *ngIf="product.is_active" class="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full text-[8px] font-black uppercase">Activo</span>
                      <span *ngIf="!product.is_active" class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full text-[8px] font-black uppercase">Inactivo</span>
                  </div>
              </div>
          </div>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CatalogListComponent implements OnInit {
  private session = inject(SessionService);
  private productRepo = inject(ProductRepository);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  products = signal<ScmProduct[]>([]);
  isLoading = signal(true);
  searchControl = new FormBuilder().control('');

  filteredProducts = computed(() => {
    const raw = this.products();
    const term = this.searchControl.value?.toLowerCase() || '';

    return raw.filter(p => {
      // For the catalog we show products marked as manufacturable
      const isManufacturable = p.is_manufacturable === true;
      const matchesTerm = p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term);
      return isManufacturable && matchesTerm;
    });
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const tenantId = this.session.currentTenantId();
      if (!tenantId) return;

      const data = await this.productRepo.getAll(tenantId);
      this.products.set(data);
    } catch (e: any) {
      console.error(e);
      this.notification.error('Error al cargar catálogo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  navigateToNew() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  navigateToEdit(event: Event, id: string) {
    event.stopPropagation();
    this.router.navigate([id], { relativeTo: this.route });
  }

  async deleteProduct(event: Event, id: string) {
    event.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar este producto del catálogo?')) return;

    try {
      await this.productRepo.delete(id);
      this.notification.success('Producto eliminado.');
      this.loadData();
    } catch (e) {
      this.notification.error('Error al eliminar.');
    }
  }
}
