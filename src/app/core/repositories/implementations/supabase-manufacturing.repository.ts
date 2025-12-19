
import { Injectable, inject } from '@angular/core';
import { ManufacturingRepository } from '../manufacturing.repository';
import { SupabaseService } from '../../services/supabase.service';
import {
    MfgProductionOrder,
    MfgProcess,
    MfgStage,
    MfgBillOfMaterials,
    MfgBomItem
} from '../../models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class SupabaseManufacturingRepository extends ManufacturingRepository {
    private supabase = inject(SupabaseService);

    async getProductionOrders(tenantId: string): Promise<MfgProductionOrder[]> {
        const { data, error } = await this.supabase.client
            .from('mfg_production_orders')
            .select('*, scm_products(name), mfg_processes(name), mfg_stages(name)')
            .eq('tenant_id', tenantId);

        if (error) {
            console.error('Error fetching production orders:', error);
            return [];
        }
        return data as any[];
    }

    async getOrderById(orderId: string): Promise<MfgProductionOrder | undefined> {
        const { data, error } = await this.supabase.client
            .from('mfg_production_orders')
            .select('*, scm_products(name), mfg_processes(name), mfg_stages(name)')
            .eq('id', orderId)
            .single();

        if (error) return undefined;
        return data as any;
    }

    async createProductionOrder(order: Partial<MfgProductionOrder>): Promise<MfgProductionOrder> {
        const { data, error } = await this.supabase.client
            .from('mfg_production_orders')
            .insert(order)
            .select()
            .single();

        if (error) throw error;
        return data as MfgProductionOrder;
    }

    async updateProductionOrder(orderId: string, order: Partial<MfgProductionOrder>): Promise<void> {
        const { error } = await this.supabase.client
            .from('mfg_production_orders')
            .update(order)
            .eq('id', orderId);

        if (error) throw error;
    }

    async updateOrderStatus(orderId: string, stageId: string, status: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('mfg_production_orders')
            .update({ current_stage_id: stageId, status: status })
            .eq('id', orderId);

        if (error) throw error;
    }

    async getProcesses(tenantId: string): Promise<MfgProcess[]> {
        const { data, error } = await this.supabase.client
            .from('mfg_processes')
            .select('*')
            .eq('tenant_id', tenantId);

        if (error) return [];
        return data as MfgProcess[];
    }

    async getProcessStages(processId: string): Promise<MfgStage[]> {
        const { data, error } = await this.supabase.client
            .from('mfg_stages')
            .select('*')
            .eq('process_id', processId)
            .order('order_index');

        if (error) return [];
        return data as MfgStage[];
    }

    async getBoms(tenantId: string): Promise<MfgBillOfMaterials[]> {
        const { data, error } = await this.supabase.client
            .from('mfg_boms')
            .select('*, scm_products(name)')
            .eq('tenant_id', tenantId);

        if (error) return [];
        return data as any[];
    }

    async getBomByProductId(productId: string): Promise<MfgBillOfMaterials | undefined> {
        const { data, error } = await this.supabase.client
            .from('mfg_boms')
            .select('*')
            .eq('finished_product_id', productId)
            .single();

        if (error) return undefined;
        return data as MfgBillOfMaterials;
    }

    async createBom(bom: Partial<MfgBillOfMaterials>): Promise<MfgBillOfMaterials> {
        const { data, error } = await this.supabase.client
            .from('mfg_boms')
            .insert(bom)
            .select()
            .single();

        if (error) throw error;
        return data as MfgBillOfMaterials;
    }

    async updateBom(bomId: string, bom: Partial<MfgBillOfMaterials>): Promise<void> {
        const { error } = await this.supabase.client
            .from('mfg_boms')
            .update(bom)
            .eq('id', bomId);

        if (error) throw error;
    }

    async getBomItems(bomId: string): Promise<any[]> {
        const { data, error } = await this.supabase.client
            .from('mfg_bom_items')
            .select('*, scm_products(name, sku)')
            .eq('bom_id', bomId);

        if (error) return [];
        return data as any[];
    }

    async createBomItem(item: Partial<any>): Promise<any> {
        const { data, error } = await this.supabase.client
            .from('mfg_bom_items')
            .insert(item)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteBomItem(itemId: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('mfg_bom_items')
            .delete()
            .eq('id', itemId);

        if (error) throw error;
    }

    async createProcess(process: Partial<MfgProcess>): Promise<MfgProcess> {
        const { data, error } = await this.supabase.client
            .from('mfg_processes')
            .insert(process)
            .select()
            .single();

        if (error) throw error;
        return data as MfgProcess;
    }

    async updateProcess(id: string, process: Partial<MfgProcess>): Promise<void> {
        const { error } = await this.supabase.client
            .from('mfg_processes')
            .update(process)
            .eq('id', id);

        if (error) throw error;
    }

    async deleteProcess(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('mfg_processes')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    async createStage(stage: Partial<MfgStage>): Promise<MfgStage> {
        const { data, error } = await this.supabase.client
            .from('mfg_stages')
            .insert(stage)
            .select()
            .single();

        if (error) throw error;
        return data as MfgStage;
    }

    async updateStage(id: string, stage: Partial<MfgStage>): Promise<void> {
        const { error } = await this.supabase.client
            .from('mfg_stages')
            .update(stage)
            .eq('id', id);

        if (error) throw error;
    }

    async deleteStage(id: string): Promise<void> {
        const { error } = await this.supabase.client
            .from('mfg_stages')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
}
