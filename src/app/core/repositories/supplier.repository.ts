import { Supplier } from '@core/models/erp.types';

export abstract class SupplierRepository {
    abstract getAll(tenantId: string): Promise<Supplier[]>;
    abstract getById(id: string): Promise<Supplier | null>;
    abstract create(supplier: Partial<Supplier>): Promise<Supplier>;
    abstract update(id: string, supplier: Partial<Supplier>): Promise<Supplier>;
    abstract delete(id: string): Promise<void>;
}
