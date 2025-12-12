import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { ManufacturingRepository } from '../manufacturing.repository';

import {
    MfgProductionOrder,
    MfgProcess,
    MfgStage,
    MfgBillOfMaterials
} from '../../models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class MockManufacturingRepository extends ManufacturingRepository {

    // Mock Data
    private orders: MfgProductionOrder[] = [
        {
            id: '1',
            tenant_id: 't1',
            company_id: 'c1',
            order_number: 'PO-001',
            product_id: 'prod1',
            quantity: 100,
            process_id: 'proc1',
            current_stage_id: 'stage1',
            status: 'IN_PROGRESS',
            priority: 'HIGH',
            start_date: new Date().toISOString(),
            due_date: new Date(Date.now() + 86400000 * 7).toISOString(),
            notes: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }
    ];

    private processes: MfgProcess[] = [
        {
            id: 'proc1',
            tenant_id: 't1',
            code: 'CUT-SEW-FINISH',
            name: 'Corte, Costura y Terminado',
            description: 'Proceso estándar de calzado',
            standard_duration_minutes: 120,
            is_active: true,
            created_at: new Date().toISOString()
        }
    ];


    private stages: MfgStage[] = [
        {
            id: 'stage1',
            process_id: 'proc1',
            name: 'Corte',
            description: 'Corte de piel',
            order_index: 1,
            is_quality_control_point: false,
            created_at: new Date().toISOString()
        },
        {
            id: 'stage2',
            process_id: 'proc1',
            name: 'Costura',
            description: 'Unión de piezas',
            order_index: 2,
            is_quality_control_point: true,
            created_at: new Date().toISOString()
        },
        {
            id: 'stage3',
            process_id: 'proc1',
            name: 'Terminado',
            description: 'Limpieza y empaque',
            order_index: 3,
            is_quality_control_point: true,
            created_at: new Date().toISOString()
        }
    ];



    private boms: MfgBillOfMaterials[] = [
        {
            id: 'bom1',
            tenant_id: 't1',
            finished_product_id: 'prod1',
            name: 'BOM Bota Vaquera',
            version: '1.0',
            is_active: true,
            created_at: new Date().toISOString()
        }
    ];
    private bomItems: any[] = [
        {
            id: 'bi1',
            bom_id: 'bom1',
            component_product_id: 'raw_leather_01',
            quantity: 2, // 2 units per product
            wastage_percent: 0,
            created_at: new Date().toISOString()
        },
        {
            id: 'bi2',
            bom_id: 'bom1',
            component_product_id: 'raw_thread_01',
            quantity: 5,
            wastage_percent: 0,
            created_at: new Date().toISOString()
        }
    ];


    async getProductionOrders(tenantId: string): Promise<MfgProductionOrder[]> {
        return this.orders;
    }

    async getOrderById(orderId: string): Promise<MfgProductionOrder | undefined> {
        return this.orders.find(o => o.id === orderId);
    }

    async createProductionOrder(order: Partial<MfgProductionOrder>): Promise<MfgProductionOrder> {
        const newOrder = {
            ...order,
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            status: 'PLANNED'
        } as MfgProductionOrder;
        this.orders.push(newOrder);
        return newOrder;
    }

    async updateOrderStatus(orderId: string, stageId: string, status: string): Promise<void> {
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.current_stage_id = stageId;
            order.status = status as any;
            order.updated_at = new Date().toISOString();
        }
    }

    async getProcesses(tenantId: string): Promise<MfgProcess[]> {
        return this.processes;
    }

    async getProcessStages(processId: string): Promise<MfgStage[]> {
        return this.stages.filter(s => s.process_id === processId);
    }

    async getBoms(tenantId: string): Promise<MfgBillOfMaterials[]> {
        return this.boms;
    }

    async getBomByProductId(productId: string): Promise<MfgBillOfMaterials | undefined> {
        return this.boms.find(b => b.finished_product_id === productId);
    }

    // --- Missing Implementations ---

    async createBom(bom: Partial<MfgBillOfMaterials>): Promise<MfgBillOfMaterials> {
        const newBom = {
            ...bom,
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
            is_active: true
        } as MfgBillOfMaterials;
        this.boms.push(newBom);
        return newBom;
    }

    async updateBom(bomId: string, bom: Partial<MfgBillOfMaterials>): Promise<void> {
        const index = this.boms.findIndex(b => b.id === bomId);
        if (index !== -1) {
            this.boms[index] = { ...this.boms[index], ...bom };
        }
    }

    async getBomItems(bomId: string): Promise<any[]> {
        return this.bomItems.filter(item => item.bom_id === bomId);
    }

    async createBomItem(item: Partial<any>): Promise<any> {
        const newItem = {
            ...item,
            id: Date.now().toString() + Math.random(),
            created_at: new Date().toISOString()
        };
        this.bomItems.push(newItem);
        return newItem;
    }

    async deleteBomItem(itemId: string): Promise<void> {
        this.bomItems = this.bomItems.filter(i => i.id !== itemId);
    }

    async createProcess(process: Partial<MfgProcess>): Promise<MfgProcess> {
        const newProcess = {
            ...process,
            id: Date.now().toString(),
            created_at: new Date().toISOString(),
            is_active: true
        } as MfgProcess;
        this.processes.push(newProcess);
        return newProcess;
    }

    async updateProcess(id: string, process: Partial<MfgProcess>): Promise<void> {
        const index = this.processes.findIndex(p => p.id === id);
        if (index !== -1) {
            this.processes[index] = { ...this.processes[index], ...process };
        }
    }

    async deleteProcess(id: string): Promise<void> {
        this.processes = this.processes.filter(p => p.id !== id);
    }

    async createStage(stage: Partial<MfgStage>): Promise<MfgStage> {
        const newStage = {
            ...stage,
            id: Date.now().toString(),
            created_at: new Date().toISOString()
        } as MfgStage;
        this.stages.push(newStage);
        return newStage;
    }

    async updateStage(id: string, stage: Partial<MfgStage>): Promise<void> {
        const index = this.stages.findIndex(s => s.id === id);
        if (index !== -1) {
            this.stages[index] = { ...this.stages[index], ...stage };
        }
    }

    async deleteStage(id: string): Promise<void> {
        this.stages = this.stages.filter(s => s.id !== id);
    }
}
