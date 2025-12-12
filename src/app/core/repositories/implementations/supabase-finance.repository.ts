import { Injectable, inject } from '@angular/core';
import { FinanceRepository } from '../finance.repository';
import { SupabaseService } from '../../services/supabase.service';
import { FinAccount, FinJournalEntry } from '../../models/erp.types';

@Injectable({
    providedIn: 'root'
})
export class SupabaseFinanceRepository extends FinanceRepository {
    private supabase = inject(SupabaseService);

    async getAccounts(tenantId: string): Promise<FinAccount[]> {
        const { data, error } = await this.supabase.client
            .from('fin_accounts')
            .select('*')
            .eq('tenant_id', tenantId);
        if (error) throw error;
        return data as FinAccount[];
    }

    async createAccount(account: Partial<FinAccount>): Promise<void> {
        const { error } = await this.supabase.client
            .from('fin_accounts')
            .insert(account);
        if (error) throw error;
    }

    async getJournalEntries(tenantId: string): Promise<FinJournalEntry[]> {
        const { data, error } = await this.supabase.client
            .from('fin_journal_entries')
            .select('*')
            .eq('tenant_id', tenantId)
            .order('entry_date', { ascending: false });
        if (error) throw error;
        return data as FinJournalEntry[];
    }

    async createJournalEntry(entry: Partial<FinJournalEntry>, lines: any[]): Promise<void> {
        // Transaction logic would be ideal here, but Supabase JS client doesn't support complex transactions easily without RPC.
        // We will insert header then lines.
        const { data, error } = await this.supabase.client
            .from('fin_journal_entries')
            .insert(entry)
            .select()
            .single();

        if (error) throw error;

        const entryId = data.id;
        const linesWithId = lines.map(line => ({ ...line, journal_entry_id: entryId }));

        const { error: linesError } = await this.supabase.client
            .from('fin_journal_lines')
            .insert(linesWithId);

        if (linesError) {
            console.error('Error inserting lines, rolling back entry not implemented in client', linesError);
            throw linesError;
        }
    }

    async getAccountTypes(): Promise<any[]> {
        const { data, error } = await this.supabase.client
            .from('fin_account_types')
            .select('*')
            .eq('is_active', true);

        if (error) {
            console.warn('Error fetching account types', error);
            return [];
        }
        return data || [];
    }
}
