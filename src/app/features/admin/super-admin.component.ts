import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { Tenant, Module, TenantLicense } from '../../core/models/erp.types';

@Component({
    selector: 'app-super-admin',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Panel de Provisionamiento (Super Admin)</h1>

      <!-- SECCIÓN 1: GESTIÓN DE TENANTS -->
      <div class="bg-white shadow rounded-lg p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">Gestión de Tenants</h2>
        
        <!-- Formulario de Creación -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nombre de la Organización</label>
            <input type="text" [(ngModel)]="newTenant.name" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border" placeholder="Ej: Acme Corp">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Slug (Identificador)</label>
            <input type="text" [(ngModel)]="newTenant.slug" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border" placeholder="Ej: acme-corp">
          </div>
          <div>
             <label class="block text-sm font-medium text-gray-700 mb-1">Industria</label>
             <select [(ngModel)]="newTenant.industry" class="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border">
               <option value="Technology">Tecnología</option>
               <option value="Retail">Retail</option>
               <option value="Manufacturing">Manufactura</option>
               <option value="Services">Servicios</option>
             </select>
          </div>
          <div class="flex items-end">
            <button (click)="createTenant()" [disabled]="isCreatingTenant()" class="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {{ isCreatingTenant() ? 'Creando...' : 'Crear Tenant' }}
            </button>
          </div>
        </div>

        <!-- Lista de Tenants -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let tenant of tenants()" [class.bg-indigo-50]="selectedTenant()?.id === tenant.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ tenant.name }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ tenant.slug }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span [class.bg-green-100]="tenant.is_active" [class.text-green-800]="tenant.is_active" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    {{ tenant.is_active ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button (click)="selectTenant(tenant)" class="text-indigo-600 hover:text-indigo-900">Gestionar Licencias</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECCIÓN 2: GESTIÓN DE SUSCRIPCIONES -->
      <div *ngIf="selectedTenant()" class="bg-white shadow rounded-lg p-6">
        <div class="flex justify-between items-center mb-4 border-b pb-2">
          <h2 class="text-xl font-semibold text-gray-800">
            Licencias para: <span class="text-indigo-600">{{ selectedTenant()?.name }}</span>
          </h2>
          <button (click)="selectedTenant.set(null)" class="text-sm text-gray-500 hover:text-gray-700">Cerrar</button>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Módulos Disponibles -->
          <div class="lg:col-span-2">
            <h3 class="text-lg font-medium text-gray-900 mb-3">Módulos Disponibles</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div *ngFor="let module of modules()" class="border rounded-lg p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                <div>
                  <p class="font-semibold text-gray-900">{{ module.name }}</p>
                  <p class="text-xs text-gray-500">{{ module.category }}</p>
                </div>
                <button 
                  *ngIf="!hasLicense(module.id)"
                  (click)="assignLicense(module)" 
                  [disabled]="isAssigning()"
                  class="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Asignar
                </button>
                <span *ngIf="hasLicense(module.id)" class="text-sm text-green-600 font-medium flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  Asignado
                </span>
              </div>
            </div>
          </div>

          <!-- Licencias Activas -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-3">Licencias Activas</h3>
            <ul class="divide-y divide-gray-200 border rounded-lg bg-gray-50">
              <li *ngFor="let license of tenantLicenses()" class="p-4 flex justify-between items-center">
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ getModuleName(license.module_id) }}</p>
                  <p class="text-xs text-gray-500">Desde: {{ license.installed_at | date:'shortDate' }}</p>
                </div>
                <button (click)="revokeLicense(license.id)" class="text-xs text-red-600 hover:text-red-800">Revocar</button>
              </li>
              <li *ngIf="tenantLicenses().length === 0" class="p-4 text-sm text-gray-500 text-center">
                No hay licencias asignadas.
              </li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  `
})
export class SuperAdminComponent implements OnInit {
    private supabase = inject(SupabaseService);

    tenants = signal<Tenant[]>([]);
    modules = signal<Module[]>([]);
    tenantLicenses = signal<TenantLicense[]>([]);
    selectedTenant = signal<Tenant | null>(null);

    isCreatingTenant = signal<boolean>(false);
    isAssigning = signal<boolean>(false);

    newTenant: Partial<Tenant> = {
        name: '',
        slug: '',
        industry: 'Technology',
        is_active: true,
        subscription_status: 'active',
        max_users: 5,
        max_companies: 1,
        storage_gb: 1
    };

    async ngOnInit() {
        await this.loadTenants();
        await this.loadModules();
    }

    async loadTenants() {
        const { data, error } = await this.supabase.client.from('tenants').select('*').order('created_at', { ascending: false });
        if (!error && data) {
            this.tenants.set(data as Tenant[]);
        }
    }

    async loadModules() {
        const { data, error } = await this.supabase.client.from('modules').select('*').eq('is_available', true);
        if (!error && data) {
            this.modules.set(data as Module[]);
        }
    }

    async createTenant() {
        if (!this.newTenant.name || !this.newTenant.slug) return;

        this.isCreatingTenant.set(true);
        try {
            const tenantToCreate = {
                ...this.newTenant,
                primary_color: '#4f46e5',
                trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                metadata: { created_via: 'super-admin-panel' }
            };

            const { data, error } = await this.supabase.client.from('tenants').insert(tenantToCreate).select();

            if (error) throw error;

            await this.loadTenants();
            this.newTenant = { name: '', slug: '', industry: 'Technology', is_active: true, subscription_status: 'active', max_users: 5, max_companies: 1, storage_gb: 1 };

        } catch (error) {
            console.error('Error creating tenant:', error);
            alert('Error al crear tenant. Revisa la consola.');
        } finally {
            this.isCreatingTenant.set(false);
        }
    }

    async selectTenant(tenant: Tenant) {
        this.selectedTenant.set(tenant);
        await this.loadLicenses(tenant.id);
    }

    async loadLicenses(tenantId: string) {
        const { data, error } = await this.supabase.client.from('tenant_licenses').select('*').eq('tenant_id', tenantId);
        if (!error && data) {
            this.tenantLicenses.set(data as TenantLicense[]);
        }
    }

    async assignLicense(module: Module) {
        const tenant = this.selectedTenant();
        if (!tenant) return;

        this.isAssigning.set(true);
        try {
            const newLicense = {
                tenant_id: tenant.id,
                module_id: module.id,
                is_active: true,
                installed_at: new Date().toISOString(),
                usage_count: 0
            };

            const { error } = await this.supabase.client.from('tenant_licenses').insert(newLicense);
            if (error) throw error;

            await this.loadLicenses(tenant.id);
        } catch (error) {
            console.error('Error assigning license:', error);
        } finally {
            this.isAssigning.set(false);
        }
    }

    async revokeLicense(licenseId: string) {
        if (!confirm('¿Estás seguro de revocar esta licencia?')) return;

        const { error } = await this.supabase.client.from('tenant_licenses').delete().eq('id', licenseId);
        if (!error && this.selectedTenant()) {
            await this.loadLicenses(this.selectedTenant()!.id);
        }
    }

    hasLicense(moduleId: string): boolean {
        return this.tenantLicenses().some(l => l.module_id === moduleId);
    }

    getModuleName(moduleId: string): string {
        return this.modules().find(m => m.id === moduleId)?.name || 'Desconocido';
    }
}
