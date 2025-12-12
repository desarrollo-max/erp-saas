import { FinAccount, FinJournalEntry } from '../models/erp.types';

export abstract class FinanceRepository {
    abstract getAccounts(tenantId: string): Promise<FinAccount[]>;
    abstract createAccount(account: Partial<FinAccount>): Promise<void>;

    abstract getJournalEntries(tenantId: string): Promise<FinJournalEntry[]>;
    abstract createJournalEntry(entry: Partial<FinJournalEntry>, lines: any[]): Promise<void>;

    abstract getAccountTypes(): Promise<any[]>;
}
