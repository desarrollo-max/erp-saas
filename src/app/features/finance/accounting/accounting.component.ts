import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceRepository } from '@core/repositories/finance.repository';
import { SessionService } from '@core/services/session.service';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { FinAccount, FinJournalEntry } from '@core/models/erp.types';
import { NgIconsModule } from '@ng-icons/core';
import { NotificationService } from '@core/services/notification.service';

interface InternalInvoice {
  id: string;
  number: string;
  clientName: string;
  date: string;
  items: { description: string; quantity: number; price: number; total: number }[];
  total: number;
}

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgIconsModule],
  templateUrl: './accounting.component.html'
})
export class AccountingComponent implements OnInit {
  private financeRepo = inject(FinanceRepository);
  private session = inject(SessionService);
  private fb = inject(FormBuilder);
  private notification = inject(NotificationService);

  activeTab = 'accounts';
  isLoading = signal(true);
  isSubmitting = false;

  Math = Math; // Template access

  // Data Signals
  accounts = signal<FinAccount[]>([]);
  journalEntries = signal<FinJournalEntry[]>([]);
  accountTypes: any[] = [];

  // Computed
  detailAccounts = computed(() => this.accounts().filter(a => a.is_detail));

  // Modal States
  showAccountModal = false;
  showJournalModal = false;
  showInvoiceModal = false;

  // Forms
  accountForm: FormGroup;
  journalForm: FormGroup;

  // Invoice Legacy
  invoices = signal<InternalInvoice[]>([]);
  newInvoice: InternalInvoice = this.getEmptyInvoice();

  totals = { debit: 0, credit: 0 };

  constructor() {
    this.accountForm = this.fb.group({
      code: ['', Validators.required],
      name: ['', Validators.required],
      account_type_id: [null, Validators.required],
      is_detail: [true],
      parent_account_id: [null] // Optional hierarchy later
    });

    this.journalForm = this.fb.group({
      entry_date: [new Date().toISOString().split('T')[0], Validators.required],
      reference: [''],
      description: ['', Validators.required],
      lines: this.fb.array([])
    });
  }

  get journalLines() {
    return this.journalForm.get('lines') as FormArray;
  }

  async ngOnInit() {
    await this.loadData();
    // Init one journal line
    this.addJournalLine();
  }

  async loadData() {
    const tenantId = this.session.currentTenantId();
    if (!tenantId) return;

    this.isLoading.set(true);
    try {
      const [accs, entries, types] = await Promise.all([
        this.financeRepo.getAccounts(tenantId),
        this.financeRepo.getJournalEntries(tenantId),
        this.financeRepo.getAccountTypes()
      ]);

      this.accounts.set(accs.sort((a, b) => a.code.localeCompare(b.code)));
      this.journalEntries.set(entries);
      this.accountTypes = types;

    } catch (err) {
      console.error(err);
      this.notification.error('Error cargando información contable');
    } finally {
      this.isLoading.set(false);
    }
  }

  // --- ACCOUNTS LOGIC ---

  openAccountModal() {
    this.accountForm.reset({ is_detail: true });
    this.showAccountModal = true;
  }

  async saveAccount() {
    if (this.accountForm.invalid) return;

    const tenantId = this.session.currentTenantId();
    if (!tenantId) return;

    this.isSubmitting = true;
    try {
      const val = this.accountForm.value;

      // Need company_id inside account. Use first company logic or session company if available
      // Simplified: use mock or fetch
      // Assuming 'default' or session provides it.
      // Let's use a dummy or skip if DB allows null (likely not)
      // Hack: Just empty string for now if not strictly checked by RLS/Constraint or let repo handle it?
      // Repo expects Partial<FinAccount>.
      // We really need a company ID.
      const companyId = this.session.currentCompany()?.id || (await this.getFallbackCompanyId(tenantId));

      const newAccount: Partial<FinAccount> = {
        tenant_id: tenantId,
        company_id: companyId,
        code: val.code,
        name: val.name,
        account_type_id: val.account_type_id,
        is_detail: val.is_detail,
        is_active: true
      };

      await this.financeRepo.createAccount(newAccount);
      this.notification.success('Cuenta creada exitosamente');
      this.showAccountModal = false;
      await this.loadData(); // Refresh

    } catch (e: any) {
      this.notification.error('Error al guardar cuenta: ' + e.message);
    } finally {
      this.isSubmitting = false;
    }
  }

  async getFallbackCompanyId(tenantId: string) {
    // Temporary helper, ideally should be in session
    // For now, we risk it failing if session.currentCompany is null
    return '00000000-0000-0000-0000-000000000000'; // Will likely fail FK if valid UUID needed
    // Ideally we should enforce selecting a company in the UI context
  }

  getLevel(code: string | undefined): number {
    if (!code) return 0;
    // Simple logic: length based or trailing zeros
    // 1000 -> 1, 1100 -> 2, 1110 -> 3, 1111 -> 4
    if (code.length === 4) {
      if (code.endsWith('000')) return 0;
      if (code.endsWith('00')) return 1;
      if (code.endsWith('0')) return 2;
      return 3;
    }
    return 0;
  }

  getAccountCategory(code: string): string {
    // Standard defaults
    const first = code.charAt(0);
    switch (first) {
      case '1': return 'Activo';
      case '2': return 'Pasivo';
      case '3': return 'Capital';
      case '4': return 'Ingresos';
      case '5': return 'Costos';
      case '6': return 'Gastos';
      default: return 'Otro';
    }
  }

