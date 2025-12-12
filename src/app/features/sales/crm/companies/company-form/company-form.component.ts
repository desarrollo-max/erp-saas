import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule, RouterLink } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SalesRepository } from '@core/repositories/sales.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { SalesCompany } from '@core/models/erp.types';

@Component({
    selector: 'app-company-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconsModule, RouterLink],
    viewProviders: [provideIcons(heroIcons)],
    template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="md:flex md:items-center md:justify-between mb-8">
        <div class="flex-1 min-w-0">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {{ isEditMode() ? 'Editar Empresa' : 'Nueva Empresa' }}
          </h2>
        </div>
        <div class="mt-4 flex md:mt-0 md:ml-4">
          <a routerLink=".." class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Cancelar
          </a>
          <button 
            (click)="save()"
            [disabled]="form.invalid || isSaving()"
            class="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
            <ng-icon *ngIf="isSaving()" name="heroArrowPathSolid" class="animate-spin h-5 w-5 mr-2"></ng-icon>
            {{ isSaving() ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>

      <form [formGroup]="form" class="space-y-8 divide-y divide-gray-200 bg-white p-8 shadow rounded-lg">
        <div class="space-y-8 divide-y divide-gray-200">
          
          <!-- Basic Info -->
          <div>
            <h3 class="text-lg leading-6 font-medium text-gray-900">Información General</h3>
            <p class="mt-1 text-sm text-gray-500">Datos principales de la cuenta.</p>

            <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div class="sm:col-span-4">
                <label for="name" class="block text-sm font-medium text-gray-700">Nombre Comercial *</label>
                <div class="mt-1">
                  <input type="text" id="name" formControlName="name" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                </div>
              </div>

              <div class="sm:col-span-4">
                <label for="legal_name" class="block text-sm font-medium text-gray-700">Razón Social</label>
                <div class="mt-1">
                  <input type="text" id="legal_name" formControlName="legal_name" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                </div>
              </div>

              <div class="sm:col-span-2">
                 <label for="tax_id" class="block text-sm font-medium text-gray-700">RFC / Tax ID</label>
                 <div class="mt-1">
                    <input type="text" id="tax_id" formControlName="tax_id" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                 </div>
              </div>

              <div class="sm:col-span-3">
                 <label for="industry" class="block text-sm font-medium text-gray-700">Industria</label>
                 <div class="mt-1">
                    <input type="text" id="industry" formControlName="industry" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                 </div>
              </div>

              <div class="sm:col-span-3">
                 <label class="block text-sm font-medium text-gray-700">Tipo de Relación</label>
                 <div class="mt-2 flex gap-4">
                    <div class="flex items-center">
                       <input id="is_customer" formControlName="is_customer" type="checkbox" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                       <label for="is_customer" class="ml-2 block text-sm text-gray-900">Cliente</label>
                    </div>
                    <div class="flex items-center">
                       <input id="is_prospect" formControlName="is_prospect" type="checkbox" class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded">
                       <label for="is_prospect" class="ml-2 block text-sm text-gray-900">Prospecto</label>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <!-- Contact Info -->
          <div class="pt-8">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Información de Contacto</h3>
            <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div class="sm:col-span-3">
                <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                <div class="mt-1">
                  <input type="email" id="email" formControlName="email" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                </div>
              </div>

              <div class="sm:col-span-3">
                <label for="phone" class="block text-sm font-medium text-gray-700">Teléfono</label>
                <div class="mt-1">
                  <input type="text" id="phone" formControlName="phone" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                </div>
              </div>

               <div class="sm:col-span-3">
                <label for="website" class="block text-sm font-medium text-gray-700">Sitio Web</label>
                <div class="mt-1">
                  <input type="text" id="website" formControlName="website" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                </div>
              </div>
            </div>
          </div>

          <!-- Address -->
          <div class="pt-8">
             <h3 class="text-lg leading-6 font-medium text-gray-900">Dirección</h3>
             <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div class="sm:col-span-6">
                   <label for="address" class="block text-sm font-medium text-gray-700">Calle y Número</label>
                   <div class="mt-1">
                      <input type="text" id="address" formControlName="address" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                   </div>
                </div>
                
                <div class="sm:col-span-2">
                   <label for="city" class="block text-sm font-medium text-gray-700">Ciudad</label>
                   <div class="mt-1">
                      <input type="text" id="city" formControlName="city" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                   </div>
                </div>

                <div class="sm:col-span-2">
                   <label for="state" class="block text-sm font-medium text-gray-700">Estado / Provincia</label>
                   <div class="mt-1">
                      <input type="text" id="state" formControlName="state" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                   </div>
                </div>

                <div class="sm:col-span-2">
                   <label for="country" class="block text-sm font-medium text-gray-700">País</label>
                   <div class="mt-1">
                      <input type="text" id="country" formControlName="country" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                   </div>
                </div>

                <div class="sm:col-span-2">
                   <label for="postal_code" class="block text-sm font-medium text-gray-700">Código Postal</label>
                   <div class="mt-1">
                      <input type="text" id="postal_code" formControlName="postal_code" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                   </div>
                </div>
             </div>
          </div>

        </div>
      </form>
    </div>
  `
})
export class CompanyFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private salesRepo = inject(SalesRepository);
    private session = inject(SessionService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notification = inject(NotificationService);

    form = this.fb.group({
        name: ['', Validators.required],
        legal_name: [''],
        tax_id: [''],
        industry: [''],
        is_customer: [true],
        is_prospect: [false],
        email: ['', [Validators.email]],
        phone: [''],
        website: [''],
        address: [''],
        city: [''],
        state: [''],
        country: [''],
        postal_code: ['']
    });

    isEditMode = signal(false);
    isSaving = signal(false);
    companyId: string | null = null;

    ngOnInit() {
        this.companyId = this.route.snapshot.paramMap.get('id');
        if (this.companyId) {
            this.isEditMode.set(true);
            this.loadCompany(this.companyId);
        }
    }

    async loadCompany(id: string) {
        try {
            const company = await this.salesRepo.getCompanyById(id);
            if (company) {
                this.form.patchValue(company);
            } else {
                this.notification.error('Empresa no encontrada');
                this.router.navigate(['..'], { relativeTo: this.route });
            }
        } catch (error) {
            this.notification.error('Error al cargar empresa');
        }
    }

    async save() {
        if (this.form.invalid) return;

        this.isSaving.set(true);
        const tenantId = this.session.currentTenantId();
        if (!tenantId) {
            this.notification.error('No se ha identificado la organización');
            this.isSaving.set(false);
            return;
        }

        const formData = this.form.value as Partial<SalesCompany>;

        try {
            if (this.isEditMode() && this.companyId) {
                await this.salesRepo.updateCompany(this.companyId, formData);
                this.notification.success('Empresa actualizada');
            } else {
                await this.salesRepo.createCompany({ ...formData, tenant_id: tenantId });
                this.notification.success('Empresa creada');
            }
            this.router.navigate(['/sales/crm/companies']);
        } catch (error) {
            console.error(error);
            this.notification.error('Error al guardar empresa');
        } finally {
            this.isSaving.set(false);
        }
    }
}
