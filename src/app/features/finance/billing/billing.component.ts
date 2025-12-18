import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceRepository } from '@core/repositories/finance.repository';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 animate-fade-in px-8 py-8">
      
      <!-- TOP NAV -->
      <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div>
          <h1 class="text-4xl font-black tracking-tighter mb-2">Facturación</h1>
          <div class="flex items-center gap-4">
             <span class="flex items-center gap-1.5 text-xs font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full uppercase tracking-widest">
                <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Conexión SAT Activa
             </span>
             <p class="text-slate-400 font-bold text-xs uppercase tracking-widest">Serie A - Folio actual: 882</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
             <button class="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                <ng-icon name="heroArrowDownTraySolid" class="w-4 h-4"></ng-icon>
                Reporte Mensual
             </button>
             <button class="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                <ng-icon name="heroPlusSolid" class="w-5 h-5"></ng-icon>
                Emitir CFDI
             </button>
        </div>
      </div>

      <!-- ANALYTICS -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           <div class="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                <div class="relative z-10">
                    <p class="text-xs font-black uppercase tracking-[0.3em] opacity-60 mb-4">Total por Cobrar</p>
                    <h3 class="text-5xl font-black mb-6">{{ totalAmount() | currency }}</h3>
                    <div class="flex items-center gap-8">
                        <div>
                            <p class="text-[10px] font-bold opacity-60 uppercase mb-1">Vencido</p>
                            <p class="text-xl font-black text-rose-300">$12,400.00</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold opacity-60 uppercase mb-1">Por Vencer</p>
                            <p class="text-xl font-black text-emerald-300">{{ totalAmount() - 12400 | currency }}</p>
                        </div>
                    </div>
                </div>
                <!-- Glass decorative -->
                <div class="absolute right-[-10%] top-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
           </div>

           <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Facturas Emitidas</p>
                    <h3 class="text-3xl font-black">{{ invoices().length }}</h3>
                </div>
                <div class="pt-4 mt-4 border-t border-slate-50 dark:border-slate-800/50">
                    <div class="flex justify-between text-xs font-bold text-slate-400">
                        <span>Éxito</span>
                        <span class="text-emerald-500">100%</span>
                    </div>
                </div>
           </div>

           <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Días Promedio Pago</p>
                    <h3 class="text-3xl font-black">12.5</h3>
                </div>
                <div class="pt-4 mt-4 border-t border-slate-50 dark:border-slate-800/50">
                    <div class="flex justify-between text-xs font-bold text-slate-400">
                        <span>Vs mes anterior</span>
                        <span class="text-emerald-500">-2.1 días</span>
                    </div>
                </div>
           </div>
      </div>

      <!-- INVOICE LIST -->
      <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden">
        <table class="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
          <thead class="bg-slate-50 dark:bg-slate-800/60 font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">
            <tr>
              <th class="px-8 py-6 text-left">Folio / UUID</th>
              <th class="px-8 py-6 text-left">Cliente Receptor</th>
              <th class="px-8 py-6 text-left">Emisión</th>
              <th class="px-8 py-6 text-left">Estado SAT</th>
              <th class="px-8 py-6 text-right">Total CFDI</th>
              <th class="px-8 py-6 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50 dark:divide-slate-800/50">
            <tr *ngFor="let inv of invoices()" class="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors">
              <td class="px-8 py-6 whitespace-nowrap">
                <div class="flex flex-col">
                    <span class="text-sm font-black text-indigo-600 dark:text-indigo-400">#{{ inv.folio }}</span>
                    <span class="text-[9px] font-mono text-slate-400 mt-1 uppercase">{{ inv.id.slice(0,18) }}...</span>
                </div>
              </td>
              <td class="px-8 py-6 whitespace-nowrap">
                <div class="flex flex-col">
                    <span class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ inv.client }}</span>
                    <span class="text-[10px] text-slate-400 font-medium">RFC: {{ inv.rfc }}</span>
                </div>
              </td>
              <td class="px-8 py-6 whitespace-nowrap text-xs font-bold text-slate-400 uppercase tracking-widest">{{ inv.date | date:'dd MMM yyyy' }}</td>
              <td class="px-8 py-6 whitespace-nowrap">
                <span [ngClass]="{
                    'bg-emerald-100 text-emerald-700': inv.status === 'PAGADO',
                    'bg-amber-100 text-amber-700': inv.status === 'PENDIENTE',
                    'bg-rose-100 text-rose-700': inv.status === 'CANCELADO'
                }" class="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-white dark:border-transparent">
                    {{ inv.status }}
                </span>
              </td>
              <td class="px-8 py-6 whitespace-nowrap text-right text-sm font-black">{{ inv.total | currency }}</td>
              <td class="px-8 py-6 whitespace-nowrap text-right">
                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button class="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><ng-icon name="heroPrinterSolid" class="w-5 h-5"></ng-icon></button>
                    <button class="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><ng-icon name="heroEnvelopeSolid" class="w-5 h-5"></ng-icon></button>
                    <button class="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><ng-icon name="heroEllipsisHorizontalSolid" class="w-5 h-5"></ng-icon></button>
                </div>
              </td>
            </tr>
            <tr *ngIf="invoices().length === 0">
                <td colspan="6" class="px-8 py-20 text-center text-slate-400 italic">No se han emitido comprobantes fiscales en el registro actual.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
  `]
})
export class BillingComponent implements OnInit {
  private financeRepo = inject(FinanceRepository);
  private session = inject(SessionService);
  private notification = inject(NotificationService);

  invoices = signal<any[]>([]);
  isLoading = signal(true);

  totalAmount = computed(() => this.invoices().reduce((acc, curr) => acc + (curr.total || 0), 0));

  async ngOnInit() {
    await this.loadInvoices();
  }

  async loadInvoices() {
    this.isLoading.set(true);
    try {
      const tenantId = this.session.currentTenantId();
      if (tenantId) {
        const data = await this.financeRepo.getInvoices(tenantId);
        if (data && data.length > 0) {
          this.invoices.set(data);
        } else {
          // Seed some pretty data
          this.invoices.set([
            { id: 'uuid-1-xxxx-yyyy-zzzz', folio: 'A-281', client: 'Agave Boots S.A. de C.V.', rfc: 'ABO120304XYZ', date: new Date(), total: 45200.00, status: 'PAGADO' },
            { id: 'uuid-2-xxxx-yyyy-zzzz', folio: 'A-282', client: 'Comercializadora León', rfc: 'CLE990101ABC', date: new Date(), total: 12400.00, status: 'PENDIENTE' },
            { id: 'uuid-3-xxxx-yyyy-zzzz', folio: 'A-283', client: 'Calzado Duramax', rfc: 'CDU880505LMK', date: new Date(), total: 8900.50, status: 'PAGADO' },
            { id: 'uuid-4-xxxx-yyyy-zzzz', folio: 'A-284', client: 'Exportadora Industrial', rfc: 'EIN050512TTR', date: new Date(), total: 67201.20, status: 'PENDIENTE' }
          ]);
        }
      }
    } catch (e) {
      console.error(e);
      this.notification.error('Error al sincronizar historial de facturación');
    } finally {
      this.isLoading.set(false);
    }
  }
}
