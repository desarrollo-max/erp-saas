import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '@core/services/session.service';
import { TenantRepository } from '@core/repositories/tenant.repository';
import { NotificationService } from '@core/services/notification.service';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import { APP_ICONS } from '@core/constants/app-icons';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div class="md:flex md:items-center md:justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center">
                <button (click)="goBack()" class="mr-4 p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
                  <ng-icon [name]="ICONS.back" class="h-6 w-6"></ng-icon>
                </button>
                <div>
                  <h2 class="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                    Configuración
                  </h2>
                  <p class="mt-1 text-sm text-gray-500">
                    Administra los detalles de tu organización.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        <div class="bg-white shadow overflow-hidden sm:rounded-lg">
          <div class="px-4 py-5 sm:px-6 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <div>
              <h3 class="text-lg leading-6 font-medium text-gray-900">Datos Generales</h3>
              <p class="mt-1 max-w-2xl text-sm text-gray-500">Información de la empresa y cuenta.</p>
            </div>
            <div *ngIf="isSaving()">
               <span class="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                 Guardando...
               </span>
            </div>
          </div>
          
          <div class="px-4 py-5 sm:p-6" *ngIf="isLoading()">
             <div class="animate-pulse flex space-x-4">
               <div class="flex-1 space-y-4 py-1">
                 <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                 <div class="space-y-2">
                   <div class="h-4 bg-gray-200 rounded"></div>
                   <div class="h-4 bg-gray-200 rounded w-5/6"></div>
                 </div>
               </div>
             </div>
          </div>

          <form *ngIf="!isLoading()" [formGroup]="settingsForm" (ngSubmit)="saveSettings()">
            <div class="px-4 py-5 sm:p-6 space-y-6">
              
              <!-- Grid Layout -->
              <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                
                <!-- Display Name -->
                <div class="sm:col-span-3">
                  <label for="name" class="block text-sm font-medium text-gray-700">Nombre de la Empresa</label>
                  <div class="mt-1">
                    <input type="text" id="name" formControlName="name"
                           class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                  </div>
                  <p class="mt-2 text-sm text-gray-500">El nombre público mostrado en la aplicación.</p>
                </div>

                <!-- Industry -->
                <div class="sm:col-span-3">
                  <label for="industry" class="block text-sm font-medium text-gray-700">Industria / Sector</label>
                  <div class="mt-1">
                    <select id="industry" formControlName="industry"
                            class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                      <option value="Retail">Retail</option>
                      <option value="Manufacturing">Manufactura</option>
                      <option value="Services">Servicios</option>
                      <option value="Technology">Tecnología</option>
                      <option value="Healthcare">Salud</option>
                      <option value="Other">Otro</option>
                    </select>
                  </div>
                </div>

                <!-- Legal Name -->
                <div class="sm:col-span-4">
                  <label for="legal_name" class="block text-sm font-medium text-gray-700">Razón Social</label>
                  <div class="mt-1">
                    <input type="text" id="legal_name" formControlName="legal_name"
                           class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                  </div>
                </div>

                <!-- Tax ID -->
                <div class="sm:col-span-2">
                  <label for="tax_id" class="block text-sm font-medium text-gray-700">RFC / Tax ID</label>
                  <div class="mt-1">
                    <input type="text" id="tax_id" formControlName="tax_id"
                           class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md">
                  </div>
                </div>

                 <!-- Logo URL -->
                 <div class="sm:col-span-6">
                  <label for="logo_url" class="block text-sm font-medium text-gray-700">URL del Logo</label>
                  <div class="mt-1 flex rounded-md shadow-sm">
                    <input type="text" id="logo_url" formControlName="logo_url"
                           class="flex-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full min-w-0 rounded-none rounded-l-md sm:text-sm border-gray-300">
                    <span class="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                      https://
                    </span>
                  </div>
                  <p class="mt-2 text-sm text-gray-500">URL directa a la imagen de tu logo.</p>
                </div>
              </div>

            </div>

            <!-- Footer Actions -->
            <div class="px-4 py-3 bg-gray-50 text-right sm:px-6 flex justify-end gap-3">
              <button type="button" (click)="goBack()" class="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Cancelar
              </button>
              <button type="submit" [disabled]="settingsForm.invalid || isSaving() || settingsForm.pristine"
                      class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  private session = inject(SessionService);
  private tenantRepo = inject(TenantRepository);
  private notification = inject(NotificationService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  public readonly ICONS = APP_ICONS;

  isLoading = signal(true);
  isSaving = signal(false);

  settingsForm = this.fb.group({
    name: ['', [Validators.required]],
    legal_name: [''],
    tax_id: [''],
    industry: [''],
    logo_url: ['']
  });

  async ngOnInit() {
    await this.loadTenantData();
  }

  async loadTenantData() {
    this.isLoading.set(true);
    const tenantId = this.session.currentTenantId();

    if (tenantId) {
      try {
        const tenant = await this.tenantRepo.getById(tenantId);
        if (tenant) {
          this.settingsForm.patchValue({
            name: tenant.name,
            legal_name: tenant.legal_name,
            tax_id: tenant.tax_id,
            industry: tenant.industry || 'Other',
            logo_url: tenant.logo_url
          });
        }
      } catch (error) {
        console.error('Error loading tenant data', error);
        this.notification.error('No se pudo cargar la información de la empresa.');
      }
    }
    this.isLoading.set(false);
  }

  async saveSettings() {
    if (this.settingsForm.invalid) return;

    this.isSaving.set(true);
    const tenantId = this.session.currentTenantId();
    const role = this.session.currentUserRole() || 'user';
    const updates = this.settingsForm.value;

    if (!tenantId) {
      this.notification.error('Sesión inválida.');
      return;
    }

    try {
      // 1. Update DB
      const updatedTenant = await this.tenantRepo.update(tenantId, {
        name: updates.name!,
        legal_name: updates.legal_name || null,
        tax_id: updates.tax_id || null,
        industry: updates.industry || 'Other',
        logo_url: updates.logo_url || null
      });

      if (updatedTenant) {
        // 2. Refresh Session
        this.session.setTenantContext(updatedTenant.id, role, updatedTenant.name);
        this.notification.success('Configuración actualizada exitosamente.');
        this.settingsForm.markAsPristine();
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      console.error('Error saving settings', error);
      this.notification.error('Error al guardar los cambios.');
    } finally {
      this.isSaving.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/launcher']);
  }
}
