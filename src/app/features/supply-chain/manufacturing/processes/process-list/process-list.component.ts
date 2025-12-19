
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { ManufacturingRepository } from '@core/repositories/manufacturing.repository';
import { SessionService } from '@core/services/session.service';
import { MfgProcess } from '@core/models/erp.types';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-process-list',
  standalone: true,
  imports: [CommonModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 animate-fade-in relative overflow-hidden text-slate-800 dark:text-slate-100">
      
      <!-- Background Decorative Elements -->
      <div class="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -mr-48 -mt-48"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -ml-48 -mb-48"></div>

      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 relative z-10">
        <div>
           <h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2 italic uppercase">Ingeniería de Procesos</h1>
           <p class="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Rutas de Manufactura & Etapas de Valor</p>
        </div>
        
        <button (click)="createProcess()" 
                class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2">
            <ng-icon name="heroPlusCircleSolid" class="w-5 h-5"></ng-icon>
            Nuevo Proceso
        </button>
      </div>

      <!-- Content -->
      <div class="relative z-10">
          
          <div *ngIf="isLoading()" class="h-64 flex flex-col items-center justify-center">
              <div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p class="text-slate-400 text-xs font-black uppercase tracking-widest">Cargando Ingeniería...</p>
          </div>

          <div *ngIf="!isLoading() && processes().length === 0" class="py-20 text-center">
              <ng-icon name="heroCpuChipSolid" class="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4"></ng-icon>
              <p class="text-slate-400 font-bold">No se han definido rutas de producción.</p>
              <button (click)="createProcess()" class="mt-4 text-indigo-600 font-black uppercase text-[10px] tracking-widest hover:underline">Comenzar Ahora</button>
          </div>

          <div *ngIf="!isLoading() && processes().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div *ngFor="let process of processes()" 
                   class="group bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 relative overflow-hidden cursor-pointer"
                   (click)="editProcess(process)">
                  
                  <div class="flex items-start justify-between mb-8">
                      <div class="w-16 h-16 bg-purple-50 dark:bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 transition-all group-hover:bg-purple-600 group-hover:text-white group-hover:rotate-12">
                          <ng-icon name="heroCpuChipSolid" class="w-8 h-8"></ng-icon>
                      </div>
                      <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button (click)="deleteProcess($event, process)" class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all">
                              <ng-icon name="heroTrashSolid" class="w-5 h-5"></ng-icon>
                          </button>
                      </div>
                  </div>

                  <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase italic leading-tight group-hover:text-purple-600 transition-colors">{{ process.name }}</h3>
                  <p class="text-sm text-slate-400 font-medium line-clamp-2 h-10 leading-relaxed mb-6">{{ process.description || 'Sin descripción detallada' }}</p>

                  <div class="flex justify-between items-center pt-6 border-t border-slate-50 dark:border-slate-800">
                      <div class="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <ng-icon name="heroClockSolid" class="w-4 h-4"></ng-icon>
                          {{ process.standard_duration_minutes || 0 }} MIN ESTÁNDAR
                      </div>
                      
                      <span *ngIf="process.is_active" class="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full text-[8px] font-black uppercase">Activo</span>
                      <span *ngIf="!process.is_active" class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full text-[8px] font-black uppercase">Inactivo</span>
                  </div>

                  <!-- Arrow Indicator on hover -->
                  <div class="absolute bottom-8 right-8 text-purple-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all">
                      <ng-icon name="heroArrowRightSolid" class="w-6 h-6"></ng-icon>
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
export class ProcessListComponent implements OnInit {
  private mfgRepo = inject(ManufacturingRepository);
  private session = inject(SessionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notification = inject(NotificationService);

  processes = signal<MfgProcess[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadProcesses();
  }

  async loadProcesses() {
    this.isLoading.set(true);
    try {
      const tenantId = this.session.currentTenantId();
      if (tenantId) {
        const data = await this.mfgRepo.getProcesses(tenantId);
        this.processes.set(data);
      }
    } catch (error) {
      console.error(error);
      this.notification.error('Error al cargar procesos');
    } finally {
      this.isLoading.set(false);
    }
  }

  createProcess() {
    this.router.navigate(['nuevo'], { relativeTo: this.route });
  }

  editProcess(process: MfgProcess) {
    this.router.navigate([process.id], { relativeTo: this.route });
  }

  async deleteProcess(event: Event, process: MfgProcess) {
    event.stopPropagation();
    if (confirm(`¿Estás seguro de eliminar el proceso "${process.name}"?`)) {
      try {
        await this.mfgRepo.deleteProcess(process.id);
        this.notification.success('Proceso eliminado');
        this.loadProcesses();
      } catch (error) {
        console.error(error);
        this.notification.error('No se pudo eliminar el proceso (puede tener órdenes vinculadas)');
      }
    }
  }
}
