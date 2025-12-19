
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { ManufacturingRepository } from '@core/repositories/manufacturing.repository';
import { SessionService } from '@core/services/session.service';
import { MfgBillOfMaterials } from '@core/models/erp.types';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-bom-list',
  standalone: true,
  imports: [CommonModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 animate-fade-in">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
           <h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2 italic uppercase">Materiales & Recetas</h1>
           <p class="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Explosión de Materiales (BOM)</p>
        </div>
        
        <button (click)="createBom()" 
                class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2">
            <ng-icon name="heroPlusCircleSolid" class="w-5 h-5"></ng-icon>
            Nueva Receta
        </button>
      </div>

      <!-- Stats / Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Recetas</p>
              <h3 class="text-3xl font-black text-slate-900 dark:text-white">{{ boms().length }}</h3>
          </div>
          <div class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl">
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Versiones Activas</p>
              <h3 class="text-3xl font-black text-emerald-500">{{ activeBomsCount() }}</h3>
          </div>
          <div class="bg-indigo-600 p-6 rounded-[2rem] shadow-xl text-white">
              <p class="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Última Actualización</p>
              <h3 class="text-xl font-black italic">{{ lastUpdate() | date:'short' }}</h3>
          </div>
      </div>

      <!-- List -->
      <div class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
          <div class="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <h4 class="text-lg font-black text-slate-900 dark:text-white uppercase italic">Inventario de Recetas</h4>
              <div class="relative w-64">
                  <ng-icon name="heroMagnifyingGlassSolid" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></ng-icon>
                  <input type="text" placeholder="Buscar producto..." 
                         class="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all">
              </div>
          </div>

          <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                  <thead>
                      <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/50">
                          <th class="px-8 py-4">Producto Terminado</th>
                          <th class="px-8 py-4">Nombre de Receta</th>
                          <th class="px-8 py-4 text-center">Versión</th>
                          <th class="px-8 py-4 text-center">Estado</th>
                          <th class="px-8 py-4 text-right">Acciones</th>
                      </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
                      <tr *ngFor="let bom of boms()" class="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td class="px-8 py-6">
                              <div class="flex items-center gap-3">
                                  <div class="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600">
                                      <ng-icon name="heroCubeSolid" class="w-5 h-5"></ng-icon>
                                  </div>
                                  <div>
                                      <p class="text-sm font-black text-slate-900 dark:text-white">{{ bom.scm_products?.name || 'Cargando...' }}</p>
                                      <p class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">ID: {{ bom.finished_product_id.substring(0,8) }}</p>
                                  </div>
                              </div>
                          </td>
                          <td class="px-8 py-6 font-bold text-sm text-slate-600 dark:text-slate-300">
                              {{ bom.name }}
                          </td>
                          <td class="px-8 py-6 text-center">
                              <span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black text-slate-500 uppercase">{{ bom.version }}</span>
                          </td>
                          <td class="px-8 py-6 text-center">
                              <div class="flex justify-center">
                                  <span *ngIf="bom.is_active" class="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full text-[9px] font-black uppercase">
                                      <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                      Activa
                                  </span>
                                  <span *ngIf="!bom.is_active" class="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full text-[9px] font-black uppercase">
                                      <div class="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                                      Inactiva
                                  </span>
                              </div>
                          </td>
                          <td class="px-8 py-6 text-right">
                              <button (click)="editBom(bom)" class="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                  <ng-icon name="heroChevronRightSolid" class="w-5 h-5"></ng-icon>
                              </button>
                          </td>
                      </tr>

                      <tr *ngIf="boms().length === 0 && !isLoading()">
                          <td colspan="5" class="px-8 py-20 text-center">
                              <ng-icon name="heroInboxSolid" class="w-12 h-12 text-slate-200 mx-auto mb-4"></ng-icon>
                              <p class="text-slate-400 font-bold text-sm">No se encontraron recetas de producción.</p>
                          </td>
                      </tr>
                  </tbody>
              </table>
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
export class BomListComponent implements OnInit {
  private mfgRepo = inject(ManufacturingRepository);
  private session = inject(SessionService);
  private router = inject(Router);
  private notification = inject(NotificationService);

  boms = signal<any[]>([]);
  isLoading = signal(true);
  activeBomsCount = signal(0);
  lastUpdate = signal(new Date());

  async ngOnInit() {
    await this.loadBoms();
  }

  async loadBoms() {
    this.isLoading.set(true);
    try {
      const tenantId = this.session.currentTenantId();
      if (!tenantId) return;

      const data = await this.mfgRepo.getBoms(tenantId);
      this.boms.set(data);
      this.activeBomsCount.set(data.filter(b => b.is_active).length);
      if (data.length > 0) {
        this.lastUpdate.set(new Date(Math.max(...data.map(d => new Date(d.created_at).getTime()))));
      }
    } catch (error) {
      console.error(error);
      this.notification.error('Error al cargar la lista de materiales');
    } finally {
      this.isLoading.set(false);
    }
  }

  createBom() {
    this.router.navigate(['/produccion/bom/nuevo']);
  }

  editBom(bom: any) {
    this.router.navigate(['/produccion/bom', bom.id]);
  }
}
