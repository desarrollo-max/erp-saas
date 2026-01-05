
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { ManufacturingRepository } from '@core/repositories/manufacturing.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { SessionService } from '@core/services/session.service';
import { MfgProcess, ScmProduct, MfgStage } from '@core/models/erp.types';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-work-order-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 sm:p-10 animate-fade-in relative overflow-hidden transition-colors duration-500">
      
      <!-- Premium Background Elements -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.08)_0%,transparent_50%)] pointer-events-none"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.08)_0%,transparent_50%)] pointer-events-none"></div>

      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 relative z-10">
        <div class="space-y-4">
          <button (click)="goBack()" class="flex items-center gap-3 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-[10px] font-black uppercase tracking-[0.3em] group">
            <ng-icon name="heroArrowLeftSolid" class="group-hover:-translate-x-1 transition-transform"></ng-icon>
            Volver al Panel
          </button>
          <h1 class="text-4xl font-black tracking-tighter text-slate-900 dark:text-white uppercase italic drop-shadow-sm">
            {{ isNew() ? 'Lanzar Nueva' : 'Detalle de' }} <span class="text-indigo-600 dark:text-indigo-400">Orden</span>
          </h1>
        </div>
        
        <div class="flex gap-4">
          <button (click)="saveOrder()" 
                  [disabled]="orderForm.invalid || isSubmitting()"
                  class="px-8 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-900 dark:hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-3 group active:scale-95">
            <ng-icon name="heroCheckCircleSolid" class="w-6 h-6 group-hover:scale-110 transition-transform"></ng-icon>
            {{ isNew() ? 'Lanzar Producción' : 'Sincronizar Cambios' }}
          </button>
        </div>
      </div>

      <div class="max-w-5xl mx-auto relative z-10 pb-20">
        <form [formGroup]="orderForm" class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <!-- Product & Process Selection (Main Column) -->
          <div class="lg:col-span-7 space-y-8">
            <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-[3rem] border border-white dark:border-slate-800 shadow-xl space-y-8">
                <div class="flex items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-6 mb-6">
                    <div class="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                        <ng-icon name="heroSquare3Stack3dSolid" class="w-6 h-6"></ng-icon>
                    </div>
                    <h4 class="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Núcleo de Producción</h4>
                </div>
                
                <div class="space-y-6">
                    <div>
                      <label class="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-4">Especificación de Producto</label>
                      <select formControlName="product_id" 
                              class="app-input !rounded-[1.5rem] !bg-slate-50 dark:!bg-slate-800/50 !border-slate-100 dark:!border-slate-800 font-bold text-sm appearance-none cursor-pointer">
                        <option value="" disabled>Elegir recurso técnico...</option>
                        <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} &bull; {{ p.sku }}</option>
                      </select>
                    </div>

                    <div class="grid grid-cols-2 gap-6">
                      <div>
                        <label class="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-4">Volumen Total</label>
                        <div class="relative group">
                            <input type="number" formControlName="quantity"
                               class="app-input !rounded-[1.5rem] !bg-slate-50 dark:!bg-slate-800/50 !border-slate-100 dark:!border-slate-800 font-black text-indigo-600 dark:text-indigo-400">
                            <span class="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase">UNIDADES</span>
                        </div>
                      </div>
                      <div>
                         <label class="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-4">Nivel de Prioridad</label>
                         <select formControlName="priority" 
                                 class="app-input !rounded-[1.5rem] !bg-slate-50 dark:!bg-slate-800/50 !border-slate-100 dark:!border-slate-800 font-bold appearance-none cursor-pointer">
                           <option value="LOW">BAJA &bull; P3</option>
                           <option value="MEDIUM">MEDIA &bull; P2</option>
                           <option value="HIGH">ALTA &bull; P1</option>
                           <option value="URGENTE">CRÍTICA &bull; P0</option>
                         </select>
                      </div>
                    </div>

                    <div>
                      <label class="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-4">Estrategia de Ruta (Workflow)</label>
                      <select formControlName="process_id" (change)="onProcessChange()"
                              class="app-input !rounded-[1.5rem] !bg-slate-50 dark:!bg-slate-800/50 !border-slate-100 dark:!border-slate-800 font-bold appearance-none cursor-pointer">
                        <option value="" disabled>Definir flujo de trabajo...</option>
                        <option *ngFor="let pr of processes()" [value]="pr.id">{{ pr.name }}</option>
                      </select>
                    </div>

                    <div *ngIf="stages().length > 0" class="animate-in fade-in slide-in-from-top-2 duration-500">
                      <label class="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-4">Punto de Inserción (Etapa)</label>
                      <select formControlName="current_stage_id"
                              class="app-input !rounded-[1.5rem] !bg-slate-100 dark:!bg-slate-900 border-indigo-500/20 font-bold text-indigo-600 dark:text-indigo-400 appearance-none cursor-pointer">
                        <option *ngFor="let s of stages()" [value]="s.id">{{ s.name }}</option>
                      </select>
                    </div>
                </div>
            </div>

            <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-[3rem] border border-white dark:border-slate-800 shadow-xl">
                 <div class="flex items-center gap-4 mb-8">
                    <div class="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center">
                        <ng-icon name="heroDocumentTextSolid" class="w-6 h-6"></ng-icon>
                    </div>
                    <h4 class="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Memoria Técnica</h4>
                 </div>
                 <textarea formControlName="notes" rows="5" placeholder="Documentar especificaciones especiales, requerimientos de calidad o notas de ensamblaje..."
                           class="app-input !rounded-[1.5rem] !bg-slate-50 dark:!bg-slate-800/50 !border-slate-100 dark:!border-slate-800 font-medium resize-none"></textarea>
            </div>
          </div>

          <!-- Scheduling & Identity (Side Column) -->
          <div class="lg:col-span-5 space-y-8">
             <div class="bg-slate-900 dark:bg-indigo-950 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden text-white border border-slate-800 dark:border-indigo-900">
                <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                
                <h4 class="text-lg font-black text-white uppercase italic tracking-tight mb-8">Identidad Digital</h4>
                
                <div class="space-y-6 relative z-10">
                    <div>
                        <label class="block text-[9px] font-black text-white/40 uppercase tracking-[0.3em] mb-2 ml-4">Codificación Global</label>
                        <input type="text" formControlName="order_number" placeholder="WO-AUTOMATIC" [readonly]="!isNew()"
                               class="w-full bg-white/10 border border-white/10 rounded-[1.5rem] px-6 py-4 font-black uppercase tracking-widest text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all">
                        <p class="text-[8px] font-bold text-white/30 mt-3 ml-4 uppercase tracking-[0.2em] italic">Token único de rastreabilidad</p>
                    </div>

                    <div *ngIf="!isNew()" class="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                        <div class="flex justify-between items-center">
                            <span class="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Estatus Vivo</span>
                            <span class="text-xs font-black uppercase italic">{{ orderForm.get('status')?.value }}</span>
                        </div>
                        <div class="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                           <div class="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" [style.width.%]="60"></div>
                        </div>
                    </div>
                </div>
             </div>

             <div class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-10 rounded-[3rem] border border-white dark:border-slate-800 shadow-xl space-y-8">
                 <div class="flex items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-6 mb-6">
                    <div class="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 rounded-2xl flex items-center justify-center">
                        <ng-icon name="heroCalendarDaysSolid" class="w-6 h-6"></ng-icon>
                    </div>
                    <h4 class="text-lg font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Cronograma</h4>
                 </div>

                 <div class="space-y-6">
                    <div>
                       <label class="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-4">Apertura de Línea</label>
                       <input type="date" formControlName="start_date"
                              class="app-input !rounded-[1.5rem] !bg-slate-50 dark:!bg-slate-800/50 !border-slate-100 dark:!border-slate-800 font-bold appearance-none">
                    </div>
                    <div>
                       <label class="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2 ml-4">Límite de Despacho (Due)</label>
                       <input type="date" formControlName="due_date"
                              class="app-input !rounded-[1.5rem] !bg-indigo-50 dark:!bg-indigo-500/5 !border-indigo-100 dark:!border-indigo-500/20 font-black text-indigo-600 dark:text-indigo-400 appearance-none">
                    </div>
                 </div>
                 
                 <div class="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                    <p class="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-relaxed">
                        El sistema recalculará automáticamente la carga de trabajo en base al tiempo estándar definido en la ingeniería del proceso.
                    </p>
                 </div>
             </div>
          </div>

        </form>
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class WorkOrderFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mfgRepo = inject(ManufacturingRepository);
  private productRepo = inject(ProductRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);

  isNew = signal(false);
  isSubmitting = signal(false);
  orderId = signal<string | null>(null);

  products = signal<ScmProduct[]>([]);
  processes = signal<MfgProcess[]>([]);
  stages = signal<MfgStage[]>([]);

  orderForm: FormGroup = this.fb.group({
    order_number: [''],
    product_id: ['', [Validators.required]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    process_id: ['', [Validators.required]],
    current_stage_id: ['', [Validators.required]],
    priority: ['MEDIUM', [Validators.required]],
    start_date: [new Date().toISOString().split('T')[0]],
    due_date: [''],
    notes: [''],
    status: ['DRAFT']
  });

  async ngOnInit() {
    await Promise.all([this.loadProducts(), this.loadProcesses()]);

    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'nuevo') {
      this.isNew.set(true);
      this.generateOrderNumber();
    } else if (id) {
      this.orderId.set(id);
      await this.loadOrderData(id);
    }
  }

  async loadProducts() {
    try {
      const tenantId = this.session.currentTenantId();
      if (tenantId) {
        const data = await this.productRepo.getAll(tenantId);
        // Map to only manufacturable products if needed, but for now all
        this.products.set(data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  async loadProcesses() {
    try {
      const tenantId = this.session.currentTenantId();
      if (tenantId) {
        const data = await this.mfgRepo.getProcesses(tenantId);
        this.processes.set(data.filter(p => p.is_active));
      }
    } catch (error) {
      console.error('Error loading processes:', error);
    }
  }

  generateOrderNumber() {
    const date = new Date();
    const prefix = 'WO';
    const random = Math.floor(Math.random() * 900) + 100;
    const orderNum = `${prefix}-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${random}`;
    this.orderForm.patchValue({ order_number: orderNum });
  }

  async onProcessChange() {
    const processId = this.orderForm.get('process_id')?.value;
    if (processId) {
      const stages = await this.mfgRepo.getProcessStages(processId);
      this.stages.set(stages);
      if (stages.length > 0) {
        this.orderForm.patchValue({ current_stage_id: stages[0].id });
      }
    }
  }

  async loadOrderData(id: string) {
    try {
      const order = await this.mfgRepo.getOrderById(id);
      if (order) {
        this.orderForm.patchValue({
          ...order,
          start_date: order.start_date?.split('T')[0],
          due_date: order.due_date?.split('T')[0]
        });
        await this.onProcessChange();
        this.orderForm.patchValue({ current_stage_id: order.current_stage_id });
      }
    } catch (error) {
      console.error('Error loading order:', error);
      this.notification.error('Error al cargar la orden de trabajo');
    }
  }

  async saveOrder() {
    if (this.orderForm.invalid) return;

    this.isSubmitting.set(true);
    try {
      const tenantId = this.session.currentTenantId();
      const companyId = this.session.currentCompanyId();
      if (!tenantId || !companyId) return;

      const formValue = this.orderForm.value;

      if (this.isNew()) {
        await this.mfgRepo.createProductionOrder({
          ...formValue,
          tenant_id: tenantId,
          company_id: companyId,
          status: 'PLANNED'
        });
        this.notification.success('Orden de producción generada exitosamente');
      } else {
        const orderId = this.orderId();
        if (orderId) {
          await this.mfgRepo.updateProductionOrder(orderId, formValue);
          this.notification.success('Orden de trabajo actualizada');
        }
      }
      this.goBack();
    } catch (error) {
      console.error(error);
      this.notification.error('Error al procesar la orden de trabajo');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/produccion/work-orders']);
  }
}
