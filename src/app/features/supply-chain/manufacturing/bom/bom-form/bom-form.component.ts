
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { ManufacturingRepository } from '@core/repositories/manufacturing.repository';
import { ProductRepository } from '@core/repositories/product.repository';
import { SessionService } from '@core/services/session.service';
import { MfgBillOfMaterials, ScmProduct } from '@core/models/erp.types';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-bom-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
        <div>
          <button (click)="goBack()" class="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors text-xs font-black uppercase tracking-widest mb-4">
            <ng-icon name="heroArrowLeftSolid"></ng-icon>
            Volver a Lista
          </button>
          <h1 class="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase italic">
            {{ isNew() ? 'Nueva Receta de Producción' : 'Editar Receta' }}
          </h1>
        </div>
        
        <div class="flex gap-3">
          <button (click)="saveBom()" 
                  [disabled]="bomForm.invalid || isSubmitting()"
                  class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 flex items-center gap-2">
            <ng-icon name="heroCheckCircleSolid" class="w-4 h-4"></ng-icon>
            {{ isNew() ? 'Crear Receta' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        <!-- Header Info -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl">
            <h4 class="text-lg font-black text-slate-900 dark:text-white mb-6 uppercase italic">Cabecera de BOM</h4>
            
            <form [formGroup]="bomForm" class="space-y-4">
              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Producto Terminado</label>
                <select formControlName="finished_product_id" 
                        class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium appearance-none">
                  <option value="" disabled>Seleccionar Producto...</option>
                  <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
                </select>
              </div>

              <div>
                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Nombre de la Receta</label>
                <input type="text" formControlName="name" placeholder="Ej: Standard, Edición Especial..."
                       class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium">
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Versión</label>
                  <input type="text" formControlName="version" placeholder="1.0"
                         class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium uppercase">
                </div>
                <div class="flex items-end pb-3">
                   <div class="flex items-center gap-3">
                      <input type="checkbox" formControlName="is_active" id="is_active" class="w-4 h-4 text-indigo-600 rounded">
                      <label for="is_active" class="text-xs font-black text-slate-600 dark:text-slate-300 uppercase">Activa</label>
                   </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- Components Management -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl min-h-[500px]">
            <div class="flex justify-between items-center mb-8">
              <h4 class="text-lg font-black text-slate-900 dark:text-white uppercase italic">Explosión de Materiales</h4>
              <button (click)="addComponent()"
                      class="px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">
                <ng-icon name="heroPlusCircleSolid" class="w-4 h-4"></ng-icon>
                Agregar Material
              </button>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                    <th class="pb-4 pl-2">Componente (Materia Prima)</th>
                    <th class="pb-4 text-center">Cantidad</th>
                    <th class="pb-4 text-center">Merma %</th>
                    <th class="pb-4 text-right"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
                  <tr *ngFor="let item of bomItems.controls; let i = index" [formGroup]="getGroup(item)" class="group">
                    <td class="py-4 pr-4">
                      <select formControlName="component_product_id"
                              class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 appearance-none">
                        <option value="" disabled>Seleccionar Material...</option>
                        <option *ngFor="let p of products()" [value]="p.id">{{ p.name }} ({{ p.sku }})</option>
                      </select>
                    </td>
                    <td class="py-4 px-2 w-32">
                      <input type="number" formControlName="quantity" min="0" step="0.01"
                             class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-center focus:ring-2 focus:ring-indigo-500">
                    </td>
                    <td class="py-4 px-2 w-32">
                      <input type="number" formControlName="wastage_percent" min="0" max="100"
                             class="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-medium text-center focus:ring-2 focus:ring-indigo-500">
                    </td>
                    <td class="py-4 text-right">
                      <button (click)="removeComponent(i)" class="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                        <ng-icon name="heroTrashSolid" class="w-5 h-5"></ng-icon>
                      </button>
                    </td>
                  </tr>

                  <tr *ngIf="bomItems.length === 0">
                    <td colspan="4" class="py-20 text-center opacity-40 italic text-sm">
                       No se han agregado materiales a esta receta.
                    </td>
                  </tr>
                </tbody>
              </table>
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
export class BomFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private mfgRepo = inject(ManufacturingRepository);
  private productRepo = inject(ProductRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);

  isNew = signal(false);
  isSubmitting = signal(false);
  bomId = signal<string | null>(null);
  products = signal<ScmProduct[]>([]);

  bomForm: FormGroup = this.fb.group({
    finished_product_id: ['', [Validators.required]],
    name: ['', [Validators.required]],
    version: ['1.0', [Validators.required]],
    is_active: [true],
    items: this.fb.array([])
  });

  get bomItems() {
    return this.bomForm.get('items') as FormArray;
  }

  getGroup(item: any): FormGroup {
    return item as FormGroup;
  }

  async ngOnInit() {
    await this.loadProducts();
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'nuevo') {
      this.isNew.set(true);
      this.addComponent(); // Start with one empty component line
    } else if (id) {
      this.bomId.set(id);
      await this.loadBomData(id);
    }
  }

  async loadProducts() {
    try {
      const tenantId = this.session.currentTenantId();
      if (tenantId) {
        const data = await this.productRepo.getAll(tenantId);
        this.products.set(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async loadBomData(id: string) {
    try {
      const tenantId = this.session.currentTenantId();
      if (!tenantId) return;

      const boms = await this.mfgRepo.getBoms(tenantId);
      const bom = boms.find(b => b.id === id);

      if (bom) {
        this.bomForm.patchValue({
          finished_product_id: bom.finished_product_id,
          name: bom.name,
          version: bom.version,
          is_active: bom.is_active
        });

        const items = await this.mfgRepo.getBomItems(id);
        items.forEach(item => {
          this.bomItems.push(this.fb.group({
            id: [item.id],
            component_product_id: [item.component_product_id, [Validators.required]],
            quantity: [item.quantity, [Validators.required, Validators.min(0.0001)]],
            wastage_percent: [item.wastage_percent || 0]
          }));
        });
      }
    } catch (error) {
      console.error(error);
      this.notification.error('Error al cargar datos del BOM');
    }
  }

  addComponent() {
    this.bomItems.push(this.fb.group({
      component_product_id: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(0.0001)]],
      wastage_percent: [0]
    }));
  }

  removeComponent(index: number) {
    const item = this.bomItems.at(index).value;
    if (item.id && !this.isNew()) {
      if (confirm('¿Eliminar este material de la base de datos?')) {
        this.mfgRepo.deleteBomItem(item.id).then(() => {
          this.bomItems.removeAt(index);
          this.notification.success('Material eliminado');
        });
      }
    } else {
      this.bomItems.removeAt(index);
    }
  }

  async saveBom() {
    if (this.bomForm.invalid) return;

    this.isSubmitting.set(true);
    try {
      const tenantId = this.session.currentTenantId();
      if (!tenantId) return;

      const { items, ...header } = this.bomForm.value;

      let currentBomId = this.bomId();

      if (this.isNew()) {
        const newBom = await this.mfgRepo.createBom({
          ...header,
          tenant_id: tenantId
        });
        currentBomId = newBom.id;
        this.bomId.set(currentBomId);
        this.isNew.set(false);
      } else {
        await this.mfgRepo.updateBom(currentBomId!, header);
      }

      // Save Items
      for (const item of items) {
        if (!item.id) {
          await this.mfgRepo.createBomItem({
            ...item,
            bom_id: currentBomId
          });
        }
        // update logic if needed, usually BOM items are replaced or deleted/added
      }

      this.notification.success('Receta guardada exitosamente');
      this.router.navigate(['/produccion/bom']);
    } catch (error) {
      console.error(error);
      this.notification.error('Error al guardar la receta');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/produccion/bom']);
  }
}
