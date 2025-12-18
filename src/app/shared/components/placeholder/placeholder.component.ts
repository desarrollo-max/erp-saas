import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule, NgIconsModule, RouterModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="flex flex-col h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 animate-fade-in">
      
      <!-- PREMIUM HEADER -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
        <div class="flex items-center gap-5">
          <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-200 dark:shadow-none transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <ng-icon [name]="getModuleIcon()" class="text-white w-8 h-8"></ng-icon>
          </div>
          <div>
            <nav class="flex mb-1" aria-label="Breadcrumb">
              <ol class="inline-flex items-center space-x-1 md:space-x-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <li class="inline-flex items-center">
                  {{ category() }}
                </li>
                <li>
                  <div class="flex items-center">
                    <ng-icon name="heroChevronRightSolid" class="w-2 h-2 mx-1"></ng-icon>
                    <span class="text-indigo-500">{{ feature() }}</span>
                  </div>
                </li>
              </ol>
            </nav>
            <h1 class="text-3xl font-black tracking-tighter">{{ feature() | titlecase }}</h1>
          </div>
        </div>

        <div class="flex items-center gap-3">
            <span class="hidden md:inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
              <span class="relative flex h-2 w-2 mr-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Sincronizado
            </span>
            <button class="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all text-sm">
                Acción Rápida
            </button>
        </div>
      </div>

      <!-- PREMIUM PLACEHOLDER CONTENT -->
      <div class="flex-grow p-8 overflow-y-auto">
        
        <!-- DASHBOARD SUMMARY (Dynamic Mock) -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div *ngFor="let kpi of getMockKPIs()" class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{{ kpi.label }}</p>
                <div class="flex items-baseline gap-2">
                    <h3 class="text-3xl font-black tabular-nums">{{ kpi.value }}</h3>
                    <span class="text-[10px] font-black text-slate-400">{{ kpi.unit }}</span>
                </div>
                <div class="mt-4 flex items-center text-[10px] font-bold" [ngClass]="kpi.trend === 'up' ? 'text-emerald-500' : 'text-slate-400'">
                    <ng-icon [name]="kpi.trend === 'up' ? 'heroArrowTrendingUpSolid' : 'heroArrowPathSolid'" class="mr-1"></ng-icon>
                    {{ kpi.detail }}
                </div>
            </div>
        </div>

        <!-- MAIN VIEW (List or Empty State) -->
        <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden min-h-[500px] flex flex-col relative transition-all duration-500">
            
            <div class="p-8 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center">
                <h3 class="text-xl font-black tracking-tight">Registro de {{ feature() | titlecase }}</h3>
                <div class="flex gap-2">
                    <button class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                        <ng-icon name="heroMagnifyingGlassSolid" class="w-4 h-4"></ng-icon>
                    </button>
                    <button class="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400">
                        <ng-icon name="heroFunnelSolid" class="w-4 h-4"></ng-icon>
                    </button>
                </div>
            </div>

            <div class="flex-grow flex flex-col items-center justify-center p-12 text-center relative z-10">
                <div class="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform">
                    <div class="absolute inset-0 rounded-full border-2 border-dashed border-indigo-500/30 animate-[spin_15s_linear_infinite]"></div>
                    <ng-icon [name]="getModuleIcon()" class="text-indigo-400 dark:text-indigo-600 w-10 h-10"></ng-icon>
                </div>
                <h3 class="text-2xl font-black mb-3 text-slate-900 dark:text-white capitalize">Inicia con {{ feature() }}</h3>
                <p class="text-slate-500 dark:text-slate-400 mb-10 max-w-sm font-medium">Este módulo está listo para procesar información. Configura los parámetros básicos o importa registros para visualizar métricas de rendimiento.</p>
                
                <div class="flex flex-wrap justify-center gap-4">
                    <button class="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm shadow-2xl shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all hover:translate-y-[-2px]">
                        Configurar Ahora
                    </button>
                    <button class="px-10 py-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] font-black text-xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-all uppercase tracking-widest">
                        Documentación
                    </button>
                </div>
            </div>

            <!-- Decorative grid -->
            <div class="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" 
                 style="background-image: radial-gradient(#6366f1 1px, transparent 1px); background-size: 48px 48px;">
            </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; width: 100%; }
    .animate-fade-in {
      animation: fadeIn 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
      to { opacity: 1; transform: translateY(0); filter: blur(0); }
    }
  `]
})
export class PlaceholderComponent implements OnInit {
  private route = inject(ActivatedRoute);

  category = signal<string>('General');
  feature = signal<string>('Módulo Especializado');

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const cat = params.get('category');
      const feat = params.get('feature');
      if (cat) this.category.set(cat.replace(/-/g, ' '));
      if (feat) this.feature.set(feat.replace(/-/g, ' '));
    });
  }

  getModuleIcon(): string {
    const feat = this.feature().toLowerCase();
    const cat = this.category().toLowerCase();

    if (feat.includes('blog') || feat.includes('noticia')) return 'heroNewspaperSolid';
    if (feat.includes('chat') || feat.includes('socia')) return 'heroChatBubbleLeftRightSolid';
    if (feat.includes('ecommerce') || feat.includes('tienda')) return 'heroShoppingBagSolid';
    if (feat.includes('aprendiz') || feat.includes('learning')) return 'heroAcademicCapSolid';
    if (feat.includes('proyec')) return 'heroSquares2x2Solid';
    if (feat.includes('horar') || feat.includes('planifi')) return 'heroCalendarDaysSolid';
    if (feat.includes('factura') || feat.includes('invoice')) return 'heroDocumentTextSolid';
    if (feat.includes('gasto')) return 'heroCreditCardSolid';
    if (feat.includes('caja') || feat.includes('tesoro')) return 'heroCurrencyDollarSolid';

    if (cat.includes('venta')) return 'heroPresentationChartLineSolid';
    if (cat.includes('finanza')) return 'heroCalculatorSolid';
    if (cat.includes('cadena') || cat.includes('suministro')) return 'heroArchiveBoxSolid';
    if (cat.includes('rrhh') || cat.includes('recurso')) return 'heroUsersSolid';
    if (cat.includes('marketing')) return 'heroMegaphoneSolid';

    return 'heroCubeSolid';
  }

  getMockKPIs() {
    const feat = this.feature().toLowerCase();
    if (feat.includes('factura')) {
      return [
        { label: 'Total Emitido', value: '$0.00', unit: 'MXN', trend: 'neutral', detail: '0 facturas este mes' },
        { label: 'Pendientes', value: '0', unit: 'CFDI', trend: 'neutral', detail: 'Sin cobros pendientes' },
        { label: 'Canceladas', value: '0', unit: 'docs', trend: 'neutral', detail: '0% de tasa' },
        { label: 'Días Cobro', value: '--', unit: 'Prom', trend: 'neutral', detail: 'Sin datos históricos' }
      ];
    }
    if (feat.includes('proyec')) {
      return [
        { label: 'Proyectos Activos', value: '0', unit: 'PJS', trend: 'neutral', detail: 'Sincronizando...' },
        { label: 'Horas Totales', value: '0.0', unit: 'HRS', trend: 'neutral', detail: 'Este periodo' },
        { label: 'Presupuesto', value: '$0.00', unit: 'MXN', trend: 'neutral', detail: '0% consumido' },
        { label: 'Tareas', value: '0', unit: 'QTY', trend: 'neutral', detail: '0 urgentes' }
      ];
    }
    return [
      { label: 'Volumen', value: '0', unit: 'UNIT', trend: 'neutral', detail: 'Esperando registros' },
      { label: 'Eficiencia', value: '0%', unit: 'AVG', trend: 'neutral', detail: 'Sin base histórica' },
      { label: 'Valor', value: '$0.00', unit: 'MXN', trend: 'neutral', detail: 'Total periodo' },
      { label: 'Status', value: '--', unit: 'SYS', trend: 'neutral', detail: 'Módulo Activo' }
    ];
  }
}
