import { PurchaseOrder, PurchaseOrderLine } from '@core/models/erp.types';

export abstract class PurchaseOrderRepository {
    // Headers
    abstract getAll(tenantId: string): Promise<PurchaseOrder[]>;
    abstract getById(id: string): Promise<PurchaseOrder | null>;
    abstract create(po: Partial<PurchaseOrder>): Promise<PurchaseOrder>;
    abstract update(id: string, po: Partial<PurchaseOrder>): Promise<PurchaseOrder>;
    abstract delete(id: string): Promise<void>;

    // Lines
    abstract getLines(purchaseOrderId: string): Promise<PurchaseOrderLine[]>;
    abstract addLine(line: Partial<PurchaseOrderLine>): Promise<PurchaseOrderLine>;
    abstract updateLine(id: string, line: Partial<PurchaseOrderLine>): Promise<PurchaseOrderLine>;
    abstract deleteLine(id: string): Promise<void>;
    abstract updateLineQuantity(lineId: string, receivedNow: number): Promise<void>;
    abstract receivePo(poId: string): Promise<void>;
    abstract receiveAll(poId: string): Promise<void>;
    abstract getPendingOrdersCount(): Promise<number>;
}
