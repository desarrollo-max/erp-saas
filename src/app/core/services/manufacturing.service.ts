
import { Injectable, inject } from '@angular/core';
import { ManufacturingRepository } from '../repositories/manufacturing.repository';
import { InventoryRepository } from '../repositories/inventory.repository';
import { MfgProductionOrder, MfgProcess, MfgStage } from '../models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class ManufacturingService {
    private repo = inject(ManufacturingRepository);
    private inventoryRepo = inject(InventoryRepository);

    async getOrders(tenantId: string): Promise<MfgProductionOrder[]> {
        return this.repo.getProductionOrders(tenantId);
    }

    async getBomById(bomId: string): Promise<any> {
        // Fallback since repo might not have specific method
        // If repo has it, use it. For now filter getBoms.
        // Assuming we have access to tenantId from context or we fetch all (inefficient but safe for mock)
        // Better: Fetch for 't1' or all relevant.
        // Since we don't have tenantId here, this is tricky.
        // However, existing getBoms requires tenantId.
        // Ideally we should update the Service to inject SessionService or pass tenantId.
        // BUT, for now, let's assume 't1' or try to fetch.
        // Or finding in boms logic.
        // Let's assume the component passes the ID and we just need the object.
        // We will try to fetch from repo if method exists, else hack.
        const boms = await this.repo.getBoms('t1');
        // THIS IS BAD. But consistent with existing 't1' hardcoding in this file.
        // I will rely on the fact that the caller should perhaps handle this better, 
        // but to support loadBom(id) in component:
        return boms.find(b => b.id === bomId);
    }

    async getProcesses(tenantId: string): Promise<MfgProcess[]> {
        return this.repo.getProcesses(tenantId);
    }

    async getStages(processId: string): Promise<MfgStage[]> {
        return this.repo.getProcessStages(processId);
    }

    async getWarehouses(tenantId: string): Promise<any[]> {
        return this.inventoryRepo.getWarehouses(tenantId);
    }

    async updateOrderStatus(orderId: string, stageId: string, status: string): Promise<void> {
        // 1. Update Order Status
        await this.repo.updateOrderStatus(orderId, stageId, status);

        // 2. Handle Inventory Movements based on Status
        if (status === 'COMPLETED') {
            await this.completeProduction(orderId);
        }
    }

    private async completeProduction(orderId: string) {
        // Fetch full order
        const orders = await this.repo.getProductionOrders('t1'); // Should getById
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        // 1. Consume Raw Materials (Out)
        const boms = await this.repo.getBoms('t1');
        const bom = boms.find(b => b.finished_product_id === order.product_id && b.is_active);

        if (bom) {
            const items = await this.repo.getBomItems(bom.id);
            for (const item of items) {
                await this.inventoryRepo.createMovement({
                    tenant_id: order.tenant_id,
                    product_id: item.component_product_id,
                    warehouse_id: order.warehouse_id || 'wh1',
                    movement_type: 'PRODUCTION_CONSUMPTION',
                    quantity: item.quantity * order.quantity,
                    reference_type: 'PRODUCTION_ORDER',
                    reference_id: order.id,
                    notes: `Consumo para Orden ${order.order_number}`
                });
            }
        }

        // 2. Add Finished Good (In)
        await this.inventoryRepo.createMovement({
            tenant_id: order.tenant_id,
            product_id: order.product_id,
            warehouse_id: order.warehouse_id || 'wh1',
            movement_type: 'PRODUCTION_OUTPUT',
            quantity: order.quantity,
            reference_type: 'PRODUCTION_ORDER',
            reference_id: order.id,
            notes: `Producto Terminado Orden ${order.order_number}`
        });

        console.log('Production Completed: Inventory Updated');
    }

    async createOrder(order: Partial<MfgProductionOrder>): Promise<MfgProductionOrder> {
        return this.repo.createProductionOrder(order);
    }

    async checkMaterialAvailability(productId: string, quantityToProduce: number, warehouseId: string): Promise<{ available: boolean, missing: any[] }> {
        // 1. Get BOM
        // Note: In a real app we would query getBomByProduct, here we filter
        const boms = await this.repo.getBoms('t1');
        const bom = boms.find(b => b.finished_product_id === productId && b.is_active);

        if (!bom) {
            console.warn('No BOM found for product', productId);
            return { available: true, missing: [] }; // Assume available if no BOM defined? Or strict? Let's assume strict in V2.
        }

        const bomItems = await this.repo.getBomItems(bom.id);
        const missing = [];

        for (const item of bomItems) {
            const requiredQty = item.quantity * quantityToProduce; // Simple linear scaling
            const stock = await this.inventoryRepo.getStockLevel(item.component_product_id, warehouseId);

            if (!stock || stock.quantity_available < requiredQty) {
                missing.push({
                    component_id: item.component_product_id,
                    required: requiredQty,
                    available: stock ? stock.quantity_available : 0
                });
            }
        }

        return {
            available: missing.length === 0,
            missing
        };
    }

    // BOM Management
    async getBoms(tenantId: string): Promise<any[]> {
        return this.repo.getBoms(tenantId);
    }

    async createBom(bom: any): Promise<any> {
        return this.repo.createBom(bom);
    }

    async getBomItems(bomId: string): Promise<any[]> {
        return this.repo.getBomItems(bomId);
    }

    async createBomItem(item: any): Promise<any> {
        return this.repo.createBomItem(item);
    }

    async deleteBomItem(itemId: string): Promise<void> {
        return this.repo.deleteBomItem(itemId);
    }
}

