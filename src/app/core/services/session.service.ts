import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';

import { Tenant, Company } from '../models/erp.types';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  // Signals for Session Context (Only Tenant & Company - Client removed)
  public currentTenantId = signal<string | null>(null);
  public currentTenantName = signal<string | null>(null);
  public currentCompanyId = signal<string | null>(null);
  public currentUserRole = signal<string | null>(null);
  public currentUserId = signal<string | null>(null);

  // Signal para el usuario autenticado (Para HeaderComponent)
  public user = signal<{ email?: string; id?: string } | null>(null);

  public currentUser() {
    return this.user();
  }

  // Signal para el objeto completo del tenant
  public currentTenant = signal<Tenant | null>(null);
  public currentCompany = signal<Company | null>(null);

  // Computed Signal for Admin Check
  private _isAdmin = computed(() => {
    const role = this.currentUserRole();
    return role === 'owner'; // Solo el owner es super admin
  });

  // Método de acceso simple para usar en el if (this.session.isAdmin())
  public isAdmin(): boolean {
    return this._isAdmin();
  }

  // Método de acceso para el estado de login (Usado por el AuthGuard)
  // Devuelve TRUE solo si el CONTEXTO (Tenant ID) ha sido cargado.
  public isLoggedIn(): boolean {
    return !!this.currentTenantId();
  }

  constructor() {
    // Intentar recuperar contexto del LocalStorage al inicio
    const storedTenantId = localStorage.getItem('erp_tenant_id');
    const storedCompanyId = localStorage.getItem('erp_company_id');
    const storedRole = localStorage.getItem('erp_user_role');
    const storedName = localStorage.getItem('erp_tenant_name');

    if (storedTenantId && storedRole) {
      this.currentTenantId.set(storedTenantId);
      this.currentUserRole.set(storedRole);
      if (storedName) this.currentTenantName.set(storedName);
      if (storedCompanyId) this.currentCompanyId.set(storedCompanyId);
    }
  }

  // --- MÉTODOS DE CONTEXTO ---

  /**
   * Limpia profundamente el contexto de la sesión para evitar fugas de datos entre empresas.
   */
  public clearContext(): void {
    // Reset Signals
    this.currentTenantId.set(null);
    this.currentTenantName.set(null);
    this.currentUserRole.set(null);
    this.currentTenant.set(null);
    this.currentCompanyId.set(null);
    this.currentCompany.set(null);
    // userId and user stay until logout as they are identity-bound

    // Clear LocalStorage
    localStorage.removeItem('erp_tenant_id');
    localStorage.removeItem('erp_user_role');
    localStorage.removeItem('erp_tenant_name');
    localStorage.removeItem('erp_company_id');
    localStorage.removeItem('erp_client_id');
  }

  /**
   * Setea el contexto actual del Tenant seleccionado y lo persiste.
   * Contiene la lógica de redirección post-selección.
   */
  async setTenantContext(tenantId: string, role: string, name: string): Promise<void> {
    this.clearContext(); // Seguridad: Limpiar rastro previo

    this.currentTenantId.set(tenantId);
    this.currentUserRole.set(role);
    this.currentTenantName.set(name);

    // Persist to LocalStorage
    localStorage.setItem('erp_tenant_id', tenantId);
    localStorage.setItem('erp_user_role', role);
    localStorage.setItem('erp_tenant_name', name);

    // Load Company Context automatically
    await this.loadCompanyDetails(tenantId);

    // Redirección post-selección
    this.router.navigate(['/launcher']);

    // Buscar y setear el objeto completo del tenant
    await this.loadFullTenantDetails(tenantId);
  }

  setCompanyContext(companyId: string): void {
    this.currentCompanyId.set(companyId);
    localStorage.setItem('erp_company_id', companyId);
    this.loadFullCompanyDetails(companyId);
  }

  /**
   * Carga la primera compañía activa del tenant y establece el contexto.
   */
  private async loadCompanyDetails(tenantId: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.client
        .from('companies')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        this.setCompanyContext(data.id);
      }
    } catch (err) {
      console.error('Error loading company details:', err);
    }
  }

  /**
   * Carga los detalles completos de la compañía activa.
   */
  private async loadFullCompanyDetails(companyId: string) {
    const { data } = await this.supabase.client
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    if (data) {
      this.currentCompany.set(data);
    }
  }

  /**
   * Carga los detalles completos del tenant.
   */
  private async loadFullTenantDetails(tenantId: string) {
    const { data } = await this.supabase.client
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();
    if (data) {
      this.currentTenant.set(data as Tenant);
    }
  }

  /**
   * Main method to initialize the session (Called by AuthGuard).
   */
  async loadSession(forceReload: boolean = false): Promise<void> {
    try {
      const { data: { session }, error } = await this.supabase.client.auth.getSession();

      if (error || !session) {
        // No hay sesión activa en Supabase (token expiró o no existe)
        return;
      }

      // Always set the user ID from the active session regardless of tenant context state
      const userId = session.user.id;
      this.currentUserId.set(userId);
      this.user.set({ email: session.user.email, id: userId });

      // Si ya hay contexto (Tenant ID en Signals) y NO estamos forzando recarga, no hacemos nada más.
      if (this.currentTenantId() && !forceReload) {
        return;
      }

      // Si no hay contexto, lo cargamos desde la BD (esto pasa en el inicio de la app)

      // Fetch user's tenants
      const { data: userTenants, error: utError } = await this.supabase.client
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
        .eq('user_id', userId)
        .eq('is_active', true);

      if (utError) throw utError;

      if (!userTenants || userTenants.length === 0) {
        // No active tenant found
        return;
      }

    } catch (err) {
      console.error('Unexpected error loading session:', err);
      this.logout();
    }
  }

  /**
   * Clears session and redirects to login.
   */
  async logout(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.clearContext();
    this.currentUserId.set(null);
    this.user.set(null);
    this.router.navigate(['/login']);
  }
}