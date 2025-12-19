
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
    selector: 'app-manufacturing-launcher',
    standalone: true,
    imports: [CommonModule, NgIconsModule, RouterModule],
    viewProviders: [provideIcons(heroIcons)],
    template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 animate-fade-in relative overflow-hidden">
      
      <!-- Background Elements -->
      <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
      <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -ml-64 -mb-64"></div>

      <!-- Main Container -->
      <div class="max-w-7xl mx-auto relative z-10">
        
        <!-- Header -->
        <div class="mb-12">
            <h1 class="text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-2 italic uppercase">Manufactura</h1>
            <p class="text-slate-400 font-bold text-xs uppercase tracking-[0.4em]">Integrated Manufacturing Intelligence</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            <!-- Dashboard Card -->
            <div [routerLink]="['./dashboard']" 
                 class="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden">
                <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-700 text-slate-400">
                    <ng-icon name="heroChartBarSolid" class="w-16 h-16"></ng-icon>
                </div>
                <div class="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-indigo-100 dark:shadow-none">
                    <ng-icon name="heroChartPieSolid" class="w-5 h-5"></ng-icon>
                </div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase italic">Centro de Mando</h3>
                <p class="text-xs text-slate-400 font-medium leading-relaxed uppercase tracking-tighter">KPIs y métricas en tiempo real.</p>
                <div class="mt-6 flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    Ingresar <ng-icon name="heroArrowRightSolid"></ng-icon>
                </div>
            </div>

            <!-- Orders Card -->
            <div [routerLink]="['./work-orders']" 
                 class="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden">
                <div class="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 group-hover:opacity-10 transition-all duration-700 text-orange-400">
                    <ng-icon name="heroQueueListSolid" class="w-16 h-16"></ng-icon>
                </div>
                <div class="w-10 h-10 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-600 mb-4 group-hover:bg-orange-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-orange-100 dark:shadow-none">
                    <ng-icon name="heroClipboardDocumentCheckSolid" class="w-5 h-5"></ng-icon>
                </div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase italic">Órdenes de Trabajo</h3>
                <p class="text-xs text-slate-400 font-medium leading-relaxed uppercase tracking-tighter">Control de producción y Kanban.</p>
                <div class="mt-6 flex items-center gap-2 text-orange-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    Ingresar <ng-icon name="heroArrowRightSolid"></ng-icon>
                </div>
            </div>

            <!-- Recipes Card (BOM) -->
            <div [routerLink]="['./bom']" 
                 class="group relative bg-slate-900 p-6 rounded-[2rem] shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden">
                <div class="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white mb-4 group-hover:bg-white group-hover:text-slate-900 transition-all duration-500">
                    <ng-icon name="heroCubeTransparentSolid" class="w-5 h-5"></ng-icon>
                </div>
                <h3 class="text-xl font-black text-white mb-2 uppercase italic">Explosión de Materiales</h3>
                <p class="text-xs text-slate-400 font-medium leading-relaxed uppercase tracking-tighter">Recetas (BOM) y costos.</p>
                <div class="mt-6 flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    Configurar <ng-icon name="heroArrowRightSolid"></ng-icon>
                </div>
            </div>

            <!-- Processes Card -->
            <div [routerLink]="['./processes']" 
                 class="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden">
                <div class="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-purple-100 dark:shadow-none">
                    <ng-icon name="heroCpuChipSolid" class="w-5 h-5"></ng-icon>
                </div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase italic">Ingeniería de Procesos</h3>
                <p class="text-xs text-slate-400 font-medium leading-relaxed uppercase tracking-tighter">Rutas, etapas y tiempos estándar.</p>
                <div class="mt-6 flex items-center gap-2 text-purple-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    Ingresar <ng-icon name="heroArrowRightSolid"></ng-icon>
                </div>
            </div>

            <!-- Catalog Card -->
            <div [routerLink]="['./catalog']" 
                 class="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer overflow-hidden">
                <div class="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-lg shadow-blue-100 dark:shadow-none">
                    <ng-icon name="heroClipboardDocumentListSolid" class="w-5 h-5"></ng-icon>
                </div>
                <h3 class="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase italic">Catálogo Industrial</h3>
                <p class="text-xs text-slate-400 font-medium leading-relaxed uppercase tracking-tighter">Maestro de productos y materias primas.</p>
                <div class="mt-6 flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    Ver Catálogo <ng-icon name="heroArrowRightSolid"></ng-icon>
                </div>
            </div>

            <!-- Back Card -->
            <div [routerLink]="['/launcher']" 
                 class="group relative bg-slate-50 dark:bg-slate-800/20 p-6 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-300 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center text-center">
                <div class="w-8 h-8 rounded-full flex items-center justify-center mb-2 text-slate-300 group-hover:text-indigo-500 transition-all duration-500">
                    <ng-icon name="heroArrowLeftSolid" class="w-4 h-4"></ng-icon>
                </div>
                <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regresar</h3>
            </div>

        </div>

      </div>
    </div>
  `,
    styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ManufacturingLauncherComponent {
    constructor() { }
}
