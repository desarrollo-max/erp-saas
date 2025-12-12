import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SalesRepository } from '@core/repositories/sales.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { SalesContact } from '@core/models/erp.types';

@Component({
    selector: 'app-contact-list',
    standalone: true,
    imports: [CommonModule, RouterModule, NgIconsModule],
    viewProviders: [provideIcons(heroIcons)],
    template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-xl font-semibold text-gray-900">Contactos</h1>
          <p class="mt-2 text-sm text-gray-700">Agenda de personas y puntos de contacto.</p>
        </div>
        <div class="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            (click)="navigateToNew()"
            class="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto">
            <ng-icon name="heroPlusSolid" class="h-5 w-5 mr-2"></ng-icon>
            Nuevo Contacto
          </button>
        </div>
      </div>

      <div class="mt-8 flex flex-col">
        <div class="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg bg-white">
              
              <div *ngIf="isLoading()" class="p-12 text-center">
                 <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                 <p class="text-gray-500">Cargando contactos...</p>
              </div>

              <div *ngIf="!isLoading() && contacts().length === 0" class="p-12 text-center">
                <ng-icon name="heroUsersSolid" class="h-12 w-12 text-gray-400 mx-auto mb-4"></ng-icon>
                <h3 class="text-lg font-medium text-gray-900">No hay contactos registrados</h3>
                <p class="mt-1 text-sm text-gray-500">Agrega personas para comenzar a gestionar relaciones.</p>
              </div>

              <table *ngIf="!isLoading() && contacts().length > 0" class="min-w-full divide-y divide-gray-300">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Nombre</th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cargo / Empresa</th>
                    <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contacto</th>
                    <th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span class="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 bg-white">
                  <tr *ngFor="let contact of contacts()">
                    <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                      <div class="flex items-center">
                        <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs uppercase mr-3">
                          {{ getInitials(contact) }}
                        </div>
                        <div>
                          {{ contact.first_name }} {{ contact.last_name }}
                        </div>
                      </div>
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div class="font-medium text-gray-900">{{ contact.title || 'N/A' }}</div>
                      <!-- Future: Show company name via relation -->
                    </td>
                    <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <div *ngIf="contact.email" class="flex items-center gap-1"><ng-icon name="heroEnvelopeSolid" class="h-3 w-3"></ng-icon> {{ contact.email }}</div>
                      <div *ngIf="contact.phone" class="flex items-center gap-1"><ng-icon name="heroPhoneSolid" class="h-3 w-3"></ng-icon> {{ contact.phone }}</div>
                    </td>
                    <td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button (click)="navigateToEdit(contact.id)" class="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                      <button (click)="deleteContact(contact.id)" class="text-red-600 hover:text-red-900">Eliminar</button>
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
export class ContactListComponent implements OnInit {
    private salesRepo = inject(SalesRepository);
    private session = inject(SessionService);
    private router = inject(Router);
    private notification = inject(NotificationService);

    contacts = signal<SalesContact[]>([]);
    isLoading = signal(true);

    ngOnInit() {
        this.loadData();
    }

    async loadData() {
        this.isLoading.set(true);
        const tenantId = this.session.currentTenantId();
        if (!tenantId) return;

        try {
            const data = await this.salesRepo.getContacts(tenantId);
            this.contacts.set(data);
        } catch (error) {
            this.notification.error('Error al cargar contactos');
        } finally {
            this.isLoading.set(false);
        }
    }

    getInitials(contact: SalesContact): string {
        const first = contact.first_name ? contact.first_name[0] : '';
        const last = contact.last_name ? contact.last_name[0] : '';
        return first + last;
    }

    navigateToNew() {
        this.router.navigate(['/sales/crm/contacts/new']);
    }

    navigateToEdit(id: string) {
        this.router.navigate(['/sales/crm/contacts', id]);
    }

    async deleteContact(id: string) {
        if (!confirm('¿Estás seguro de eliminar este contacto?')) return;
        try {
            await this.salesRepo.deleteContact(id);
            this.notification.success('Contacto eliminado');
            this.loadData();
        } catch (error) {
            this.notification.error('Error al eliminar contacto');
        }
    }
}
