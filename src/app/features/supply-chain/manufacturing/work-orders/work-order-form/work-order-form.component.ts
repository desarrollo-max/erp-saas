
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
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      
      <!-- Decorative -->
      <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>

      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
        <div>
          <button (click)="goBack()" class="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-black uppercase tracking-widest mb-4">
            <ng-icon name="heroArrowLeftSolid"></ng-icon>
            Volver a Órdenes
          </button>
          <h1 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
            {{ isNew() ? 'Nueva Orden de Trabajo' : 'Detalle de Orden' }}
          </h1>
        </div>
        
        <div class="flex gap-3">
          <button (click)="saveOrder()" 
                  [disabled]="orderForm.invalid || isSubmitting()"
                  class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 flex items-center gap-2">
            <ng-icon name="heroCheckCircleSolid" class="w-4 h-4"></ng-icon>
            {{ isNew() ? 'Lanzar Producción' : 'Actualizar Orden' }}
          </button>
        </div>
      </div>

      <div class="max-w-4xl mx-auto relative z-10">
        <form [formGroup]="orderForm" class="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <!-- Product & Process Selection -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
            <h4 class="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase italic">Configuración de Producto</h4>
            
            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Producto a Producir</label>
              <select formControlName="product_id" 
                      class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none">
                <option value="" disabled>Seleccionar Producto...</option>
                <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Cantidad</label>
                <input type="number" formControlName="quantity"
                       class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium">
              </div>
              <div>
                 <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Prioridad</label>
                 <select formControlName="priority" 
                         class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none">
                   <option value="LOW">Baja</option>
                   <option value="MEDIUM">Media</option>
                   <option value="HIGH">Alta</option>
                   <option value="URGENTE">Urgente</option>
                 </select>
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Proceso de Manufactura (Ruta)</label>
              <select formControlName="process_id" (change)="onProcessChange()"
                      class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none">
                <option value="" disabled>Seleccionar Ruta...</option>
                <option *ngFor="let pr of processes()" [value]="pr.id">{{ pr.name }}</option>
              </select>
            </div>

            <div *ngIf="stages().length > 0">
              <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Etapa Inicial</label>
              <select formControlName="current_stage_id"
                      class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none">
                <option *ngFor="let s of stages()" [value]="s.id">{{ s.name }}</option>
              </select>
            </div>
          </div>

          <!-- Scheduling & Notes -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl space-y-6">
             <h4 class="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase italic">Programación</h4>
             
             <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Número de Orden</label>
                <input type="text" formControlName="order_number" placeholder="WO-XXXX" [readonly]="!isNew()"
                       class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium uppercase">
                <p class="text-[9px] font-bold text-slate-400 mt-1 ml-1 uppercase italic">Generado automáticamente si se deja vacío</p>
             </div>

             <div class="grid grid-cols-2 gap-4">
                <div>
                   <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Fecha de Inicio</label>
                   <input type="date" formControlName="start_date"
                          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium">
                </div>
                <div>
                   <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Fecha de Entrega</label>
                   <input type="date" formControlName="due_date"
                          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium">
                </div>
             </div>

             <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Instrucciones / Notas</label>
                <textarea formControlName="notes" rows="4" placeholder="Especificaciones adicionales de producción..."
                          class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium"></textarea>
             </div>

             <div *ngIf="!isNew()" class="p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-900">
                <div class="flex justify-between items-center mb-1">
                   <span class="text-[10px] font-black text-indigo-600 uppercase">Estado Actual</span>
                   <span class="text-xs font-black text-indigo-900 dark:text-white uppercase italic">{{ orderForm.get('status')?.value }}</span>
                </div>
                <div class="h-1.5 w-full bg-indigo-100 dark:bg-indigo-900 rounded-full overflow-hidden">
                   <div class="h-full bg-indigo-600" [style.width.%]="40"></div>
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
