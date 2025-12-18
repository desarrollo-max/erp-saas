import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SupplierRepository } from '@core/repositories/supplier.repository';
import { SessionService } from '@core/services/session.service';
import { Supplier } from '@core/models/erp.types';

@Component({
    selector: 'app-supplier-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconsModule],
    viewProviders: [provideIcons(heroIcons)],
    template: `
    <div class="min-h-screen bg-gray-50 dark:bg-slate-900 flex justify-center py-10 px-4">
       <div class="w-full max-w-3xl">
           
           <!-- HEADER -->
           <div class="flex items-center justify-between mb-6">
               <button (click)="cancel()" class="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition">
                   <ng-icon name="heroArrowLeftSolid" class="mr-1"></ng-icon> Cancelar
               </button>
               <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                   {{ isEditMode() ? 'Editar Proveedor' : 'Nuevo Proveedor' }}
               </h1>
           </div>

           <!-- FORM CARD -->
           <div class="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-200 dark:border-slate-700 p-8">
               <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
                   
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                       
                       <!-- Name -->
                       <div class="md:col-span-2">
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Razón Social / Nombre <span class="text-red-500">*</span></label>
                           <input type="text" formControlName="name" class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm py-2.5">
                           <p *ngIf="form.get('name')?.touched && form.get('name')?.invalid" class="mt-1 text-xs text-red-500">El nombre es requerido</p>
                       </div>

                       <!-- Tax ID -->
                       <div>
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RFC / ID Fiscal</label>
                           <input type="text" formControlName="tax_id" class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm py-2.5">
                       </div>

                       <!-- Payment Terms -->
                       <div>
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Días de Crédito</label>
                           <input type="number" formControlName="payment_terms_days" class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm py-2.5">
                       </div>

                       <!-- Separator -->
                       <div class="md:col-span-2 border-t border-gray-100 dark:border-slate-700 my-2"></div>
                       <h3 class="md:col-span-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">Contacto</h3>

                       <!-- Contact Name -->
                       <div>
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Contacto</label>
                           <input type="text" formControlName="contact_name" class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm py-2.5">
                       </div>

                       <!-- Email -->
                       <div>
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
                           <input type="email" formControlName="email" class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm py-2.5">
                       </div>

                       <!-- Phone -->
                       <div>
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                           <input type="tel" formControlName="phone" class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm py-2.5">
                       </div>

                       <!-- Address -->
                        <div class="md:col-span-2">
                           <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dirección / Notas</label>
                           <textarea formControlName="address" rows="3" class="block w-full rounded-lg border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm py-2.5"></textarea>
                       </div>

                   </div>

                   <!-- Actions -->
                   <div class="flex justify-end pt-6 border-t border-gray-200 dark:border-slate-700">
                       <button type="submit" [disabled]="form.invalid || isProcessing()" 
                               class="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg transition disabled:opacity-50 flex items-center gap-2">
                           <div *ngIf="isProcessing()" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                           {{ isEditMode() ? 'Actualizar Proveedor' : 'Guardar Proveedor' }}
                       </button>
                   </div>
               </form>
           </div>
       </div>
    </div>
  `
})
export class SupplierFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private supplierRepo = inject(SupplierRepository);
    private session = inject(SessionService);

    form: FormGroup;
    isEditMode = signal(false);
    isProcessing = signal(false);
    currentId: string | null = null;

    constructor() {
        this.form = this.fb.group({
            name: ['', [Validators.required]],
            tax_id: [''],
            payment_terms_days: [0],
            contact_name: [''],
            email: ['', [Validators.email]],
            phone: [''],
            address: ['']
        });
    }

    async ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.currentId = id;
            await this.loadSupplier(id);
        }
    }

    async loadSupplier(id: string) {
        const s = await this.supplierRepo.getById(id);
        if (s) {
            this.form.patchValue(s);
        }
    }

    async onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched(); // Show errors if user somehow submitted invalid form
            return;
        }

        this.isProcessing.set(true);
        try {
            const val = this.form.value;
            // Clean empty strings to nulls if needed, or leave as is. 
            // Supabase is fine with empty strings for text, but let's be safe with tax_id? No, simple is better.

            if (this.isEditMode() && this.currentId) {
                await this.supplierRepo.update(this.currentId, val);
            } else {
                await this.supplierRepo.create(val);
            }
            this.router.navigate(['/cadena-suministro/proveedores']);
        } catch (error: any) {
            console.error('Error saving supplier', error);
            // Show alert to user
            alert('Error al guardar: ' + (error.message || error));
        } finally {
            this.isProcessing.set(false);
        }
    }

    cancel() {
        this.router.navigate(['/cadena-suministro/proveedores']);
    }
}
