import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SessionService } from '@core/services/session.service';
import { CompanyRepository } from '@core/repositories/company.repository';
import { NotificationService } from '@core/services/notification.service';
import { SupabaseService } from '@core/services/supabase.service';
import { AssistantSphereComponent } from '@shared/components/assistant-sphere/assistant-sphere.component';
import { ThemeService } from '@core/services/theme.service';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

interface TenantWithRole {
  id: string;
  name: string;
  code: string;
  role: string;
}

@Component({
  selector: 'app-company-selector',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AssistantSphereComponent, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300" style="background-color: var(--app-bg); color: var(--app-text);">
      
      <!-- Theme Switcher Absolute Top Right -->
      <div class="absolute top-4 right-4">
         <button (click)="themeService.toggleTheme()" class="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition focus:outline-none bg-white dark:bg-slate-800 shadow-sm">
            <ng-icon [name]="themeService.isDark() ? 'heroSunSolid' : 'heroMoonSolid'" class="w-6 h-6"></ng-icon>
         </button>
      </div>

      <div class="w-full max-w-lg shadow-xl rounded-xl p-8 text-center relative transition-colors duration-300" style="background-color: var(--card-bg);">
        
        <h1 class="text-3xl font-extrabold mb-2" style="color: var(--app-text);">Selecciona una Empresa</h1>
        <p class="mb-8" style="color: var(--app-text-muted);">Elige la empresa con la que deseas trabajar para establecer el contexto.</p>

        <div *ngIf="isLoading()" class="py-10 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-3 text-indigo-600">Cargando tus empresas...</p>
        </div>

        <div *ngIf="!isLoading()">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <!-- Tarjetas de Selección de Empresa -->
            <div *ngFor="let company of userCompanies()" 
                 (click)="selectCompany(company)"
                 class="group p-4 rounded-lg border-2 border-transparent hover:border-indigo-500 transition cursor-pointer relative"
                 style="background-color: var(--subtle-bg);">
              
              <div class="text-2xl font-bold mb-1" style="color: var(--ai-core-secondary);">
                {{ company.name.charAt(0) }}
              </div>
              <p class="font-semibold" style="color: var(--app-text);">{{ company.name }}</p>
              <p class="text-xs" style="color: var(--app-text-muted);">{{ company.code }}</p>

              <!-- ACL Button Removed (Super Admin module deleted) -->
            </div>

            <!-- Botón para Agregar Nueva Empresa (Modal) -->
            <div (click)="openCreateModal()"
                 class="group border-2 border-dashed border-gray-400 dark:border-gray-600 bg-transparent p-4 rounded-lg transition cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20">
              
              <div class="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-1">
                +
              </div>
              <p class="font-semibold text-gray-600 dark:text-gray-400">Nueva Empresa</p>
              <p class="text-xs text-gray-500 dark:text-gray-500">Crear organización</p>
            </div>
          </div>
        </div>

        <button (click)="logout()" class="mt-8 text-sm text-gray-600 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400">
          Cerrar Sesión
        </button>
      </div>
    </div>

    <!-- MODAL DE CREACIÓN DE EMPRESA -->
    <div *ngIf="isModalOpen()" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div class="w-full max-w-md p-6 rounded-lg shadow-xl" style="background-color: var(--card-bg); color: var(--app-text);">
        <h2 class="text-xl font-bold mb-4">Crear Nueva Empresa</h2>
        
        <form [formGroup]="createCompanyForm" (ngSubmit)="createCompany()">
          <!-- Nombre -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1">Nombre de la Empresa</label>
            <input type="text" formControlName="name" placeholder="Ej: Mi Negocio S.A."
                   class="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
            <div *ngIf="createCompanyForm.controls.name.invalid && createCompanyForm.controls.name.touched" class="text-xs text-red-500 mt-1">
              Nombre requerido.
            </div>
          </div>

          <!-- Moneda -->
          <div class="mb-6">
            <label class="block text-sm font-medium mb-1">Moneda Principal</label>
            <select formControlName="currency" class="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
              <option value="USD">USD - Dólar Americano</option>
              <option value="MXN">MXN - Peso Mexicano</option>
              <option value="EUR">EUR - Euro</option>
              <option value="COP">COP - Peso Colombiano</option>
            </select>
          </div>

          <div class="flex justify-end gap-3">
            <button type="button" (click)="closeCreateModal()" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
              Cancelar
            </button>
            <button type="submit" [disabled]="createCompanyForm.invalid || isCreating()"
                    class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {{ isCreating() ? 'Creando...' : 'Crear' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ESFERA FLOTANTE SIEMPRE VISIBLE -->
    <app-assistant-sphere></app-assistant-sphere>
  `,
  styles: [`
    .company-card {
      min-height: 100px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  `]
})
export class CompanySelectorComponent implements OnInit {
  // Inyecciones
  private router = inject(Router);
  private companyRepo = inject(CompanyRepository);
  private notification = inject(NotificationService);
  private supabase = inject(SupabaseService);
  private fb = inject(FormBuilder);
  public session = inject(SessionService);
  public themeService = inject(ThemeService);

  // Estado
  userCompanies = signal<TenantWithRole[]>([]);
  isLoading = signal(true);
  isModalOpen = signal(false);
  isCreating = signal(false);

  // Formulario
  createCompanyForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    currency: ['USD', [Validators.required]]
  });

  async ngOnInit(): Promise<void> {
    const userId = this.session.currentUserId();

    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    await this.loadCompanies(userId);
  }

  async loadCompanies(userId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const { data: tenantLinks, error: linkError } = await (this.supabase.client as any)
        .from('users_tenants')
        .select(`
          tenant_id,
          role,
          tenants (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', userId);

      if (linkError) throw linkError;

      const companies = (tenantLinks as any[])
        .map(link => ({
          id: link.tenants.id,
          name: link.tenants.name,
          code: link.tenants.slug,
          role: link.role
        } as TenantWithRole));

      this.userCompanies.set(companies);

    } catch (error: any) {
      this.notification.error(`Error al cargar empresas: ${error.message}`);
      console.error('Error al cargar empresas:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  selectCompany(company: any): void {
    const role = company.role || 'user';
    const name = company.name;
    const tenantId = company.id;
    this.session.setTenantContext(tenantId, role, name);
  }

  // --- MODAL LOGIC ---

  openCreateModal() {
    this.isModalOpen.set(true);
    this.createCompanyForm.reset({ currency: 'USD' });
  }

  closeCreateModal() {
    this.isModalOpen.set(false);
  }

  async createCompany() {
    if (this.createCompanyForm.invalid) return;

    this.isCreating.set(true);
    const { name, currency } = this.createCompanyForm.value;
    const userId = this.session.currentUserId();

    try {
      // 1. Crear Tenant
      // Generamos un slug simple basado en el nombre + random
      const slug = name!.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

      const newTenant = {
        name: name,
        slug: slug,
        industry: 'Other', // Default
        is_active: true,
        created_by: userId,
        // TODO: Guardar currency si la tabla tenants tiene esa columna, o en settings
      };

      const { data: tenantData, error } = await (this.supabase as any).insert('tenants', newTenant);
      if (error) throw error;

      const createdTenantId = tenantData[0].id;

      // 2. Asignar usuario como Owner
      await (this.supabase as any).insert('users_tenants', {
        user_id: userId,
        tenant_id: createdTenantId,
        role: 'owner',
        is_active: true
      });

      // 3. Asignar módulos CORE (Launcher)
      // Necesitamos el ID del módulo launcher. Asumimos que existe un método o hardcodeamos por ahora.
      // Idealmente llamar a un servicio de provisionamiento compartido.
      // Por simplicidad, solo creamos la relación.

      // 3. Crear Categoría "Sin Categoría" por defecto
      // Esto asegura que las importaciones que no tengan categoría no fallen o queden huérfanas
      await (this.supabase.client as any).from('scm_product_categories').insert({
        tenant_id: createdTenantId,
        name: 'Sin Categoría',
        code: 'UNCAT',
        description: 'Categoría por defecto',
        is_active: true
      });

      this.notification.success('Empresa creada exitosamente.');
      this.closeCreateModal();
      await this.loadCompanies(userId!); // Recargar lista

    } catch (error: any) {
      console.error('Error al crear empresa:', error);
      this.notification.error('Error al crear empresa.');
    } finally {
      this.isCreating.set(false);
    }
  }



  logout(): void {
    this.session.logout();
  }
}