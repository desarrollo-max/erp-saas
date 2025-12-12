import { SalesOpportunity, SalesContact, SalesCompany, SalesOrder, SalesOrderLine, SalesStage } from '../models/erp.types';

export abstract class SalesRepository {
    abstract getOpportunities(tenantId: string): Promise<SalesOpportunity[]>;
    abstract getStages(tenantId: string): Promise<SalesStage[]>;
    abstract getOpportunityById(id: string): Promise<SalesOpportunity | null>;
    abstract createOpportunity(opportunity: Partial<SalesOpportunity>): Promise<void>;
    abstract updateOpportunity(id: string, opportunity: Partial<SalesOpportunity>): Promise<void>;
    abstract deleteOpportunity(id: string): Promise<void>;

    abstract getContacts(tenantId: string): Promise<SalesContact[]>;
    abstract getContactById(id: string): Promise<SalesContact | null>;
    abstract createContact(contact: Partial<SalesContact>): Promise<void>;
    abstract updateContact(id: string, contact: Partial<SalesContact>): Promise<void>;
    abstract deleteContact(id: string): Promise<void>;

    abstract getCompanies(tenantId: string): Promise<SalesCompany[]>;
    abstract getCompanyById(id: string): Promise<SalesCompany | null>;
    abstract createCompany(company: Partial<SalesCompany>): Promise<void>;
    abstract updateCompany(id: string, company: Partial<SalesCompany>): Promise<void>;
    abstract deleteCompany(id: string): Promise<void>;

    // Order Management (Wholesale)
    abstract getOrders(tenantId: string): Promise<SalesOrder[]>;
    abstract getOrderById(id: string): Promise<SalesOrder | null>;
    abstract createOrder(order: Partial<SalesOrder>): Promise<SalesOrder>;
    abstract updateOrder(id: string, order: Partial<SalesOrder>): Promise<void>;
    abstract deleteOrder(id: string): Promise<void>;

    abstract getOrderLines(orderId: string): Promise<SalesOrderLine[]>;
    abstract createOrderLine(line: Partial<SalesOrderLine>): Promise<SalesOrderLine>;
    abstract deleteOrderLines(orderId: string): Promise<void>;
}
