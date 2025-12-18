import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { SupplierRepository } from '@core/repositories/supplier.repository';
import { SessionService } from '@core/services/session.service';
import { Supplier } from '@core/models/erp.types';

@Component({
    selector: 'app-supplier-list',
    standalone: true,
    imports: [CommonModule, RouterModule, NgIconsModule],
    viewProviders: [provideIcons(heroIcons)],
    template: `
    <div class="flex flex-col h-full bg-gray-50 dark:bg-slate-900">
      
      <!-- HEADER -->
      <div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-5 flex items-center justify-between shadow-sm sticky top-0 z-10">
         <div>
           <div class="flex items-center gap-2 mb-1">
             <button (click)="goBack()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition">
               <ng-icon name="heroArrowLeftSolid" class="w-5 h-5"></ng-icon>
             </button>
             <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
               Proveedores
             </h1>
           </div>
           <p class="text-sm text-gray-500">Gestione su catálogo de proveedores y acreedores.</p>
         </div>
         <div class="flex gap-3">
           <button (click)="createSupplier()" class="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md transition flex items-center gap-2">
             <ng-icon name="heroPlusCircleSolid" class="w-5 h-5"></ng-icon>
             Nuevo Proveedor
           </button>
         </div>
      </div>

      <!-- CONTENT -->
      <div class="flex-1 overflow-auto p-6">
         
         <div *ngIf="isLoading()" class="flex flex-col items-center justify-center h-64">
             <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mb-4"></div>
             <p class="text-gray-500">Cargando proveedores...</p>
         </div>

         <div *ngIf="!isLoading()" class="bg-white dark:bg-slate-800 rounded-xl shadow border border-gray-200 dark:border-slate-700 overflow-hidden">
             
             <!-- Empty State -->
             <div *ngIf="suppliers().length === 0" class="flex flex-col items-center justify-center py-20 text-gray-400">
                 <ng-icon name="heroUsersSolid" class="w-16 h-16 mb-4 opacity-50"></ng-icon>
                 <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-200">No hay proveedores registrados</h3>
                 <p class="text-sm max-w-xs text-center mt-2">Agregue proveedores para poder generar órdenes de compra.</p>
                 <button (click)="createSupplier()" class="mt-6 text-cyan-600 font-medium hover:text-cyan-700 hover:underline">Crear Proveedor</button>
             </div>

             <!-- Table -->
             <div *ngIf="suppliers().length > 0" class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                   <thead class="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                         <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nombre / Razón Social</th>
                         <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contacto Principal</th>
                         <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                         <th class="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teléfono</th>
                         <th class="px-6 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                      </tr>
                   </thead>
                   <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                      <tr *ngFor="let s of suppliers()" class="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition group">
                         <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div class="h-10 w-10 flex-shrink-0 rounded-full bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-700 dark:text-cyan-300 font-bold uppercase">
                                    {{ s.name.charAt(0) }}
                                </div>
                                <div class="ml-4">
                                    <div class="text-sm font-medium text-gray-900 dark:text-white">{{ s.name }}</div>
                                    <div class="text-xs text-gray-500">{{ s.tax_id || 'Sin RFC' }}</div>
                                </div>
                            </div>
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {{ s.contact_name || '--' }}
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {{ s.email || '--' }}
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {{ s.phone || '--' }}
                         </td>
                         <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button (click)="editSupplier(s)" class="text-cyan-600 hover:text-cyan-900 dark:hover:text-cyan-400 transition-colors mr-3" title="Editar">
                               <ng-icon name="heroPencilSquareSolid" class="w-5 h-5"></ng-icon>
                            </button>
                         </td>
                      </tr>
                   </tbody>
                </table>
             </div>
         </div>
      </div>
    </div>
  `
})
export class SupplierListComponent implements OnInit {
    private router = inject(Router);
    private supplierRepo = inject(SupplierRepository);
    private session = inject(SessionService);

    suppliers = signal<Supplier[]>([]);
    isLoading = signal(true);

    async ngOnInit() {
        await this.loadSuppliers();
    }

    async loadSuppliers() {
        const tenantId = this.session.currentTenantId();
        if (!tenantId) return;

        try {
            this.isLoading.set(true);
            const data = await this.supplierRepo.getAll(tenantId);
            this.suppliers.set(data);
        } catch (error) {
            console.error('Error loading suppliers', error);
        } finally {
            this.isLoading.set(false);
        }
    }

    createSupplier() {
        this.router.navigate(['/cadena-suministro/proveedores/nuevo']);
    }

    editSupplier(s: Supplier) {
        this.router.navigate(['/cadena-suministro/proveedores/editar', s.id]);
    }

    goBack() {
        this.router.navigate(['/cadena-suministro/compras']);
    }
}