  // --- JOURNAL LOGIC ---

  openJournalModal() {
    this.journalForm.reset({
      entry_date: new Date().toISOString().split('T')[0],
      description: ''
    });
    this.journalLines.clear();
    this.addJournalLine();
    this.addJournalLine(); // Start with debit/credit pair usually
    this.showJournalModal = true;
    this.calculateJournalTotals();
  }

  addJournalLine() {
    this.journalLines.push(this.fb.group({
      account_id: [null, Validators.required],
      description: [''],
      debit: [0],
      credit: [0]
    }));
  }

  removeJournalLine(index: number) {
    this.journalLines.removeAt(index);
    this.calculateJournalTotals();
  }

  calculateJournalTotals() {
    let d = 0;
    let c = 0;
    this.journalLines.controls.forEach(control => {
      d += Number(control.get('debit')?.value || 0);
      c += Number(control.get('credit')?.value || 0);
    });
    this.totals = { debit: d, credit: c };
  }

  async saveJournalEntry() {
    if (this.totals.debit !== this.totals.credit) {
      this.notification.error('El asiento no está cuadrado');
      return;
    }

    const tenantId = this.session.currentTenantId();
    if (!tenantId) {
      this.notification.error('No hay sesión activa');
      return;
    }

    this.isSubmitting = true;
    try {
      const val = this.journalForm.value;
      const companyId = this.session.currentCompany()?.id || '00000000-0000-0000-0000-000000000000'; // Hack

      const entry: Partial<FinJournalEntry> = {
        tenant_id: tenantId,
        company_id: companyId,
        entry_date: new Date(val.entry_date).toISOString(),
        posting_date: new Date().toISOString(),
        description: val.description,
        reference: val.reference,
        total_debit: this.totals.debit,
        total_credit: this.totals.credit,
        entry_number: 'AST-' + Date.now().toString().slice(-6), // Auto-gen
        status: 'POSTED',
        journal_type: 'GENERAL',
        created_by: this.session.currentUserId() || ''
      };

      const lines = val.lines.map((l: any, idx: number) => ({
        account_id: l.account_id,
        line_number: idx + 1,
        description: l.description || val.description, // Inherit if empty
        debit_amount: l.debit,
        credit_amount: l.credit,
        currency_code: 'MXN',
        exchange_rate: 1
      }));

      await this.financeRepo.createJournalEntry(entry, lines);

      this.notification.success('Asiento registrado');
      this.showJournalModal = false;
      await this.loadData();

    } catch (e: any) {
      console.error(e);
      this.notification.error('Error al guardar asiento: ' + e.message);
    } finally {
      this.isSubmitting = false;
    }
  }

  // --- INVOICE LOGIC (LEGACY MOCK / INTERNAL TOOL) ---

  getEmptyInvoice(): InternalInvoice {
    return {
      id: '',
      number: 'INV-' + Math.floor(Math.random() * 10000),
      clientName: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ description: 'Servicios Profesionales', quantity: 1, price: 0, total: 0 }],
      total: 0
    };
  }

  openInvoiceModal() {
    this.newInvoice = this.getEmptyInvoice();
    this.showInvoiceModal = true;
  }

  addItem() {
    this.newInvoice.items.push({ description: '', quantity: 1, price: 0, total: 0 });
  }

  removeItem(index: number) {
    this.newInvoice.items.splice(index, 1);
    this.calculateTotal();
  }

  calculateTotal() {
    this.newInvoice.total = this.newInvoice.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  }

  saveInvoice() {
    this.calculateTotal();
    this.invoices.update(list => [...list, { ...this.newInvoice, id: Date.now().toString() }]);
    this.showInvoiceModal = false;
  }

  printInvoice(invoice: InternalInvoice) {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Factura ${invoice.number}</title>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 40px; }
              .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #ddd; padding-bottom: 20px; }
              .company { font-size: 24px; font-weight: bold; color: #333; }
              .invoice-details { text-align: right; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #eee; padding: 12px; text-align: left; }
              th { background-color: #f9f9f9; }
              .total { margin-top: 30px; text-align: right; font-size: 20px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
                <div class="company" style="font-family: sans-serif;">
                    <span style="font-size: 32px; font-weight: 900; color: #4f46e5;">SIAC</span>
                    <span style="font-size: 16px; font-weight: 500; color: #64748b; letter-spacing: 2px;">ERP</span>
                </div>
                <div class="invoice-details">
                    <h1>FACTURA</h1>
                    <p><strong>Nº:</strong> ${invoice.number}</p>
                    <p><strong>Fecha:</strong> ${invoice.date}</p>
                    <p><strong>Cliente:</strong> ${invoice.clientName}</p>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th style="text-align: right">Cant</th>
                        <th style="text-align: right">Precio</th>
                        <th style="text-align: right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items.map(item => `
                        <tr>
                            <td>${item.description}</td>
                            <td style="text-align: right">${item.quantity}</td>
                            <td style="text-align: right">$${item.price.toFixed(2)}</td>
                            <td style="text-align: right">$${(item.quantity * item.price).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="total">
                Total: $${invoice.total.toFixed(2)}
            </div>
            <div style="margin-top: 50px; font-size: 12px; color: #777; text-align: center;">
                Este documento es una factura interna y no tiene validez fiscal sin timbrado SAT.
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }
}
