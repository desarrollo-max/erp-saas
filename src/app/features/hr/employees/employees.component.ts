import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HRRepository } from '@core/repositories/hr.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { HrEmployee } from '@core/models/erp.types';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 animate-fade-in">
      
      <!-- TOP SECTION -->
      <div class="p-8 pb-4">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h1 class="text-4xl font-black tracking-tighter mb-1">Equipo Humano</h1>
                <p class="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Recursos Humanos / Nómina Directa</p>
            </div>
            <div class="flex items-center gap-3 w-full md:w-auto">
                <div class="relative flex-grow md:flex-none">
                    <ng-icon name="heroMagnifyingGlassSolid" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></ng-icon>
                    <input type="text" placeholder="Buscar talento..." class="w-full md:w-64 pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                </div>
                <button (click)="openModal()" class="px-8 py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-2xl font-black text-sm shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                    <ng-icon name="heroPlusSolid" class="w-5 h-5"></ng-icon>
                    Nuevo
                </button>
            </div>
        </div>

        <!-- FILTERS / CHIPS -->
        <div class="flex gap-2 mt-8 overflow-x-auto pb-4 scrollbar-hide">
            <button class="px-5 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none">Todos</button>
            <button class="px-5 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 transition-colors">Producción</button>
            <button class="px-5 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 transition-colors">Ventas</button>
            <button class="px-5 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 transition-colors">Administración</button>
        </div>
      </div>

      <!-- GRID OF EMPLOYEES (Visual approach) -->
      <div class="flex-grow p-8 pt-0 overflow-y-auto">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            <div *ngFor="let emp of employees()" class="group bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-indigo-500/50 transition-all duration-300 relative overflow-hidden">
                <!-- Status Badge -->
                <div class="absolute top-6 right-6">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 block shadow-lg shadow-emerald-200 animate-pulse"></span>
                </div>

                <div class="flex flex-col items-center text-center">
                    <div class="w-24 h-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 border-4 border-white dark:border-slate-900 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span class="text-3xl font-black text-slate-300 dark:text-slate-600 uppercase">{{ emp.first_name.charAt(0) }}{{ emp.last_name.charAt(0) }}</span>
                    </div>
                    <h3 class="text-xl font-black text-slate-900 dark:text-white line-clamp-1">{{ emp.first_name }} {{ emp.last_name }}</h3>
                    <p class="text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest mt-1">{{ emp.position || 'Colaborador' }}</p>
                    
                    <div class="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 w-full grid grid-cols-2 gap-2 text-left">
                        <div>
                            <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nómina</p>
                            <p class="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">{{ emp.contract_type || 'Semanal' }}</p>
                        </div>
                        <div>
                            <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Antigüedad</p>
                            <p class="text-xs font-bold text-slate-600 dark:text-slate-400">1.2 años</p>
                        </div>
                    </div>

                    <div class="mt-6 flex gap-2 w-full">
                        <button class="flex-grow py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-750 transition-all">Perfil</button>
                        <button class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 transition-all">
                             <ng-icon name="heroEnvelopeSolid" class="w-4 h-4"></ng-icon>
                        </button>
                    </div>
                </div>
            </div>

            <div *ngIf="employees().length === 0" class="col-span-full py-40 flex flex-col items-center opacity-40">
                <ng-icon name="heroUsersSolid" class="w-20 h-20 mb-4"></ng-icon>
                <p class="font-black text-sm uppercase tracking-widest">No hay talento registrado</p>
            </div>
        </div>
      </div>

      <!-- NEW EMPLOYEE MODAL (Premium Pattern) -->
      <div *ngIf="showModal()" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-md" (click)="closeModal()"></div>
          <div class="relative bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transform animate-scale-up">
               <div class="p-10 border-b border-slate-100 dark:border-slate-800">
                    <h2 class="text-3xl font-black tracking-tight">Expandir Equipo</h2>
                    <p class="text-slate-400 font-medium text-sm mt-1">Ingresa los datos del nuevo colaborador para el alta en nómina.</p>
               </div>
               
               <form [formGroup]="empForm" (ngSubmit)="saveEmployee()" class="p-10 pt-6 space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                        <div class="col-span-1">
                            <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Nombre(s)</label>
                            <input formControlName="first_name" type="text" class="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold">
                        </div>
                        <div class="col-span-1">
                            <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Apellidos</label>
                            <input formControlName="last_name" type="text" class="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold">
                        </div>
                        <div class="col-span-2">
                            <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Correo Corporativo</label>
                            <input formControlName="email" type="email" placeholder="talento@empresa.com" class="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold">
                        </div>
                        <div class="col-span-1">
                            <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Posición / Puesto</label>
                            <input formControlName="position" type="text" class="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold">
                        </div>
                        <div class="col-span-1">
                            <label class="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Esquema Pago</label>
                            <select formControlName="contract_type" class="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-bold appearance-none">
                                <option value="semanal">Semanal (Destajo/Jornada)</option>
                                <option value="quincenal">Quincenal (Administrativo)</option>
                                <option value="honorarios">Honorarios</option>
                            </select>
                        </div>
                    </div>

                    <div class="pt-8 flex justify-end gap-3 mt-4">
                        <button type="button" (click)="closeModal()" class="px-8 py-4 font-black text-slate-400 hover:text-slate-600 transition-all uppercase text-[10px] tracking-widest">Descartar</button>
                        <button type="submit" [disabled]="empForm.invalid" class="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 disabled:opacity-50 transition-all text-sm uppercase">Dar de Alta</button>
                    </div>
               </form>
          </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
    .animate-scale-up {
      animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
  `]
})
export class EmployeesComponent implements OnInit {
  private hrRepo = inject(HRRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);
  private fb = inject(FormBuilder);

  employees = signal<HrEmployee[]>([]);
  isLoading = signal(true);
  showModal = signal(false);
  empForm: FormGroup;

  constructor() {
    this.empForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      position: ['', Validators.required],
      contract_type: ['semanal', Validators.required]
    });
  }

  async ngOnInit() {
    await this.loadEmployees();
  }

  async loadEmployees() {
    this.isLoading.set(true);
    try {
      const tenantId = this.session.currentTenantId();
      if (tenantId) {
        const data = await this.hrRepo.getEmployees(tenantId);
        if (data && data.length > 0) {
          this.employees.set(data);
        } else {
          // Fallback / Seed mock
          this.employees.set([
            { id: '1', first_name: 'Mateo', last_name: 'García', position: 'Líder de Producción', contract_type: 'quincenal', status: 'active' } as any,
            { id: '2', first_name: 'Elena', last_name: 'Rivas', position: 'Diseñador Industrial', contract_type: 'quincenal', status: 'active' } as any,
            { id: '3', first_name: 'Joaquín', last_name: 'Sánchez', position: 'Operador Especialista', contract_type: 'semanal', status: 'active' } as any,
            { id: '4', first_name: 'Sofía', last_name: 'Méndez', position: 'Control de Calidad', contract_type: 'semanal', status: 'active' } as any
          ]);
        }
      }
    } catch (e) {
      console.error(e);
      this.notification.error('Error al sincronizar plantilla de personal');
    } finally {
      this.isLoading.set(false);
    }
  }

  openModal() { this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  async saveEmployee() {
    if (this.empForm.invalid) return;

    const tenantId = this.session.currentTenantId();
    const companyId = this.session.currentCompany()?.id;

    if (!tenantId || !companyId) {
      this.notification.error('Error de sesión: Falta organización');
      return;
    }

    try {
      const payload: Partial<HrEmployee> = {
        ...this.empForm.value,
        tenant_id: tenantId,
        company_id: companyId,
        status: 'active'
      };

      await this.hrRepo.createEmployee(payload);
      this.notification.success('Colaborador registrado exitosamente');
      this.closeModal();
      this.empForm.reset({ contract_type: 'semanal' });
      await this.loadEmployees();
    } catch (e) {
      this.notification.error('Error persistiendo datos del empleado');
    }
  }
}
