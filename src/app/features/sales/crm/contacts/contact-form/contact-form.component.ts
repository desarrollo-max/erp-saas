import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule, RouterLink } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SalesRepository } from '@core/repositories/sales.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { SalesContact, SalesCompany } from '@core/models/erp.types';

@Component({
    selector: 'app-contact-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconsModule, RouterLink],
    viewProviders: [provideIcons(heroIcons)],
    template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="md:flex md:items-center md:justify-between mb-8">
        <div class="flex-1 min-w-0">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {{ isEditMode() ? 'Editar Contacto' : 'Nuevo Contacto' }}
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
            <h3 class="text-lg leading-6 font-medium text-gray-900">Información Personal</h3>
            <p class="mt-1 text-sm text-gray-500">Datos básicos del contacto.</p>

            <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div class="sm:col-span-3">
                <label for="first_name" class="block text-sm font-medium text-gray-700">Nombre *</label>
                <div class="mt-1">
                  <input type="text" id="first_name" formControlName="first_name" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                </div>
              </div>

              <div class="sm:col-span-3">
                <label for="last_name" class="block text-sm font-medium text-gray-700">Apellidos</label>
                <div class="mt-1">
                  <input type="text" id="last_name" formControlName="last_name" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                </div>
              </div>

              <div class="sm:col-span-3">
                 <label for="sales_company_id" class="block text-sm font-medium text-gray-700">Empresa Asociada</label>
                 <div class="mt-1">
                    <select id="sales_company_id" formControlName="sales_company_id" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                      <option [ngValue]="null">-- Ninguna --</option>
                      <option *ngFor="let company of companies()" [value]="company.id">{{ company.name }}</option>
                    </select>
                 </div>
              </div>

              <div class="sm:col-span-3">
                 <label for="title" class="block text-sm font-medium text-gray-700">Cargo / Título</label>
                 <div class="mt-1">
                    <input type="text" id="title" formControlName="title" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                 </div>
              </div>
              
              <div class="sm:col-span-3">
                 <label for="department" class="block text-sm font-medium text-gray-700">Departamento</label>
                 <div class="mt-1">
                    <input type="text" id="department" formControlName="department" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                 </div>
              </div>

            </div>
          </div>

          <!-- Contact Details -->
          <div class="pt-8">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Detalles de Contacto</h3>
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
                <label for="mobile" class="block text-sm font-medium text-gray-700">Móvil / Celular</label>
                <div class="mt-1">
                  <input type="text" id="mobile" formControlName="mobile" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                </div>
              </div>

            </div>
          </div>

        </div>
      </form>
    </div>
  `
})
export class ContactFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private salesRepo = inject(SalesRepository);
    private session = inject(SessionService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notification = inject(NotificationService);

    form = this.fb.group({
        first_name: ['', Validators.required],
        last_name: [''],
        sales_company_id: [null as string | null],
        title: [''],
        department: [''],
        email: ['', [Validators.email]],
        phone: [''],
        mobile: ['']
    });

    isEditMode = signal(false);
    isSaving = signal(false);
    contactId: string | null = null;
    companies = signal<SalesCompany[]>([]);

    ngOnInit() {
        this.contactId = this.route.snapshot.paramMap.get('id');
        this.loadCompanies();
        if (this.contactId) {
            this.isEditMode.set(true);
            this.loadContact(this.contactId);
        }
    }

    async loadCompanies() {
        const tenantId = this.session.currentTenantId();
        if (!tenantId) return;
        try {
            const data = await this.salesRepo.getCompanies(tenantId);
            this.companies.set(data);
        } catch (e) {
            console.error('Error loading companies', e);
        }
    }

    async loadContact(id: string) {
        try {
            const contact = await this.salesRepo.getContactById(id);
            if (contact) {
                this.form.patchValue(contact);
            } else {
                this.notification.error('Contacto no encontrado');
                this.router.navigate(['..'], { relativeTo: this.route });
            }
        } catch (error) {
            this.notification.error('Error al cargar contacto');
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

        const formData = this.form.value as Partial<SalesContact>;

        try {
            if (this.isEditMode() && this.contactId) {
                await this.salesRepo.updateContact(this.contactId, formData);
                this.notification.success('Contacto actualizado');
            } else {
                await this.salesRepo.createContact({ ...formData, tenant_id: tenantId });
                this.notification.success('Contacto creado');
            }
            this.router.navigate(['/sales/crm/contacts']);
        } catch (error) {
            console.error(error);
            this.notification.error('Error al guardar contacto');
        } finally {
            this.isSaving.set(false);
        }
    }
}
