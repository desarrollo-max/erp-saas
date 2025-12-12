import { Injectable, inject } from '@angular/core';
import { ManufacturingRepository } from '../repositories/manufacturing.repository';
import { InventoryRepository } from '../repositories/inventory.repository';
import { NotificationService } from './notification.service';
import { MfgProductionOrder } from '../models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class ProductionService {
    private mfgRepo = inject(ManufacturingRepository);
    private inventoryRepo = inject(InventoryRepository);
    private notification = inject(NotificationService);

    async startProduction(orderId: string, tenantId: string) {
        try {
            // 1. Obtener la orden con su BOM
            const order = await this.mfgRepo.getOrderById(orderId);
            if (!order) throw new Error('Orden no encontrada');

            const bom = await this.mfgRepo.getBomByProductId(order.product_id);
            if (!bom) {
                this.notification.warning('No se encontró Receta (BOM) para este producto. Iniciando sin descuentos de material.');
            } else {
                // 2. Descontar materias primas
                const items = await this.mfgRepo.getBomItems(bom.id);
                for (const item of items) {
                    const qtyRequired = item.quantity * order.quantity;

                    await this.inventoryRepo.createMovement({
                        tenant_id: tenantId,
                        product_id: item.component_product_id,
                        warehouse_id: order.warehouse_id || 'DEFAULT_WAREHOUSE',
                        movement_type: 'OUT',
                        quantity: qtyRequired,
                        reference_type: 'PRODUCTION_ORDER',
                        reference_id: orderId,
                        notes: `Consumo para Producción: ${order.order_number}`
                    });
                }
            }

            // 3. Actualizar estado
            await this.mfgRepo.updateOrderStatus(orderId, order.current_stage_id, 'IN_PROGRESS');
            this.notification.success('Producción iniciada. Materiales descontados.');
        } catch (error) {
            console.error(error);
            this.notification.error('Error al iniciar producción.');
            throw error;
        }
    }

    async finishProduction(orderId: string, tenantId: string) {
        try {
            const order = await this.mfgRepo.getOrderById(orderId);
            if (!order) throw new Error('Orden no encontrada');

            // 1. Ingresar Producto Terminado
            await this.inventoryRepo.createMovement({
                tenant_id: tenantId,
                product_id: order.product_id,
                warehouse_id: order.warehouse_id || 'DEFAULT_WAREHOUSE',
                movement_type: 'PRODUCTION_OUTPUT',
                quantity: order.quantity,
                reference_type: 'PRODUCTION_ORDER',
                reference_id: orderId,
                notes: `Producción Finalizada: ${order.order_number}`
            });

            // 2. Actualizar estado
            await this.mfgRepo.updateOrderStatus(orderId, order.current_stage_id, 'COMPLETED');
            this.notification.success('Producción finalizada. Stock actualizado.');

        } catch (error) {
            console.error(error);
            this.notification.error('Error al finalizar producción.');
            throw error;
        }
    }
}
