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
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-10 animate-fade-in relative overflow-hidden transition-colors duration-500">
      
      <!-- Premium Background Elements -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.1)_0%,transparent_50%)] pointer-events-none"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.1)_0%,transparent_50%)] pointer-events-none"></div>

      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
        <div class="space-y-2">
          <h1 class="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic drop-shadow-sm">
            Ingeniería de <span class="text-indigo-600 dark:text-indigo-400">Procesos</span>
          </h1>
          <p class="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-slate-500 ml-1">Estandarización y Rutas de Producción</p>
        </div>
        
        <button (click)="createProcess()" 
                class="px-8 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-400 hover:text-white transition-all shadow-2xl flex items-center gap-3 group active:scale-95">
          <ng-icon name="heroPlusCircleSolid" class="w-6 h-6 group-hover:rotate-90 transition-transform duration-500"></ng-icon>
          Nuevo Método
        </button>
      </div>

      <!-- Content -->
      <div class="relative z-10">
        <div *ngIf="isLoading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div *ngFor="let i of [1,2,3]" class="h-64 bg-white dark:bg-slate-900/50 rounded-[3rem] animate-pulse border border-slate-100 dark:border-slate-800"></div>
        </div>

        <div *ngIf="!isLoading() && processes().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div *ngFor="let p of processes()" 
               class="group bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-[3rem] p-8 border border-white dark:border-slate-800/50 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 dark:hover:border-indigo-500/30 transition-all duration-500 cursor-pointer relative overflow-hidden"
               (click)="editProcess(p)">
            
            <div class="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_70%_30%,rgba(79,70,229,0.05)_0%,transparent_70%)] group-hover:scale-150 transition-transform duration-700"></div>

            <div class="relative z-10">
                <div class="flex justify-between items-start mb-6">
                  <div class="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-[1.25rem] flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                    <ng-icon name="heroArrowPathSolid" class="w-7 h-7 group-hover:rotate-180 transition-transform duration-700"></ng-icon>
                  </div>
                  <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div class="w-1.5 h-1.5 rounded-full" [class.bg-emerald-500]="p.is_active" [class.bg-slate-400]="!p.is_active"></div>
                    <span class="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {{ p.is_active ? 'OPERATIVO' : 'DESCATALOGADO' }}
                    </span>
                  </div>
                </div>

                <h3 class="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {{ p.name }}
                </h3>
                
                <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-8 font-medium leading-relaxed opacity-80">
                  {{ p.description || 'Sin especificaciones técnicas documentadas...' }}
                </p>

                <div class="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-800/50">
                   <div class="flex flex-col">
                      <span class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Ciclo Estándar</span>
                      <div class="flex items-center gap-2">
                        <ng-icon name="heroClockSolid" class="text-indigo-500"></ng-icon>
                        <span class="text-sm font-black text-slate-700 dark:text-slate-300">{{ p.standard_duration_minutes || 0 }} <span class="text-[10px] opacity-50 uppercase">Minutos</span></span>
                      </div>
                   </div>
                   
                   <button (click)="deleteProcess($event, p)" 
                           class="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100">
                      <ng-icon name="heroTrashSolid" class="w-5 h-5"></ng-icon>
                   </button>
                </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!isLoading() && processes().length === 0" 
             class="flex flex-col items-center justify-center py-32 text-center bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800/50">
            <div class="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-200 dark:text-slate-700 mb-8 border border-white dark:border-slate-800">
                <ng-icon name="heroQueueListSolid" class="w-12 h-12"></ng-icon>
            </div>
            <h3 class="text-2xl font-black text-slate-400 dark:text-white uppercase italic tracking-tighter mb-2">Ingeniería Vacía</h3>
            <p class="text-xs font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-600">No se han definido rutas de manufactura para este tenant</p>
            <button (click)="createProcess()" class="mt-10 px-8 py-4 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform">
                Iniciar Configuración
            </button>
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
        await this.mfgRepo.deleteProcess(process.id!);
        this.notification.success('Proceso eliminado');
        this.loadProcesses();
      } catch (error) {
        console.error(error);
        this.notification.error('No se pudo eliminar el proceso (puede tener órdenes vinculadas)');
      }
    }
  }
}
