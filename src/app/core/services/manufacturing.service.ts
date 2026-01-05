import { Injectable, inject } from '@angular/core';
import { ManufacturingRepository } from '../repositories/manufacturing.repository';
import { InventoryRepository } from '../repositories/inventory.repository';
import { SessionService } from '../services/session.service';
import { MfgProductionOrder, MfgProcess, MfgStage } from '../models/erp.types';

/**
 * @service ManufacturingService
 * @description Servicio de orquestación para el módulo de Manufactura.
 * Gestiona el ciclo de vida de las órdenes de producción, el control de inventarios
 * reactivo (consumo y entrada de productos terminados) y la disponibilidad de materiales (BOM).
 */
@Injectable({
    providedIn: 'root'
})
export class ManufacturingService {
    private repo = inject(ManufacturingRepository);
    private inventoryRepo = inject(InventoryRepository);
    private session = inject(SessionService);

    /**
     * Obtiene el ID del tenant actual desde la sesión.
     * @private
     */
    private getTenantId(): string {
        return this.session.currentTenantId() || 't1'; // Fallback seguro para entornos de prueba
    }

    async getOrders(tenantId: string): Promise<MfgProductionOrder[]> {
        return this.repo.getProductionOrders(tenantId);
    }

    /**
     * Obtiene una lista de materiales (BOM) por su ID único.
     * @param bomId ID de la lista de materiales.
     * @async
     */
    async getBomById(bomId: string): Promise<any> {
        const boms = await this.repo.getBoms(this.getTenantId());
        return boms.find(b => b.id === bomId);
    }

    /**
     * Obtiene los procesos definidos para un tenant.
     * @param tenantId ID del tenant.
     */
    async getProcesses(tenantId: string): Promise<MfgProcess[]> {
        return this.repo.getProcesses(tenantId);
    }

    /**
     * Recupera las etapas asociadas a un proceso específico.
     * @param processId ID del proceso.
     */
    async getStages(processId: string): Promise<MfgStage[]> {
        return this.repo.getProcessStages(processId);
    }

    /**
     * Obtiene la lista de almacenes disponibles.
     * @param tenantId ID del tenant.
     */
    async getWarehouses(tenantId: string): Promise<any[]> {
        return this.inventoryRepo.getWarehouses(tenantId);
    }

    /**
     * Actualiza el estado de una orden de producción y su etapa actual.
     * Si la orden se marca como 'COMPLETED', se dispara el proceso de actualización de inventario.
     * @async
     */
    async updateOrderStatus(orderId: string, stageId: string, status: string): Promise<void> {
        await this.repo.updateOrderStatus(orderId, stageId, status);

        if (status === 'COMPLETED') {
            await this.completeProduction(orderId);
        }
    }

    /**
     * Finaliza la producción: Consume materias primas y da entrada al producto terminado.
     * @param orderId ID de la orden de producción a completar.
     * @private
     * @async
     */
    private async completeProduction(orderId: string) {
        const tenantId = this.getTenantId();
        const orders = await this.repo.getProductionOrders(tenantId);
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        // 1. Consumo de Materias Primas según BOM
        const boms = await this.repo.getBoms(tenantId);
        const bom = boms.find(b => b.finished_product_id === order.product_id && b.is_active);

        if (bom) {
            const items = await this.repo.getBomItems(bom.id);
            for (const item of items) {
                await this.inventoryRepo.createMovement({
                    tenant_id: order.tenant_id,
                    variant_id: item.component_product_id,
                    warehouse_id: order.warehouse_id || 'wh1',
                    movement_type: 'PRODUCTION_CONSUMPTION',
                    quantity: item.quantity * order.quantity,
                    reference_type: 'PRODUCTION_ORDER',
                    reference_id: order.id,
                    notes: `Consumo automático por Orden de Producción #${order.order_number}`
                });
            }
        }

        // 2. Entrada de Producto Terminado al Almacén
        await this.inventoryRepo.createMovement({
            tenant_id: order.tenant_id,
            variant_id: order.product_id,
            warehouse_id: order.warehouse_id || 'wh1',
            movement_type: 'PRODUCTION_OUTPUT',
            quantity: order.quantity,
            reference_type: 'PRODUCTION_ORDER',
            reference_id: order.id,
            notes: `Entrada de Producto Terminado por Orden de Producción #${order.order_number}`
        });
    }

    async createOrder(order: Partial<MfgProductionOrder>): Promise<MfgProductionOrder> {
        return this.repo.createProductionOrder(order);
    }

    /**
     * Verifica si hay existencias suficientes de todos los componentes de la BOM para una producción.
     * @param productId ID del producto terminado.
     * @param quantityToProduce Cantidad que se planea producir.
     * @param warehouseId ID del almacén donde se verificará el stock.
     * @returns Objeto indicando disponibilidad y lista de faltantes si los hay.
     * @async
     */
    async checkMaterialAvailability(productId: string, quantityToProduce: number, warehouseId: string): Promise<{ available: boolean, missing: any[] }> {
        const boms = await this.repo.getBoms(this.getTenantId());
        const bom = boms.find(b => b.finished_product_id === productId && b.is_active);

        if (!bom) {
            return { available: true, missing: [] };
        }

        const bomItems = await this.repo.getBomItems(bom.id);
        const missing = [];

        for (const item of bomItems) {
            const requiredQty = item.quantity * quantityToProduce;
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

