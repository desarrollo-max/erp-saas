import { Injectable, signal, WritableSignal, isDevMode, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Company, Tenant } from '../models/erp.types';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  public currentTenant = signal<Tenant | null>(null);
  public currentCompany = signal<Company | null>(null);
  public availableCompanies: WritableSignal<Company[]> = signal([]);
  public availableModules = signal<string[]>([]);

  private supabase = inject(SupabaseService);

  constructor(private router: Router) { }

  private isDevelopmentMode(): boolean {
    return isDevMode();
  }

  async initSession(): Promise<void> {
    try {
      const { data: { session } } = await this.supabase.client.auth.getSession();

      if (session?.user) {
        console.log('User authenticated, fetching tenant info...');
        // 1. Buscar relación User -> Tenant
        const { data: userTenants, error: utError } = await this.supabase.client
          .from('users_tenants')
          .select('tenant_id')
          .eq('user_id', session.user.id)
          .limit(1);

        if (utError) console.error('Error fetching users_tenants:', utError);

        if (userTenants && userTenants.length > 0) {
          const tenantId = userTenants[0].tenant_id;

          // 2. Obtener datos del Tenant
          const { data: tenantData, error: tError } = await this.supabase.client
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .single();

          if (tError) console.error('Error fetching tenant:', tError);

          if (tenantData) {
            console.log('Tenant found:', tenantData.name);
            this.currentTenant.set(tenantData as Tenant);

            // 3. Obtener Companies del Tenant
            const { data: companiesData, error: cError } = await this.supabase.client
              .from('companies')
              .select('*')
              .eq('tenant_id', tenantId);

            if (cError) console.error('Error fetching companies:', cError);

            if (companiesData) {
              this.availableCompanies.set(companiesData as Company[]);
            }
            return; // Éxito, salimos.
          } else { // If tenantData is null, meaning tenant not found for the tenantId
            console.warn('Tenant not found for user. Auto-provisioning...');
            await this.createDefaultTenant(session.user.id, session.user.email);
          }
        } else {
          console.warn('User has no linked tenant. Creating default tenant...');
          await this.createDefaultTenant(session.user.id, session.user.email);
        }
      }
    } catch (err) {
      console.error('Error initializing session:', err);
    }
  }

  private async createDefaultTenant(userId: string, email: string | undefined): Promise<void> {
    console.log('Creating default tenant for user...');

    // 1. Crear Tenant
    const newTenant: Partial<Tenant> = {
      name: 'Mi Organización',
      slug: `org-${Date.now()}`,
      industry: 'Technology',
      primary_color: '#4f46e5',
      is_active: true,
      subscription_status: 'free_trial',
      trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días
      max_users: 5,
      max_companies: 1,
      storage_gb: 1,
      metadata: { created_via: 'auto-provision' }
    };

    const { data: tenant, error: tError } = await this.supabase.client
      .from('tenants')
      .insert(newTenant)
      .select()
      .single();

    if (tError) {
      console.error('Error creating tenant:', tError);
      return;
    }

    // 2. Vincular Usuario con Tenant
    const newUserTenant = {
      user_id: userId,
      tenant_id: tenant.id,
      role: 'owner',
      is_active: true,
      joined_at: new Date().toISOString()
    };

    const { error: utError } = await this.supabase.client
      .from('users_tenants')
      .insert(newUserTenant);

    if (utError) {
      console.error('Error linking user to tenant:', utError);
      // Podríamos intentar borrar el tenant huérfano aquí, pero por ahora solo logueamos
      return;
    }

    console.log('Tenant auto-provisioned:', tenant);
    this.currentTenant.set(tenant as Tenant);
    this.availableCompanies.set([]);
  }

  private initializeMockSession(): void {
    // Mock session disabled to ensure DB integrity. Please ensure you have a valid Tenant in Supabase.
    console.warn('Mock Session is disabled to ensure DB integrity. Please ensure you have a valid Tenant in Supabase.');
  }

  selectCompany(company: Company): void {
    this.currentCompany.set(company);

    // Simulate permission loading
    if (company.id === '4d29e92a-6943-4ed3-9613-c6c9d23354c4') { // Matriz S.A.
      this.availableModules.set(['dashboard', 'inventory', 'marketplace', 'settings']);
    } else { // Sucursal Norte
      this.availableModules.set(['dashboard', 'inventory']);
    }

    this.router.navigate(['/launcher']);
  }

  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.currentTenant.set(null);
    this.currentCompany.set(null);
    this.availableCompanies.set([]);
    this.availableModules.set([]);
    this.router.navigate(['/login']);
  }
}