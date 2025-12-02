import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CompanyRepository } from '../../core/repositories/company.repository';
import { SessionService } from '../../core/services/session.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { Company } from '../../core/models/erp.types';

@Component({
  selector: 'app-company-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- HEADER -->
      <div class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-bold text-indigo-600">ERP SaaS</h1>
            </div>
            <div class="flex items-center">
              <button (click)="logout()" class="ml-4 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-grow flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Selecciona una Empresa
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Elige la empresa con la que deseas trabajar
          </p>
        </div>

        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
          
          <!-- FORMULARIO DE CREACIÓN -->
          <div *ngIf="isCreating()" class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 mb-6">
            <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Nueva Empresa</h3>
            <form (ngSubmit)="saveCompany()">
              <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div class="sm:col-span-4">
                  <label for="name" class="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                  <div class="mt-1">
                    <input type="text" name="name" id="name" [(ngModel)]="newCompany.name" required
                           class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border">
                  </div>
                </div>

                <div class="sm:col-span-2">
                  <label for="code" class="block text-sm font-medium text-gray-700">Código (Ej: MTY)</label>
                  <div class="mt-1">
                    <input type="text" name="code" id="code" [(ngModel)]="newCompany.code" required
                           class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border">
                  </div>
                </div>
                
                <div class="sm:col-span-3">
                  <label for="currency" class="block text-sm font-medium text-gray-700">Moneda</label>
                  <select id="currency" name="currency" [(ngModel)]="newCompany.currency_code" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border">
                    <option value="MXN">Peso Mexicano (MXN)</option>
                    <option value="USD">Dólar Americano (USD)</option>
                  </select>
                </div>
              </div>

              <div class="mt-6 flex justify-end gap-3">
                <button type="button" (click)="isCreating.set(false)" class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                  Cancelar
                </button>
                <button type="submit" [disabled]="isSaving()" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50">
                  {{ isSaving() ? 'Guardando...' : 'Crear Empresa' }}
                </button>
              </div>
            </form>
          </div>

          <!-- LISTA DE EMPRESAS -->
          <div *ngIf="!isCreating()" class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            
            <div *ngIf="isLoading()" class="flex justify-center py-12">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>

            <!-- EMPTY STATE -->
            <div *ngIf="!isLoading() && companies().length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">No hay empresas</h3>
              <p class="mt-1 text-sm text-gray-500">Comienza creando tu primera empresa para operar.</p>
              <div class="mt-6">
                <button type="button" (click)="isCreating.set(true)" class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                  Crear nueva empresa
                </button>
              </div>
            </div>

            <!-- LIST STATE -->
            <div *ngIf="!isLoading() && companies().length > 0">
              <div class="flex justify-end mb-4">
                  <button (click)="isCreating.set(true)" class="text-sm text-indigo-600 hover:text-indigo-900 font-medium flex items-center">
                      <svg class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                      </svg>
                      Agregar otra empresa
                  </button>
              </div>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div *ngFor="let company of companies()" 
                      (click)="selectCompany(company)"
                      class="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-500 cursor-pointer transition-all duration-200">
                  <div class="flex-shrink-0">
                      <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span class="text-indigo-600 font-bold text-lg">{{ company.name.charAt(0).toUpperCase() }}</span>
                      </div>
                  </div>
                  <div class="flex-1 min-w-0">
                      <a href="#" class="focus:outline-none" (click)="$event.preventDefault()">
                      <span class="absolute inset-0" aria-hidden="true"></span>
                      <p class="text-sm font-medium text-gray-900">
                          {{ company.name }}
                      </p>
                      <p class="text-sm text-gray-500 truncate">
                          {{ company.code }}
                      </p>
                      </a>
                  </div>
                  </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class CompanySelectorComponent implements OnInit {
  private companyRepo = inject(CompanyRepository);
  private sessionService = inject(SessionService);
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  companies = signal<Company[]>([]);
  isLoading = signal<boolean>(true);
  isCreating = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  tenantId: string | null = null;

  newCompany: Partial<Company> = {
    name: '',
    code: '',
    currency_code: 'MXN',
    is_active: true
  };

  async ngOnInit() {
    try {
      const { data: { session } } = await this.supabase.client.auth.getSession();

      let tId = this.sessionService.currentTenant()?.id;

      if (!tId && session?.user) {
        tId = session.user.user_metadata?.['tenant_id'] || session.user.app_metadata?.['tenant_id'];
      }

      if (!tId && session?.user?.id) {
        console.warn('No tenant_id found in metadata, using user_id as fallback or checking mock session.');
        if (this.sessionService.currentTenant()) {
          tId = this.sessionService.currentTenant()!.id;
        }
      }

      if (!tId) {
        console.error('No se pudo identificar el Tenant ID.');
        this.isLoading.set(false);
        return;
      }

      this.tenantId = tId;
      await this.loadCompanies();

    } catch (error) {
      console.error('Error loading companies:', error);
      this.isLoading.set(false);
    }
  }

  async loadCompanies() {
    if (!this.tenantId) return;
    this.isLoading.set(true);
    const companies = await this.companyRepo.getAllByTenant(this.tenantId);
    this.companies.set(companies);

    // Auto-selection removed to allow user to see the launcher and add new companies if desired.
    // if (companies.length === 1 && !this.isCreating()) {
    //   this.selectCompany(companies[0]);
    // }

    this.isLoading.set(false);
  }

  selectCompany(company: Company) {
    this.sessionService.selectCompany(company);
    // La redirección ya la hace el sessionService.selectCompany, pero por seguridad/redundancia:
    this.router.navigate(['/launcher']);
  }

  async saveCompany() {
    if (!this.tenantId) {
      alert('Error: No se ha identificado la organización (Tenant ID). Recarga la página.');
      return;
    }
    if (!this.newCompany.name || !this.newCompany.code) {
      alert('Por favor completa el nombre y el código de la empresa.');
      return;
    }

    this.isSaving.set(true);
    try {
      const companyToSave: Partial<Company> = {
        ...this.newCompany,
        tenant_id: this.tenantId,
        fiscal_year_start: 1, // Default
        timezone: 'America/Mexico_City' // Default
      };

      await this.companyRepo.create(companyToSave);

      // Reset form
      this.newCompany = { name: '', code: '', currency_code: 'MXN', is_active: true };
      this.isCreating.set(false);

      // Reload list
      await this.loadCompanies();

    } catch (error) {
      console.error('Error creating company:', error);
      alert('Error al crear la empresa. Revisa la consola.');
    } finally {
      this.isSaving.set(false);
    }
  }

  logout() {
    this.sessionService.logout();
  }
}
