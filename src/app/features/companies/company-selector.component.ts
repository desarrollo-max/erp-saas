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
import { APP_ICONS } from '@core/constants/app-icons';

interface TenantWithRole {
  id: string;
  name: string;
  code: string;
  role: string;
  logo_url?: string;
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
            <ng-icon [name]="themeService.isDark() ? ICONS.themeSun : ICONS.themeMoon" class="w-6 h-6"></ng-icon>
         </button>
      </div>

      <div class="w-full max-w-lg shadow-xl rounded-xl p-6 sm:p-8 text-center relative transition-colors duration-300" style="background-color: var(--card-bg);">
        
        <h1 class="text-2xl sm:text-3xl font-extrabold mb-2" style="color: var(--app-text);">Selecciona una Empresa</h1>
        <p class="mb-8 text-sm sm:text-base" style="color: var(--app-text-muted);">Elige la empresa con la que deseas trabajar para establecer el contexto.</p>

        <div *ngIf="isLoading()" class="py-10 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-3 text-indigo-600">Cargando tus empresas...</p>
        </div>

        <div *ngIf="!isLoading()">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <!-- Tarjetas de Selección de Empresa -->
            <div *ngFor="let company of userCompanies()" 
                 (click)="selectCompany(company)"
                 class="group p-4 sm:p-6 rounded-lg border-2 border-transparent hover:border-indigo-500 transition cursor-pointer relative min-h-[140px] flex flex-col items-center justify-center"
                 style="background-color: var(--subtle-bg);">
              
              <div class="mb-3">
                 <ng-container *ngIf="company.logo_url; else defaultInitial">
                    <img [src]="company.logo_url" alt="Logo" class="h-16 w-16 object-contain rounded-md bg-white border border-gray-100">
                 </ng-container>
                 <ng-template #defaultInitial>
                    <div class="text-3xl font-bold" style="color: var(--ai-core-secondary);">
                      {{ company.name.charAt(0) }}
                    </div>
                 </ng-template>
              </div>

              <p class="font-semibold text-lg" style="color: var(--app-text);">{{ company.name }}</p>
              <p class="text-sm" style="color: var(--app-text-muted);">{{ company.code }}</p>

            </div>

            <!-- Botón para Agregar Nueva Empresa (Modal) -->
            <div (click)="openCreateModal()"
                 class="group border-2 border-dashed border-gray-400 dark:border-gray-600 bg-transparent p-4 sm:p-6 rounded-lg transition cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 min-h-[140px] flex flex-col items-center justify-center">
              
              <div class="text-2xl font-bold text-gray-400 dark:text-gray-500 mb-1">
                +
              </div>
              <p class="font-semibold text-lg text-gray-600 dark:text-gray-400">Nueva Empresa</p>
              <p class="text-sm text-gray-500 dark:text-gray-500">Crear organización</p>
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

  public readonly ICONS = APP_ICONS;

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
      // 1. Get Tenant IDs the user has access to
      const { data: userTenants, error: utError } = await this.supabase.client
        .from('users_tenants')
        .select('tenant_id, role')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (utError) throw utError;

      if (!userTenants || userTenants.length === 0) {
        this.userCompanies.set([]);
        return;
      }

      const tenantIds = userTenants.map(ut => ut.tenant_id);
      const roleMap = new Map(userTenants.map(ut => [ut.tenant_id, ut.role]));

      // 2. Fetch Companies (Actual Legal Entities) for these Tenants
      const { data: companies, error: compError } = await this.supabase.client
        .from('companies')
        .select(`
          id,
          name,
          code,
          logo_url,
          tenant_id,
          tenants (
            name
          )
        `)
        .in('tenant_id', tenantIds)
        .eq('is_active', true);

      if (compError) throw compError;

      // 3. Map to display interface
      // 3. Map to display interface
      const displayList = (companies || []).map(comp => {
        // Safe access to joined tenant property which might be array or object
        const tenantName = Array.isArray(comp.tenants) ? comp.tenants[0]?.name : (comp.tenants as any)?.name;

        return {
          id: comp.id, // This is the COMPANY ID
          company_id: comp.id,
          tenant_id: comp.tenant_id,
          name: comp.name,
          code: comp.code,
          role: roleMap.get(comp.tenant_id) || 'user',
          logo_url: comp.logo_url,
          tenant_name: tenantName
        };
      });

      this.userCompanies.set(displayList as any[]); // Using any to bypass strict interface mismatch if needed, or update interface

    } catch (error: any) {
      this.notification.error(`Error al cargar empresas: ${error.message}`);
      console.error('Error al cargar empresas:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async selectCompany(company: any): Promise<void> {
    const role = company.role || 'user';
    const name = company.tenant_name || company.name; // Tenant Name for UI context usually
    const tenantId = company.tenant_id;
    const companyId = company.id;

    // Set Tenant Context first (which triggers auto-load of company, but we will override)
    await this.session.setTenantContext(tenantId, role, name);

    // Explicitly enforce the selected Company ID
    this.session.setCompanyContext(companyId);
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
      // 1. Crear Tenant (Contenedor Principal)
      const slug = name!.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);

      const newTenant = {
        name: name,
        slug: slug,
        industry: 'Other', // Default
        is_active: true,
        created_by: userId,
      };

      const { data: tenantData, error } = await (this.supabase.client).from('tenants').insert(newTenant).select();
      if (error) throw error;
      if (!tenantData || !tenantData.length) throw new Error('Failed to create tenant');

      const createdTenantId = tenantData[0].id;

      // 2. Asignar usuario como Owner
      await (this.supabase.client).from('users_tenants').insert({
        user_id: userId,
        tenant_id: createdTenantId,
        role: 'owner',
        is_active: true
      });

      // 3. Crear Registro en 'companies' (La Entidad Legal)
      // ESTO ES CLAVE: Sin esto, el selector de compañías (que ahora lee de 'companies') saldría vacío.
      await (this.supabase.client).from('companies').insert({
        tenant_id: createdTenantId,
        name: name, // Usamos el mismo nombre para la primera compañía
        code: 'MAIN',
        currency_code: currency,
        is_active: true
      });

      // 4. Crear Categoría Default (Opcional pero útil)
      await (this.supabase.client).from('scm_product_categories').insert({
        tenant_id: createdTenantId,
        name: 'Sin Categoría',
        code: 'UNCAT',
        description: 'Categoría por defecto',
        is_active: true
      });

      this.notification.success('Organización creada exitosamente.');
      this.closeCreateModal();
      await this.loadCompanies(userId!); // Recargar lista desde 'companies'

    } catch (error: any) {
      console.error('Error al crear organización:', error);
      this.notification.error('Error al crear organización.');
    } finally {
      this.isCreating.set(false);
    }
  }

  logout(): void {
    this.session.logout();
  }
}