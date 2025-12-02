import { inject, Injectable } from '@angular/core';
import { ModuleRepository } from '../module.repository';
import { Module } from '../../models/module.model';
import { SupabaseService } from '../../services/supabase.service';

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

  async getInstalledModules(tenantId: string): Promise<Module[]> {
    // 1. Get IDs of installed modules
    const { data: licenses, error: licError } = await this.supabase.client
      .from('tenant_licenses')
      .select('module_id')
      .eq('tenant_id', tenantId)
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

  async installModule(tenantId: string, moduleId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('tenant_licenses')
      .insert({
        tenant_id: tenantId,
        module_id: moduleId,
        is_active: true,
        installed_at: new Date().toISOString(),
        usage_count: 0
      });

    if (error) throw new Error(`Error installing module: ${error.message}`);
  }
}
