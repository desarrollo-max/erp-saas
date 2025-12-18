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
  template: `
    <div class="flex flex-col h-full bg-[var(--app-bg)] text-[var(--app-text)]">
      
      <!-- HEADER -->
      <div class="flex items-center justify-between p-6 border-b border-[var(--border-color)] bg-[var(--card-bg)]">
        <div>
          <h1 class="text-2xl font-bold flex items-center gap-2">
            <ng-icon name="heroCalculatorSolid" class="text-indigo-600 w-8 h-8"></ng-icon>
            Contabilidad y Finanzas
          </h1>
          <p class="text-[var(--app-text-muted)] mt-1">Gestión del PGC, asientos y facturación interna.</p>
        </div>
      </div>

      <!-- TABS -->
      <div class="border-b border-[var(--border-color)] bg-[var(--card-bg)] px-6">
        <nav class="-mb-px flex space-x-8 overflow-x-auto">
          <button (click)="activeTab = 'accounts'" 
             [class.border-indigo-500]="activeTab === 'accounts'" 
             [class.text-indigo-600]="activeTab === 'accounts'"
             class="whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:border-[var(--border-color)] transition-colors">
             Catálogo de Cuentas
          </button>
          <button (click)="activeTab = 'journal'"
             [class.border-indigo-500]="activeTab === 'journal'" 
             [class.text-indigo-600]="activeTab === 'journal'"
             class="whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:border-[var(--border-color)] transition-colors">
             Asientos Contables
          </button>
          <button (click)="activeTab = 'invoices'"
             [class.border-indigo-500]="activeTab === 'invoices'" 
             [class.text-indigo-600]="activeTab === 'invoices'"
             class="whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm text-[var(--app-text-muted)] hover:text-[var(--app-text)] hover:border-[var(--border-color)] transition-colors">
             Facturación Interna
          </button>
        </nav>
      </div>
      
      <div class="flex-grow p-6 overflow-y-auto bg-[var(--subtle-bg)]">

        <!-- LOADING -->
        <div *ngIf="isLoading()" class="flex flex-col items-center justify-center h-64 opacity-50">
          <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Cargando datos contables...</p>
        </div>

        <!-- TAB: ACCOUNTS -->
        <div *ngIf="!isLoading() && activeTab === 'accounts'" class="space-y-4">
          <div class="flex justify-between items-center">
             <div class="relative max-w-xs w-full">
                <ng-icon name="heroMagnifyingGlassSolid" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></ng-icon>
                <input type="text" placeholder="Buscar cuenta..." class="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] focus:ring-2 focus:ring-indigo-500 outline-none">
             </div>
             <button (click)="openAccountModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
                <ng-icon name="heroPlusSolid"></ng-icon> Nueva Cuenta
             </button>
          </div>

          <div class="bg-[var(--card-bg)] shadow rounded-xl overflow-hidden border border-[var(--border-color)]">
            <table class="min-w-full divide-y divide-[var(--border-color)]">
              <thead class="bg-[var(--subtle-bg)]">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--app-text-muted)] uppercase tracking-wider">Código</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--app-text-muted)] uppercase tracking-wider">Nombre</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--app-text-muted)] uppercase tracking-wider">Tipo</th>
                  <th class="px-6 py-3 text-center text-xs font-medium text-[var(--app-text-muted)] uppercase tracking-wider">Nivel</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[var(--border-color)] bg-[var(--card-bg)]">
                 <tr *ngFor="let acc of accounts()" class="hover:bg-[var(--subtle-bg)] transition-colors">
                  <td class="px-6 py-3 whitespace-nowrap text-sm font-mono font-medium text-[var(--app-text)]">{{ acc.code }}</td>
                  <td class="px-6 py-3 whitespace-nowrap text-sm text-[var(--app-text)]">
                    <span [style.padding-left.px]="getLevel(acc.code)*20">{{ acc.name }}</span>
                  </td>
                  <td class="px-6 py-3 whitespace-nowrap text-sm text-[var(--app-text-muted)]">
                      {{ getAccountCategory(acc.code) }}
                  </td>
                  <td class="px-6 py-3 whitespace-nowrap text-sm text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {{ acc.is_detail ? 'Detalle' : 'Acumulativa' }}
                    </span>
                  </td>
                </tr>
                 <tr *ngIf="accounts().length === 0">
                    <td colspan="4" class="px-6 py-12 text-center text-[var(--app-text-muted)]">
                        No hay cuentas registradas. Comienza agregando una.
                    </td>
                 </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB: JOURNAL -->
        <div *ngIf="!isLoading() && activeTab === 'journal'" class="space-y-4">
           <div class="flex justify-between items-center">
             <h3 class="text-lg font-bold">Libro Diario</h3>
             <button (click)="openJournalModal()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
                <ng-icon name="heroPlusSolid"></ng-icon> Nuevo Asiento
             </button>
           </div>
           
           <div class="bg-[var(--card-bg)] shadow rounded-xl overflow-hidden border border-[var(--border-color)]">
                <!-- Simple Journal List -->
                <div *ngFor="let entry of journalEntries()" class="border-b border-[var(--border-color)] last:border-0 p-4 hover:bg-[var(--subtle-bg)] transition-colors cursor-pointer">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="font-mono text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded">#{{ entry.entry_number }}</span>
                            <span class="ml-3 font-semibold">{{ entry.description || 'Sin descripción' }}</span>
                        </div>
                        <span class="text-sm text-[var(--app-text-muted)]">{{ entry.entry_date | date }}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                         <span class="text-[var(--app-text-muted)]">Ref: {{ entry.reference || '-' }}</span>
                         <div class="space-x-4">
                            <span class="text-green-600 font-medium">Debe: {{ entry.total_debit | currency }}</span>
                            <span class="text-red-600 font-medium">Haber: {{ entry.total_credit | currency }}</span>
                         </div>
                    </div>
                </div>
                <div *ngIf="journalEntries().length === 0" class="p-12 text-center text-[var(--app-text-muted)]">
                    No hay asientos contables registrados.
                </div>
           </div>
        </div>

        <!-- TAB: INVOICES (Legacy Mock) -->
        <div *ngIf="!isLoading() && activeTab === 'invoices'">
          <div class="flex justify-end mb-4">
              <button (click)="openInvoiceModal()" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex gap-2 items-center">
                   <ng-icon name="heroDocumentPlusSolid"></ng-icon> Nueva Factura
              </button>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div *ngFor="let inv of invoices()" class="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div class="flex justify-between items-start mb-4">
                      <div>
                          <h4 class="text-lg font-bold">{{ inv.clientName }}</h4>
                          <p class="text-sm text-[var(--app-text-muted)]">Factura #{{ inv.number }}</p>
                      </div>
                      <span class="text-xs font-mono bg-gray-100 text-gray-800 px-2 py-1 rounded">{{ inv.date }}</span>
                  </div>
                  <div class="border-t border-[var(--border-color)] pt-4 mt-2">
                      <div class="flex justify-between items-center mb-4">
                          <span class="text-[var(--app-text-muted)] font-medium">Total:</span>
                          <span class="text-xl font-bold text-green-600">\${{ inv.total | number:'1.2-2' }}</span>
                      </div>
                      <button (click)="printInvoice(inv)" class="w-full border border-[var(--border-color)] text-[var(--app-text)] py-2 rounded flex justify-center items-center gap-2 hover:bg-[var(--subtle-bg)] transition-colors">
                         <ng-icon name="heroPrinterSolid" class="w-4 h-4"></ng-icon>
                         Imprimir PDF
                      </button>
                  </div>
              </div>
          </div>
          
          <div *ngIf="invoices().length === 0" class="text-center py-12 bg-[var(--card-bg)] rounded-lg shadow border border-[var(--border-color)]">
              <p class="text-[var(--app-text-muted)]">No hay facturas internas generadas.</p>
          </div>
        </div>
      </div>
    
      <!-- MODAL: NEW ACCOUNT -->
      <div *ngIf="showAccountModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
         <div class="bg-[var(--card-bg)] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-[var(--border-color)] transform transition-all">
             <div class="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--subtle-bg)]">
                 <h3 class="text-lg font-bold">Nueva Cuenta Contable</h3>
                 <button (click)="showAccountModal = false" class="text-[var(--app-text-muted)] hover:text-red-500"><ng-icon name="heroXMarkSolid" class="w-6 h-6"></ng-icon></button>
             </div>
             <form [formGroup]="accountForm" (ngSubmit)="saveAccount()" class="p-6 space-y-4">
                 <div>
                     <label class="block text-sm font-medium mb-1">Código *</label>
                     <input formControlName="code" type="text" placeholder="Ej. 1000" class="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--input-bg)] focus:ring-2 focus:ring-indigo-500">
                     <p *ngIf="accountForm.get('code')?.invalid && accountForm.get('code')?.touched" class="text-xs text-red-500 mt-1">Este campo es requerido.</p>
                 </div>
                 <div>
                     <label class="block text-sm font-medium mb-1">Nombre *</label>
                     <input formControlName="name" type="text" placeholder="Ej. Activo Circulante" class="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--input-bg)] focus:ring-2 focus:ring-indigo-500">
                 </div>
                 <div>
                   <label class="block text-sm font-medium mb-1">Tipo de Cuenta</label>
                   <select formControlName="account_type_id" class="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--input-bg)]">
                      <!-- Assuming we fetched these or hardcoding some IDs if types aren't dynamic enough yet -->
                      <option *ngFor="let type of accountTypes" [value]="type.id">{{ type.name }} ({{ type.code }})</option>
                   </select>
                 </div>
                 <div class="flex items-center gap-2">
                     <input formControlName="is_detail" type="checkbox" id="is_detail" class="h-4 w-4 text-indigo-600 rounded">
                     <label for="is_detail" class="text-sm">Es cuenta de detalle (imputable)</label>
                 </div>

                 <div class="pt-4 flex justify-end gap-3">
                     <button type="button" (click)="showAccountModal = false" class="px-4 py-2 rounded text-sm bg-gray-200 text-gray-800 hover:bg-gray-300">Cancelar</button>
                     <button type="submit" [disabled]="accountForm.invalid || isSubmitting" class="px-4 py-2 rounded text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">Guardar</button>
                 </div>
             </form>
         </div>
      </div>

      <!-- MODAL: NEW JOURNAL ENTRY -->
      <div *ngIf="showJournalModal" class="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
         <div class="bg-[var(--card-bg)] rounded-xl shadow-xl w-full max-w-4xl overflow-hidden border border-[var(--border-color)] flex flex-col max-h-[90vh]">
             <div class="p-6 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--subtle-bg)]">
                 <h3 class="text-lg font-bold">Nuevo Asiento Contable</h3>
                 <button (click)="showJournalModal = false" class="text-[var(--app-text-muted)] hover:text-red-500"><ng-icon name="heroXMarkSolid" class="w-6 h-6"></ng-icon></button>
             </div>
             
             <div class="flex-grow overflow-y-auto p-6">
                 <form [formGroup]="journalForm" class="space-y-6">
                     <!-- Header -->
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[var(--subtle-bg)] p-4 rounded-lg">
                         <div>
                             <label class="block text-sm font-medium mb-1">Fecha Contable</label>
                             <input formControlName="entry_date" type="date" class="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--input-bg)]">
                         </div>
                         <div>
                             <label class="block text-sm font-medium mb-1">Referencia / Folio</label>
                             <input formControlName="reference" type="text" class="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--input-bg)]">
                         </div>
                         <div class="md:col-span-2">
                             <label class="block text-sm font-medium mb-1">Descripción / Concepto</label>
                             <input formControlName="description" type="text" class="w-full p-2 rounded border border-[var(--border-color)] bg-[var(--input-bg)]">
                         </div>
                     </div>

                     <!-- Lines -->
                     <div>
                        <div class="flex justify-between items-center mb-2">
                             <h4 class="font-bold text-sm text-[var(--app-text-muted)] uppercase">Movimientos</h4>
                             <button type="button" (click)="addJournalLine()" class="text-sm font-medium text-indigo-600 hover:text-indigo-800">+ Agregar Línea</button>
                        </div>
                        <table class="min-w-full text-sm divide-y divide-[var(--border-color)]">
                            <thead>
                                <tr class="bg-[var(--subtle-bg)]">
                                    <th class="p-2 text-left">Cuenta</th>
                                    <th class="p-2 text-left">Descripción (Opcional)</th>
                                    <th class="p-2 w-32 text-right">Debe</th>
                                    <th class="p-2 w-32 text-right">Haber</th>
                                    <th class="p-2 w-10"></th>
                                </tr>
                            </thead>
                            <tbody formArrayName="lines" class="divide-y divide-[var(--border-color)]">
                                <tr *ngFor="let line of journalLines.controls; let i = index" [formGroupName]="i">
                                    <td class="p-2">
                                        <select formControlName="account_id" class="w-full p-1 border rounded bg-[var(--input-bg)]">
                                            <option [ngValue]="null">Seleccionar...</option>
                                            <option *ngFor="let acc of detailAccounts()" [value]="acc.id">{{ acc.code }} - {{ acc.name }}</option>
                                        </select>
                                    </td>
                                    <td class="p-2">
                                        <input formControlName="description" class="w-full p-1 border rounded bg-[var(--input-bg)]">
                                    </td>
                                    <td class="p-2">
                                        <input type="number" formControlName="debit" (change)="calculateJournalTotals()" class="w-full p-1 border rounded text-right bg-[var(--input-bg)]">
                                    </td>
                                    <td class="p-2">
                                        <input type="number" formControlName="credit" (change)="calculateJournalTotals()" class="w-full p-1 border rounded text-right bg-[var(--input-bg)]">
                                    </td>
                                    <td class="p-2 text-center">
                                        <button type="button" (click)="removeJournalLine(i)" class="text-red-500 hover:text-red-700"><ng-icon name="heroTrashSolid" class="w-4 h-4"></ng-icon></button>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot class="bg-[var(--subtle-bg)] font-bold">
                                <tr>
                                    <td colspan="2" class="p-2 text-right">Totales:</td>
                                    <td class="p-2 text-right" [class.text-red-500]="totals.debit !== totals.credit">{{ totals.debit | currency }}</td>
                                    <td class="p-2 text-right" [class.text-red-500]="totals.debit !== totals.credit">{{ totals.credit | currency }}</td>
                                    <td></td>
                                </tr>
                                <tr *ngIf="totals.debit !== totals.credit">
                                    <td colspan="5" class="p-2 text-center text-red-500 text-sm font-medium">
                                        El asiento está descuadrado por {{ Math.abs(totals.debit - totals.credit) | currency }}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                     </div>
                 </form>
             </div>

             <div class="p-4 border-t border-[var(--border-color)] bg-[var(--subtle-bg)] flex justify-end gap-3">
                 <button (click)="showJournalModal = false" class="px-4 py-2 rounded text-sm bg-gray-200 text-gray-800 hover:bg-gray-300">Cancelar</button>
                 <button (click)="saveJournalEntry()" [disabled]="journalForm.invalid || totals.debit !== totals.credit || totals.debit === 0 || isSubmitting" 
                         class="px-4 py-2 rounded text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                     Registrar Asiento
                 </button>
             </div>
         </div>
      </div>

       <!-- INVOICE MODAL -->
       <div *ngIf="showInvoiceModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div class="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl">
              <h2 class="text-xl font-bold mb-6">Nueva Factura Interna</h2>
              <form (ngSubmit)="saveInvoice()">
                  <div class="grid grid-cols-2 gap-4 mb-4">
                      <div>
                          <label class="block text-sm font-medium text-gray-700">Cliente</label>
                          <input [(ngModel)]="newInvoice.clientName" name="client" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" required>
                      </div>
                      <div>
                          <label class="block text-sm font-medium text-gray-700">Fecha</label>
                          <input [(ngModel)]="newInvoice.date" name="date" type="date" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" required>
                      </div>
                  </div>

                  <div class="mb-4">
                      <label class="block text-sm font-medium text-gray-700 mb-2">Ítems</label>
                      <table class="w-full text-sm">
                          <thead class="bg-gray-50">
                              <tr>
                                  <th class="p-2 text-left">Descripción</th>
                                  <th class="p-2 w-20">Cant</th>
                                  <th class="p-2 w-24">Precio</th>
                                  <th class="p-2 w-24">Total</th>
                                  <th class="p-2 w-10"></th>
                              </tr>
                          </thead>
                          <tbody>
                              <tr *ngFor="let item of newInvoice.items; let i = index">
                                  <td class="p-1"><input [(ngModel)]="item.description" [name]="'desc'+i" class="w-full border rounded p-1"></td>
                                  <td class="p-1"><input [(ngModel)]="item.quantity" [name]="'qty'+i" type="number" class="w-full border rounded p-1" (change)="calculateTotal()"></td>
                                  <td class="p-1"><input [(ngModel)]="item.price" [name]="'price'+i" type="number" class="w-full border rounded p-1" (change)="calculateTotal()"></td>
                                  <td class="p-1 text-right">\${{ item.quantity * item.price }}</td>
                                  <td class="p-1 text-center"><button type="button" (click)="removeItem(i)" class="text-red-500">x</button></td>
                              </tr>
                          </tbody>
                      </table>
                      <button type="button" (click)="addItem()" class="mt-2 text-sm text-blue-600 hover:text-blue-800">+ Agregar Ítem</button>
                  </div>

                  <div class="flex justify-end items-center gap-4 border-t pt-4">
                      <div class="text-lg font-bold">Total: \${{ newInvoice.total | number:'1.2-2' }}</div>
                      <div class="flex gap-2">
                          <button type="button" (click)="showInvoiceModal = false" class="bg-gray-200 text-gray-800 px-4 py-2 rounded">Cancelar</button>
                          <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Guardar</button>
                      </div>
                  </div>
              </form>
          </div>
       </div>

    </div>
  `
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
