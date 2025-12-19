
import {
    MfgProductionOrder,
    MfgProcess,
    MfgStage,
    MfgBillOfMaterials
} from '../models/erp.types';

export abstract class ManufacturingRepository {
    abstract getProductionOrders(tenantId: string): Promise<MfgProductionOrder[]>;
    abstract getOrderById(orderId: string): Promise<MfgProductionOrder | undefined>; // NEW
    abstract createProductionOrder(order: Partial<MfgProductionOrder>): Promise<MfgProductionOrder>;
    abstract updateProductionOrder(orderId: string, order: Partial<MfgProductionOrder>): Promise<void>;
    abstract updateOrderStatus(orderId: string, stageId: string, status: string): Promise<void>;

    abstract getProcesses(tenantId: string): Promise<MfgProcess[]>;
    abstract getProcessStages(processId: string): Promise<MfgStage[]>;

    abstract getBoms(tenantId: string): Promise<MfgBillOfMaterials[]>;
    abstract getBomByProductId(productId: string): Promise<MfgBillOfMaterials | undefined>; // NEW
    abstract createBom(bom: Partial<MfgBillOfMaterials>): Promise<MfgBillOfMaterials>;
    abstract updateBom(bomId: string, bom: Partial<MfgBillOfMaterials>): Promise<void>;
    abstract getBomItems(bomId: string): Promise<any[]>;
    abstract createBomItem(item: Partial<any>): Promise<any>;
    abstract deleteBomItem(itemId: string): Promise<void>;

    // Process & Stages Management
    abstract createProcess(process: Partial<MfgProcess>): Promise<MfgProcess>;
    abstract updateProcess(id: string, process: Partial<MfgProcess>): Promise<void>;
    abstract deleteProcess(id: string): Promise<void>;

    abstract createStage(stage: Partial<MfgStage>): Promise<MfgStage>;
    abstract updateStage(id: string, stage: Partial<MfgStage>): Promise<void>;
    abstract deleteStage(id: string): Promise<void>;
}
