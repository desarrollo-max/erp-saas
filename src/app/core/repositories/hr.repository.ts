import { HrEmployee } from '../models/erp.types';

export abstract class HRRepository {
    abstract getEmployees(tenantId: string): Promise<HrEmployee[]>;
    abstract getEmployeeById(id: string): Promise<HrEmployee | null>;
    abstract createEmployee(employee: Partial<HrEmployee>): Promise<void>;
    abstract updateEmployee(id: string, employee: Partial<HrEmployee>): Promise<void>;
}
