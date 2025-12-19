
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { ManufacturingRepository } from '@core/repositories/manufacturing.repository';
import { SessionService } from '@core/services/session.service';
import { MfgProcess, MfgStage } from '@core/models/erp.types';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-process-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 animate-fade-in">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <button (click)="goBack()" class="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-black uppercase tracking-widest mb-4">
            <ng-icon name="heroArrowLeftSolid"></ng-icon>
            Volver a Procesos
          </button>
          <h1 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
            {{ isNew() ? 'Nuevo Proceso' : 'Configuración de Proceso' }}
          </h1>
        </div>
        
        <div class="flex gap-3">
          <button (click)="saveProcess()" 
                  [disabled]="processForm.invalid || isSubmitting()"
                  class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 flex items-center gap-2">
            <ng-icon name="heroCheckCircleSolid" class="w-4 h-4"></ng-icon>
            {{ isNew() ? 'Crear Proceso' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Main Form -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
            <h4 class="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase italic">Información General</h4>
            
            <form [formGroup]="processForm" class="space-y-4">
              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Nombre del Proceso</label>
                <input type="text" formControlName="name" placeholder="Ej: Montado de Calzado"
                       class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium">
              </div>

              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Código Identificador</label>
                <input type="text" formControlName="code" placeholder="Ej: MFG-001"
                       class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium uppercase">
              </div>

              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Duración Estándar (min)</label>
                <input type="number" formControlName="standard_duration_minutes"
                       class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium">
              </div>

              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Descripción</label>
                <textarea formControlName="description" rows="3"
                          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"></textarea>
              </div>

              <div class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <input type="checkbox" formControlName="is_active" id="is_active" class="w-4 h-4 text-indigo-600 rounded">
                <label for="is_active" class="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">Proceso Activo</label>
              </div>
            </form>
          </div>
        </div>

        <!-- Stages Management -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl min-h-[500px]">
            <div class="flex justify-between items-center mb-8">
              <h4 class="text-lg font-black text-slate-900 dark:text-white uppercase italic">Ruta de Producción (Etapas)</h4>
              <button (click)="addStage()" *ngIf="!isNew()"
                      class="px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                <ng-icon name="heroPlusCircleSolid" class="w-4 h-4"></ng-icon>
                Agregar Etapa
              </button>
            </div>

            <div *ngIf="isNew()" class="py-20 text-center bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
               <ng-icon name="heroInformationCircleSolid" class="w-12 h-12 text-slate-300 mx-auto mb-4"></ng-icon>
               <p class="text-slate-400 font-bold text-sm">Primero crea el proceso para poder definir sus etapas.</p>
            </div>

            <div *ngIf="!isNew()" class="space-y-4">
               <div *ngFor="let stage of stages(); let i = index" 
                    class="group p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center gap-6 hover:border-indigo-300 transition-all">
                  
                  <div class="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-100 dark:shadow-none">
                    {{ i + 1 }}
                  </div>

                  <div class="flex-grow">
                     <h5 class="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{{ stage.name }}</h5>
                     <p class="text-[10px] text-slate-400 font-bold uppercase">{{ stage.description || 'Sin descripción' }}</p>
                  </div>

                  <div class="flex items-center gap-4">
                     <div *ngIf="stage.is_quality_control_point" 
                          class="px-2 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-lg text-[9px] font-black uppercase border border-amber-100 dark:border-amber-900">
                        Punto de Control
                     </div>
                     
                     <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="editStage(stage)" class="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                          <ng-icon name="heroPencilSquareSolid" class="w-5 h-5"></ng-icon>
                        </button>
                        <button (click)="deleteStage(stage)" class="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                          <ng-icon name="heroTrashSolid" class="w-5 h-5"></ng-icon>
                        </button>
                     </div>
                  </div>
               </div>

               <div *ngIf="stages().length === 0" class="py-20 text-center">
                  <ng-icon name="heroQueueListSolid" class="w-12 h-12 text-slate-200 mx-auto mb-4"></ng-icon>
                  <p class="text-slate-400 text-sm font-medium italic">No hay etapas definidas para esta ruta.</p>
               </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Modal para Etapas (Simplificado) -->
    <div *ngIf="showStageModal()" class="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
       <div class="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-scale-in">
          <h3 class="text-xl font-black text-slate-900 dark:text-white mb-6 uppercase italic">
            {{ editingStage() ? 'Editar Etapa' : 'Nueva Etapa' }}
          </h3>
          
          <div class="space-y-4">
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Nombre de la Etapa</label>
              <input type="text" [(ngModel)]="stageBuffer.name" placeholder="Ej: Corte, Costura..."
                     class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium">
            </div>
            
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Descripción</label>
              <textarea [(ngModel)]="stageBuffer.description" rows="2"
                        class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"></textarea>
            </div>

            <div class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <input type="checkbox" [(ngModel)]="stageBuffer.is_quality_control_point" id="is_qc" class="w-4 h-4 text-indigo-600 rounded">
              <label for="is_qc" class="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">Punto de Control de Calidad</label>
            </div>
          </div>

          <div class="flex gap-3 mt-8">
            <button (click)="closeStageModal()" class="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancelar</button>
            <button (click)="saveStage()" 
                    [disabled]="!stageBuffer.name"
                    class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50">Confirmar</button>
          </div>
       </div>
    </div>
  `,
  styles: [`
    .animate-scale-in { animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class ProcessDetailComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mfgRepo = inject(ManufacturingRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);

  isNew = signal(false);
  isSubmitting = signal(false);
  processId = signal<string | null>(null);
  stages = signal<MfgStage[]>([]);

  processForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    code: ['', [Validators.required]],
    description: [''],
    standard_duration_minutes: [0],
    is_active: [true]
  });

  // Stage Modal State
  showStageModal = signal(false);
  editingStage = signal<MfgStage | null>(null);
  stageBuffer: Partial<MfgStage> = {};

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'nuevo') {
      this.isNew.set(true);
    } else if (id) {
      this.processId.set(id);
      await this.loadProcessData(id);
    }
  }

  async loadProcessData(id: string) {
    try {
      const tenantId = this.session.currentTenantId();
      if (!tenantId) return;

      const processes = await this.mfgRepo.getProcesses(tenantId);
      const process = processes.find(p => p.id === id);

      if (process) {
        this.processForm.patchValue(process);
        const stages = await this.mfgRepo.getProcessStages(id);
        this.stages.set(stages);
      } else {
        this.notification.error('Proceso no encontrado');
        this.goBack();
      }
    } catch (error) {
      console.error(error);
      this.notification.error('Error al cargar datos del proceso');
    }
  }

  async saveProcess() {
    if (this.processForm.invalid) return;

    this.isSubmitting.set(true);
    try {
      const tenantId = this.session.currentTenantId();
      if (!tenantId) return;

      const formValue = this.processForm.value;

      if (this.isNew()) {
        const newProcess = await this.mfgRepo.createProcess({
          ...formValue,
          tenant_id: tenantId
        });
        this.notification.success('Proceso creado exitosamente');
        this.router.navigate(['/produccion/procesos', newProcess.id]);
      } else {
        await this.mfgRepo.updateProcess(this.processId()!, formValue);
        this.notification.success('Proceso actualizado');
      }
    } catch (error) {
      console.error(error);
      this.notification.error('Error al guardar el proceso');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/produccion/procesos']);
  }

  // Stage Management
  addStage() {
    this.editingStage.set(null);
    this.stageBuffer = {
      name: '',
      description: '',
      is_quality_control_point: false,
      order_index: this.stages().length
    };
    this.showStageModal.set(true);
  }

  editStage(stage: MfgStage) {
    this.editingStage.set(stage);
    this.stageBuffer = { ...stage };
    this.showStageModal.set(true);
  }

  closeStageModal() {
    this.showStageModal.set(false);
    this.editingStage.set(null);
    this.stageBuffer = {};
  }

  async saveStage() {
    if (!this.stageBuffer.name) return;

    try {
      if (this.editingStage()) {
        await this.mfgRepo.updateStage(this.editingStage()!.id, this.stageBuffer);
        this.notification.success('Etapa actualizada');
      } else {
        await this.mfgRepo.createStage({
          ...this.stageBuffer,
          process_id: this.processId()!,
          order_index: this.stages().length
        });
        this.notification.success('Etapa agregada');
      }

      // Reload stages
      const stages = await this.mfgRepo.getProcessStages(this.processId()!);
      this.stages.set(stages);
      this.closeStageModal();
    } catch (error) {
      console.error(error);
      this.notification.error('Error al guardar la etapa');
    }
  }

  async deleteStage(stage: MfgStage) {
    if (confirm(`¿Eliminar la etapa "${stage.name}"?`)) {
      try {
        await this.mfgRepo.deleteStage(stage.id);
        this.notification.success('Etapa eliminada');
        const stages = await this.mfgRepo.getProcessStages(this.processId()!);
        this.stages.set(stages);
      } catch (error) {
        console.error(error);
        this.notification.error('No se pudo eliminar la etapa');
      }
    }
  }
}
