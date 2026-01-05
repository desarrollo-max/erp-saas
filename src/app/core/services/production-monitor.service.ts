import { Injectable, inject } from '@angular/core';
import { ManufacturingRepository } from '../repositories/manufacturing.repository';
import { AssistantService } from './assistant.service';
import { SessionService } from './session.service';

@Injectable({
    providedIn: 'root'
})
export class ProductionMonitorService {
    private mfgRepo = inject(ManufacturingRepository);
    private assistant = inject(AssistantService);
    private session = inject(SessionService);

    constructor() {
        // El monitoreo se activa al instanciar el servicio
    }

    /**
     * Simula la verificación de stock contra el BOM de las órdenes de trabajo.
     * Si detecta faltantes, activa la alerta en la esfera de IA.
     */
    async checkWorkOrderStock() {
        const tenantId = this.session.currentTenantId();
        if (!tenantId) return;

        try {
            const orders = await this.mfgRepo.getProductionOrders(tenantId);

            // Filtramos las órdenes que están por iniciar
            const plannedOrders = orders.filter(o => o.status === 'PLANNED');

            for (const order of plannedOrders) {
                // Obtenemos el BOM para el producto de la orden
                const bom = await this.mfgRepo.getBomByProductId(order.product_id);
                if (!bom) continue;

                const bomItems = await this.mfgRepo.getBomItems(bom.id);

                // Simulación de validación de materiales críticos
                // En un escenario real, aquí consultaríamos el repositorio de inventario
                for (const item of bomItems) {
                    // Simulamos que un material específico siempre falta para la demo
                    if (item.scm_products?.name?.toLowerCase().includes('piel') ||
                        item.scm_products?.name?.toLowerCase().includes('suela')) {

                        this.assistant.triggerStockAlert(item.scm_products.name);
                        return true; // Solo disparamos una alerta a la vez para no saturar
                    }
                }
            }

            return false;
        } catch (e) {
            console.error('Error en el monitor de producción:', e);
            return false;
        }
    }

    startAutoMonitor() {
        // Verificación inicial tras 5 segundos
        setTimeout(() => this.checkWorkOrderStock(), 5000);

        // Verificación recurrente cada minuto
        setInterval(() => this.checkWorkOrderStock(), 60000);
    }
}
