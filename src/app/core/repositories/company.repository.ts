import { Company } from "../models/erp.types";

export abstract class CompanyRepository {
    abstract getAllByTenant(tenantId: string): Promise<Company[]>;
    abstract create(company: Partial<Company>): Promise<void>;
}
