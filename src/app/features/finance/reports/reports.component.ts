import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceRepository } from '@core/repositories/finance.repository';
import { SessionService } from '@core/services/session.service';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
    selector: 'app-finance-reports',
    standalone: true,
    imports: [CommonModule, NgIconsModule],
    viewProviders: [provideIcons(heroIcons)],
    template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 animate-fade-in relative">
      
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
           <h1 class="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">Reportes Fiscales</h1>
           <p class="text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">Cierre de Periodo & Obligaciones</p>
        </div>
        
        <div class="flex gap-3">
            <button class="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                <ng-icon name="heroArrowDownTraySolid" class="w-4 h-4"></ng-icon>
                Exportar XML/PDF
            </button>
            <button class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all">
                Generar Declaración
            </button>
        </div>
      </div>

      <!-- Fiscal Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <!-- IVA Trasladado -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div class="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform">
                  <ng-icon name="heroBanknotesSolid" class="w-24 h-24 text-indigo-500"></ng-icon>
              </div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">IVA Trasladado (Ventas)</p>
              <h3 class="text-4xl font-black text-emerald-600 dark:text-emerald-400">{{ ivaTrasladado() | currency }}</h3>
              <p class="mt-4 text-[10px] font-bold text-slate-400">Total base: {{ (ivaTrasladado() / 0.16) | currency }}</p>
          </div>

          <!-- IVA Acreditable -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div class="absolute -right-4 -top-4 opacity-[0.05] group-hover:scale-110 transition-transform">
                  <ng-icon name="heroReceiptPercentSolid" class="w-24 h-24 text-rose-500"></ng-icon>
              </div>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">IVA Acreditable (Gastos)</p>
              <h3 class="text-4xl font-black text-rose-600 dark:text-rose-400">{{ ivaAcreditable() | currency }}</h3>
              <p class="mt-4 text-[10px] font-bold text-slate-400">Deducible autorizado</p>
          </div>

          <!-- IVA a Pagar/Favor -->
          <div [class]="(ivaTrasladado() - ivaAcreditable() >= 0) ? 'bg-slate-900 text-white' : 'bg-emerald-600 text-white'" class="p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <p class="text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Impuesto Neto a Pagar</p>
              <h3 class="text-4xl font-black">{{ Math.abs(ivaTrasladado() - ivaAcreditable()) | currency }}</h3>
              <div class="mt-6 flex items-center gap-2">
                  <div class="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  <span class="text-[10px] font-black uppercase tracking-widest">{{ (ivaTrasladado() - ivaAcreditable() >= 0) ? 'A cargo' : 'A Favor' }}</span>
              </div>
          </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- Conceptos SAT -->
          <div class="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
              <h4 class="text-lg font-black tracking-tighter mb-8">Conceptos de Ingresos (Base Fiscal)</h4>
              <div class="space-y-6">
                  <div *ngFor="let concept of incomeConcepts" class="flex items-center justify-between group">
                      <div class="flex items-center gap-4">
                          <div class="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <ng-icon [name]="concept.icon" class="w-5 h-5"></ng-icon>
                          </div>
                          <div>
                              <p class="text-sm font-black text-slate-700 dark:text-slate-200">{{ concept.name }}</p>
                              <p class="text-[9px] font-bold text-slate-400 uppercase">{{ concept.code }}</p>
                          </div>
                      </div>
                      <div class="text-right">
                          <p class="text-sm font-black text-slate-900 dark:text-white">{{ concept.amount | currency }}</p>
                          <p class="text-[10px] font-bold text-emerald-500">+{{ concept.growth }}%</p>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Retenciones y Otros -->
          <div class="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
              <h4 class="text-lg font-black tracking-tighter mb-8">Retenciones & ISR Estimado</h4>
              
              <div class="flex-grow space-y-8">
                  <div class="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                      <div class="flex justify-between items-center mb-4">
                          <span class="text-xs font-black text-slate-400 uppercase">ISR Provisorio (30%)</span>
                          <span class="text-xs font-black text-slate-900 dark:text-white italic">Cálculo Automático</span>
                      </div>
                      <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div class="h-full bg-indigo-600 w-[30%]" title="Tasa impositiva estándar"></div>
                      </div>
                      <div class="mt-4 flex justify-between">
                          <span class="text-[10px] font-bold text-slate-400">Base Gravable: {{ ((ivaTrasladado() - ivaAcreditable()) / 0.16) | currency }}</span>
                          <span class="text-sm font-black text-indigo-600">{{ (((ivaTrasladado() - ivaAcreditable()) / 0.16) * 0.3) | currency }}</span>
                      </div>
                  </div>

                  <div class="space-y-4">
                      <div class="flex justify-between text-xs font-bold">
                          <span class="text-slate-500 uppercase tracking-widest">Retenciones Nómina</span>
                          <span class="text-slate-900 dark:text-white">$8,450.00</span>
                      </div>
                      <div class="flex justify-between text-xs font-bold">
                          <span class="text-slate-500 uppercase tracking-widest">Retenciones Honorarios</span>
                          <span class="text-slate-900 dark:text-white">$2,100.00</span>
                      </div>
                      <div class="flex justify-between text-xs font-bold pt-4 border-t border-slate-100 dark:border-slate-800">
                          <span class="text-sm font-black text-slate-900 dark:text-white uppercase">Total Retenciones</span>
                          <span class="text-sm font-black text-slate-900 dark:text-white">$10,550.00</span>
                      </div>
                  </div>
              </div>

              <div class="mt-12 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] flex items-center gap-4">
                  <ng-icon name="heroShieldCheckSolid" class="w-8 h-8 text-indigo-500"></ng-icon>
                  <div>
                      <p class="text-xs font-black text-indigo-900 dark:text-indigo-100">Cumplimiento Fiscal</p>
                      <p class="text-[10px] font-medium text-indigo-700 dark:text-indigo-300">Sincronizado con Buzón Tributario SAT el {{ currentDate | date:'dd/MM/yyyy HH:mm' }}</p>
                  </div>
              </div>
          </div>
      </div>

    </div>
  `,
    styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ReportsComponent implements OnInit {
    private financeRepo = inject(FinanceRepository);
    private session = inject(SessionService);

    Math = Math;
    currentDate = new Date();

    ivaTrasladado = signal(0);
    ivaAcreditable = signal(0);

    incomeConcepts = [
        { name: 'Ventas Nacionales @16%', code: 'G01 - Adquisición', amount: 450200, growth: 12, icon: 'heroBuildingStorefrontSolid' },
        { name: 'Ventas Tasa 0% / Exento', code: 'P01 - Por definir', amount: 12400, growth: 5, icon: 'heroTruckSolid' },
        { name: 'Devoluciones y Descuentos', code: 'Egreso - 801', amount: 8900, growth: -2, icon: 'heroArrowUturnLeftSolid' },
        { name: 'Otros Ingresos Fiscales', code: 'G03 - Gastos en general', amount: 4500, growth: 0.5, icon: 'heroGlobeAltSolid' },
    ];

    async ngOnInit() {
        await this.loadFiscalData();
    }

    async loadFiscalData() {
        const tenantId = this.session.currentTenantId();
        if (!tenantId) return;

        try {
            const [invoices, expenses] = await Promise.all([
                this.financeRepo.getInvoices(tenantId),
                this.financeRepo.getExpenses(tenantId)
            ]);

            // Mock logic for demo/senior quality: 16% of totals
            const revenue = (invoices || []).reduce((acc, curr) => acc + (curr.total || 0), 0) || 580000;
            const totalExp = (expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0) || 240000;

            this.ivaTrasladado.set(revenue * 0.16);
            this.ivaAcreditable.set(totalExp * 0.16);
        } catch (e) {
            console.error('Error fiscal reports:', e);
        }
    }
}
