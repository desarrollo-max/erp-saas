import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule, RouterLink } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SalesRepository } from '@core/repositories/sales.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { SalesOpportunity, SalesCompany, SalesContact, SalesStage } from '@core/models/erp.types';

@Component({
    selector: 'app-opportunity-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, NgIconsModule, RouterLink],
    viewProviders: [provideIcons(heroIcons)],
    template: `
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="md:flex md:items-center md:justify-between mb-8">
        <div class="flex-1 min-w-0">
          <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            {{ isEditMode() ? 'Editar Oportunidad' : 'Nueva Oportunidad' }}
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
            <h3 class="text-lg leading-6 font-medium text-gray-900">Detalles de la Oportunidad</h3>
            <p class="mt-1 text-sm text-gray-500">Información clave sobre el posible negocio.</p>

            <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div class="sm:col-span-4">
                <label for="name" class="block text-sm font-medium text-gray-700">Nombre de Oportunidad *</label>
                <div class="mt-1">
                  <input type="text" id="name" formControlName="name" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" placeholder="Ej. Venta de Licencias Anuales">
                </div>
              </div>

              <div class="sm:col-span-2">
                <label for="amount" class="block text-sm font-medium text-gray-700">Valor Estimado</label>
                <div class="mt-1 relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span class="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input type="number" id="amount" formControlName="amount" class="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md" placeholder="0.00">
                </div>
              </div>

              <div class="sm:col-span-3">
                 <label for="stage_id" class="block text-sm font-medium text-gray-700">Etapa *</label>
                 <div class="mt-1">
                    <select id="stage_id" formControlName="stage_id" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                      <option *ngFor="let stage of stages()" [value]="stage.id">{{ stage.name }}</option>
                    </select>
                 </div>
              </div>

              <div class="sm:col-span-3">
                 <label for="expected_close_date" class="block text-sm font-medium text-gray-700">Fecha Cierre Estimada</label>
                 <div class="mt-1">
                    <input type="date" id="expected_close_date" formControlName="expected_close_date" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                 </div>
              </div>

              <div class="sm:col-span-6">
                 <label for="description" class="block text-sm font-medium text-gray-700">Descripción / Notas</label>
                 <div class="mt-1">
                    <textarea id="description" formControlName="description" rows="3" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"></textarea>
                 </div>
              </div>

            </div>
          </div>

          <!-- Relationships -->
          <div class="pt-8">
            <h3 class="text-lg leading-6 font-medium text-gray-900">Relaciones</h3>
            <div class="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              
               <div class="sm:col-span-3">
                 <label for="sales_company_id" class="block text-sm font-medium text-gray-700">Empresa (Cliente) *</label>
                 <div class="mt-1">
                    <select id="sales_company_id" formControlName="sales_company_id" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                      <option [ngValue]="null">-- Seleccionar --</option>
                      <option *ngFor="let company of companies()" [value]="company.id">{{ company.name }}</option>
                    </select>
                 </div>
              </div>

              <div class="sm:col-span-3">
                 <label for="primary_contact_id" class="block text-sm font-medium text-gray-700">Contacto Principal</label>
                 <div class="mt-1">
                    <select id="primary_contact_id" formControlName="primary_contact_id" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                      <option [ngValue]="null">-- Seleccionar --</option>
                      <!-- Typically filtered by company, for now showing all or filtered if logic implemented -->
                      <option *ngFor="let contact of contacts()" [value]="contact.id">{{ contact.first_name }} {{ contact.last_name }}</option>
                    </select>
                 </div>
              </div>

              <div class="sm:col-span-3">
                 <label for="probability_percent" class="block text-sm font-medium text-gray-700">Probabilidad (%)</label>
                 <div class="mt-1">
                   <input type="number" id="probability_percent" formControlName="probability_percent" min="0" max="100" class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                 </div>
              </div>

            </div>
          </div>

        </div>
      </form>
    </div>
  `
})
export class OpportunityFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private salesRepo = inject(SalesRepository);
    private session = inject(SessionService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private notification = inject(NotificationService);

    form = this.fb.group({
        name: ['', Validators.required],
        amount: [0],
        stage_id: ['', Validators.required],
        expected_close_date: [''],
        sales_company_id: ['', Validators.required],
        primary_contact_id: [null as string | null],
        description: [''],
        probability_percent: [50]
    });

    isEditMode = signal(false);
    isSaving = signal(false);
    oppId: string | null = null;

    stages = signal<SalesStage[]>([]);
    companies = signal<SalesCompany[]>([]);
    contacts = signal<SalesContact[]>([]);

    ngOnInit() {
        this.oppId = this.route.snapshot.paramMap.get('id');
        this.loadDependencies();
        if (this.oppId) {
            this.isEditMode.set(true);
            this.loadOpportunity(this.oppId);
        }
    }

    async loadDependencies() {
        const tenantId = this.session.currentTenantId();
        if (!tenantId) return;

        try {
            const [stagesData, companiesData, contactsData] = await Promise.all([
                this.salesRepo.getStages(tenantId),
                this.salesRepo.getCompanies(tenantId),
                this.salesRepo.getContacts(tenantId)
            ]);

            this.stages.set(stagesData);
            this.companies.set(companiesData);
            this.contacts.set(contactsData);

            // Set default stage if new
            if (!this.isEditMode() && stagesData.length > 0) {
                this.form.patchValue({ stage_id: stagesData[0].id });
            }

        } catch (e) {
            console.error('Error loading dependencies', e);
        }
    }

    async loadOpportunity(id: string) {
        try {
            const opp = await this.salesRepo.getOpportunityById(id);
            if (opp) {
                this.form.patchValue({
                    ...opp,
                    // Date formatting if needed
                });
            } else {
                this.notification.error('Oportunidad no encontrada');
                this.router.navigate(['..'], { relativeTo: this.route });
            }
        } catch (error) {
            this.notification.error('Error al cargar oportunidad');
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

        const formData = this.form.value as Partial<SalesOpportunity>;

        try {
            if (this.isEditMode() && this.oppId) {
                await this.salesRepo.updateOpportunity(this.oppId, formData);
                this.notification.success('Oportunidad actualizada');
            } else {
                await this.salesRepo.createOpportunity({ ...formData, tenant_id: tenantId });
                this.notification.success('Oportunidad creada');
            }
            this.router.navigate(['/sales/crm/opportunities']);
        } catch (error) {
            console.error(error);
            this.notification.error('Error al guardar oportunidad');
        } finally {
            this.isSaving.set(false);
        }
    }
}
