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
    <div class="relative flex h-auto min-h-screen w-full flex-col bg-slate-950 group/design-root overflow-x-hidden" style='font-family: Inter, "Noto Sans", sans-serif;'>
      <div class="layout-container flex h-full grow flex-col">

        <!-- HEADER -->
        <header class="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-slate-800 px-10 py-4 bg-slate-900 shadow-sm z-10">
          <div class="flex items-center gap-4 text-white">
            <div class="size-8 text-primary-500">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
              </svg>
            </div>
            <h2 class="text-white text-2xl font-bold leading-tight tracking-[-0.015em]">SIAC ERP</h2>
          </div>
          <div class="flex flex-1 justify-end gap-8">
            <div class="flex items-center gap-4">
              <div class="hidden sm:flex flex-col items-end">
                <span class="text-sm font-bold text-white">{{ sessionService.user()?.email || 'Admin User' }}</span>
                <span class="text-xs text-slate-400">System Administrator</span>
              </div>
              <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-offset-2 ring-slate-800 ring-offset-slate-900">
                <div class="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold">
                  {{ (sessionService.user()?.email || 'A')[0].toUpperCase() }}
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- MAIN CONTENT -->
        <main class="flex flex-1 justify-center items-center py-12 px-6 sm:px-10 bg-slate-950">
          <div class="flex flex-col w-full max-w-[1200px]">

            <!-- TITLE SECTION -->
            <div class="text-center mb-12">
              <h1 class="text-white text-3xl md:text-4xl font-black leading-tight mb-3">Select Company</h1>
              <p class="text-slate-400 text-lg max-w-2xl mx-auto">Access your workspace by selecting a company below, or create a new organization to get started.</p>
            </div>

            <!-- COMPANIES GRID -->
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-2">

              <!-- EXISTING COMPANIES -->
              <button *ngFor="let company of userCompanies()"
                      (click)="selectCompany(company)"
                      class="group flex flex-col items-center gap-6 rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-sm transition-all duration-200 hover:shadow-xl hover:border-primary-500 hover:-translate-y-1 cursor-pointer">

                <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-2xl w-28 h-28 shadow-inner ring-1 ring-slate-700 group-hover:scale-105 transition-transform duration-300"
                     [style.background-image]="company.logo_url ? 'url(' + company.logo_url + ')' : 'linear-gradient(135deg, var(--primary-500), var(--primary-600))'">
                  <div *ngIf="!company.logo_url" class="w-full h-full flex items-center justify-center text-white text-3xl font-bold">
                    {{ company.name.charAt(0).toUpperCase() }}
                  </div>
                </div>

                <div class="flex flex-col items-center">
                  <h2 class="text-white text-xl font-bold leading-tight group-hover:text-primary-400 transition-colors">{{ company.name }}</h2>
                  <span class="text-sm text-slate-400 mt-1">{{ company.code }}</span>
                </div>
              </button>

              <!-- CREATE COMPANY BUTTON -->
              <button (click)="openCreateModal()"
                      class="group flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/50 p-8 shadow-sm transition-all duration-200 hover:shadow-xl hover:border-primary-400 hover:bg-slate-800/80 hover:-translate-y-1 cursor-pointer h-full min-h-[260px]">

                <div class="flex items-center justify-center w-24 h-24 rounded-full bg-slate-800 shadow-sm border border-slate-700 group-hover:scale-110 group-hover:border-primary-400 transition-all duration-300">
                  <ng-icon name="heroPlusSolid" class="text-5xl text-slate-400 group-hover:text-primary-400 transition-colors"></ng-icon>
                </div>

                <div class="flex flex-col items-center">
                  <h2 class="text-slate-400 text-xl font-bold leading-tight group-hover:text-primary-400 transition-colors">Create Company</h2>
                  <span class="text-sm text-slate-500 mt-1">Setup new entity</span>
                </div>
              </button>

            </div>

            <!-- LOGOUT BUTTON -->
            <div class="text-center mt-12">
              <button (click)="logout()" class="text-sm text-slate-400 hover:text-rose-400 transition-colors">
                Sign Out
              </button>
            </div>

          </div>
        </main>

      </div>
    </div>

    <!-- MODAL DE CREACIÓN DE EMPRESA -->
    <div *ngIf="isModalOpen()" class="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-md" (click)="closeCreateModal()"></div>

      <div class="w-full max-w-md p-10 rounded-[2.5rem] bg-slate-900 shadow-2xl relative z-10 border border-slate-800 animate-in zoom-in-95 duration-300">
        <h2 class="text-2xl font-black text-white uppercase italic mb-8">Nueva Organización</h2>

        <form [formGroup]="createCompanyForm" (ngSubmit)="createCompany()" class="space-y-8">
          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Nombre Legal</label>
            <input type="text" formControlName="name" placeholder="Ej: Corporativo Alpha"
                   class="w-full px-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all">
          </div>

          <div>
            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-4">Moneda Base</label>
            <select formControlName="currency" class="w-full px-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none">
              <option value="USD" class="bg-slate-800">USD - Dólar Americano</option>
              <option value="MXN" class="bg-slate-800">MXN - Peso Mexicano</option>
              <option value="EUR" class="bg-slate-800">EUR - Euro</option>
              <option value="COP" class="bg-slate-800">COP - Peso Colombiano</option>
            </select>
          </div>

          <div class="flex gap-4 pt-4">
            <button type="button" (click)="closeCreateModal()" class="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-300 transition-colors">
              Cancelar
            </button>
            <button type="submit" [disabled]="createCompanyForm.invalid || isCreating()"
                    class="flex-1 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {{ isCreating() ? 'Sincronizando...' : 'Crear Empresa' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- THEME SWITCHER -->
    <div class="fixed top-8 right-8 z-20">
       <button (click)="cycleThemeColor()" class="p-4 rounded-[2rem] text-slate-500 hover:bg-slate-800 transition-all focus:outline-none bg-slate-900/50 backdrop-blur-xl shadow-xl border border-slate-800/50">
          <div class="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">
            <div class="w-4 h-4 rounded-full" [style.background-color]="themeService.getCurrentPrimaryColor()"></div>
          </div>
       </button>
    </div>

    <!-- ESFERA FLOTANTE SIEMPRE VISIBLE -->
    <app-assistant-sphere></app-assistant-sphere>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100%;
      font-family: Inter, "Noto Sans", sans-serif;
    }

    .animate-fade-in {
      animation: fadeIn 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
        filter: blur(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
        filter: blur(0);
      }
    }

    .company-card {
      min-height: 100px;
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
  public sessionService = inject(SessionService);
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

  const userId = this.sessionService.currentUserId();

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
    await this.sessionService.setTenantContext(tenantId, role, name);

    // Explicitly enforce the selected Company ID
    this.sessionService.setCompanyContext(companyId);
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
    const userId = this.sessionService.currentUserId();
    
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
    this.sessionService.logout();
  }

  cycleThemeColor(): void {
    this.themeService.cycleColorTheme();
  }
}