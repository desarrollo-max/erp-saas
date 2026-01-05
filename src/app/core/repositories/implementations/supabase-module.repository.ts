import { inject, Injectable } from '@angular/core';
import { ModuleRepository } from '@core/repositories/module.repository';
import { Module } from '@core/models/module.model';
import { SupabaseService } from '@core/services/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class SupabaseModuleRepository extends ModuleRepository {
  private supabase = inject(SupabaseService);

  async getAllAvailable(): Promise<Module[]> {
    const { data, error } = await this.supabase.client
      .from('modules')
      .select('*')
      .eq('is_available', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Error fetching modules: ${error.message}`);
    }

    return data as Module[];
  }

  async getInstalledModules(clientId: string): Promise<Module[]> {
    // 1. Get IDs of installed modules
    const { data: licenses, error: licError } = await this.supabase.client
      .from('tenant_licenses')
      .select('module_id')
      .eq('tenant_id', clientId) // Mapping ClientID -> TenantID for licensing
      .eq('is_active', true);

    if (licError) throw new Error(`Error fetching licenses: ${licError.message}`);

    if (!licenses || licenses.length === 0) return [];

    const moduleIds = licenses.map(l => l.module_id);

    // 2. Get Module details
    const { data: modules, error: modError } = await this.supabase.client
      .from('modules')
      .select('*')
      .in('id', moduleIds)
      .order('sort_order');

    if (modError) throw new Error(`Error fetching installed modules: ${modError.message}`);

    return modules as Module[];
  }

  async installModule(clientId: string, moduleId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('tenant_licenses')
      .insert({
        tenant_id: clientId,
        module_id: moduleId,
        is_active: true,
        installed_at: new Date().toISOString(),
        usage_count: 0
      });

    if (error) throw new Error(`Error installing module: ${error.message}`);
  }

  async uninstallModule(clientId: string, moduleId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('tenant_licenses')
      .delete()
      .eq('tenant_id', clientId)
      .eq('module_id', moduleId);

    if (error) throw new Error(`Error uninstalling module: ${error.message}`);
  }

  async getById(id: string): Promise<Module | null> {
    const { data, error } = await this.supabase.client
      .from('modules')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching module by ID ${id}:`, error);
      return null;
    }

    return data as Module;
  }
}
