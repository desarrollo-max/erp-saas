import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SalesRepository } from '@core/repositories/sales.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { SalesCompany } from '@core/models/erp.types';

@Component({
    selector: 'app-company-list',
    standalone: true,
    imports: [CommonModule, RouterModule, NgIconsModule],
    viewProviders: [provideIcons(heroIcons)],
    template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-xl font-semibold text-gray-900">Empresas</h1>
          <p class="mt-2 text-sm text-gray-700">Lista de cuentas, clientes y prospectos.</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            (click)="navigateToNew()"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto">
            <ng-icon name="heroPlusSolid" class="h-5 w-5 mr-2"></ng-icon>
            Nueva Empresa
          </button>
        </div>
      </div>

      <div class="mt-8 flex flex-col">
        <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg bg-white">
              
              <div *ngIf="isLoading()" class="p-12 text-center">
                 <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                 <p class="text-gray-500">Cargando empresas...</p>
              </div>

              <div *ngIf="!isLoading() && companies().length === 0" class="p-12 text-center">
                <ng-icon name="heroBuildingOffice2Solid" class="h-12 w-12 text-gray-400 mx-auto mb-4"></ng-icon>
                <h3 class="text-lg font-medium text-gray-900">No hay empresas registradas</h3>
                <p class="mt-1 text-sm text-gray-500">Comienza creando tu primera cuenta o cliente.</p>
              </div>

              <table *ngIf="!isLoading() && companies().length > 0" class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nombre</th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Tipo</th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contacto</th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Ubicación</th>
                    <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span class="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  <tr *ngFor="let company of companies()">
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      {{ company.name }}
                      <div class="text-xs text-gray-500 font-normal" *ngIf="company.industry">{{ company.industry }}</div>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <span *ngIf="company.is_customer" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-1">Cliente</span>
                      <span *ngIf="company.is_prospect" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Prospecto</span>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div *ngIf="company.email" class="flex items-center gap-1"><ng-icon name="heroEnvelopeSolid" class="h-3 w-3"></ng-icon> {{ company.email }}</div>
                      <div *ngIf="company.phone" class="flex items-center gap-1"><ng-icon name="heroPhoneSolid" class="h-3 w-3"></ng-icon> {{ company.phone }}</div>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {{ company.city }}{{ company.state ? ', ' + company.state : '' }}
                    </td>
                    <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button (click)="navigateToEdit(company.id)" class="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                      <button (click)="deleteCompany(company.id)" class="text-red-600 hover:text-red-900">Eliminar</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CompanyListComponent implements OnInit {
    private salesRepo = inject(SalesRepository);
    private session = inject(SessionService);
    private router = inject(Router);
    private notification = inject(NotificationService);

    companies = signal<SalesCompany[]>([]);
    isLoading = signal(true);

    ngOnInit() {
        this.loadData();
    }

    async loadData() {
        this.isLoading.set(true);
        const tenantId = this.session.currentTenantId();
        if (!tenantId) return;

        try {
            const data = await this.salesRepo.getCompanies(tenantId);
            this.companies.set(data);
        } catch (error) {
            this.notification.error('Error al cargar empresas');
        } finally {
            this.isLoading.set(false);
        }
    }

    navigateToNew() {
        this.router.navigate(['/sales/crm/companies/new']);
    }

    navigateToEdit(id: string) {
        this.router.navigate(['/sales/crm/companies', id]);
    }

    async deleteCompany(id: string) {
        if (!confirm('¿Estás seguro de eliminar esta empresa?')) return;
        try {
            await this.salesRepo.deleteCompany(id);
            this.notification.success('Empresa eliminada');
            this.loadData();
        } catch (error) {
            this.notification.error('Error al eliminar empresa');
        }
    }
}
