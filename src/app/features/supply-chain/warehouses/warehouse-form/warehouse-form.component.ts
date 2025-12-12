import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { InventoryService } from '../../../../core/services/inventory.service';
import { ScmWarehouse } from '../../../../core/models/erp.types';

@Component({
    selector: 'app-warehouse-form',
    standalone: true,
    imports: [CommonModule, RouterModule, ReactiveFormsModule, LucideAngularModule],
    template: `
    <div class="p-6 bg-gray-50 min-h-screen flex justify-center">
       <div class="max-w-2xl w-full">
            <div class="mb-6">
                <button routerLink="/cadena-suministro/almacenes" class="flex items-center text-gray-500 hover:text-gray-700 mb-4 transition-colors">
                <lucide-icon name="arrow-left" class="w-4 h-4 mr-1"></lucide-icon>
                    Volver a Almacenes
                </button>
                <h1 class="text-2xl font-bold text-gray-900">{{ isNew ? 'Nuevo Almacén' : 'Editar Almacén' }}</h1>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <form [formGroup]="form" (ngSubmit)="save()">
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Código</label>
                                <input type="text" formControlName="code" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">Nombre</label>
                                <input type="text" formControlName="name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">Dirección</label>
                            <textarea formControlName="address" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"></textarea>
                        </div>

                         <div class="flex items-center space-x-4">
                            <div class="flex items-center">
                                <input type="checkbox" formControlName="is_active" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                <label class="ml-2 block text-sm text-gray-900">Activo</label>
                            </div>
                            <div class="flex items-center">
                                <input type="checkbox" formControlName="is_default" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                <label class="ml-2 block text-sm text-gray-900">Predeterminado</label>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 flex justify-end gap-3">
                         <button type="button" routerLink="/cadena-suministro/almacenes" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                        <button type="submit" [disabled]="form.invalid || loading" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                            {{ loading ? 'Guardando...' : 'Guardar' }}
                        </button>
                    </div>
                </form>
            </div>
       </div>
    </div>
  `
})
export class WarehouseFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private service = inject(InventoryService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    form: FormGroup;
    loading = false;
    isNew = true;
    warehouseId: string | null = null;

    constructor() {
        this.form = this.fb.group({
            code: ['', Validators.required],
            name: ['', Validators.required],
            address: [''],
            is_active: [true],
            is_default: [false],
            company_id: ['c1'], // Mock
            tenant_id: ['t1'] // Mock
        });
    }

    async ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id && id !== 'new') {
            this.isNew = false;
            this.warehouseId = id;
            await this.loadWarehouse(id);
        } else {
            this.form.patchValue({
                code: 'WH-' + Math.floor(Math.random() * 1000)
            });
        }
    }

    async loadWarehouse(id: string) {
        // Not implemented in Service/Repo getById yet, so we cheat and filter from getAll
        // In real app use getById
        const all = await this.service.getWarehouses('t1');
        const wh = all.find(w => w.id === id);
        if (wh) {
            this.form.patchValue(wh);
        }
    }

    async save() {
        if (this.form.invalid) return;
        this.loading = true;
        try {
            const val = this.form.value;
            if (this.isNew) {
                await this.service.createWarehouse(val);
            } else {
                await this.service.updateWarehouse(this.warehouseId!, val);
            }
            this.router.navigate(['/cadena-suministro/almacenes']);
        } catch (e) {
            console.error(e);
        } finally {
            this.loading = false;
        }
    }
}
