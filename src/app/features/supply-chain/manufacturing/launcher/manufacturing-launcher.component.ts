
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
  selector: 'app-manufacturing-launcher',
  standalone: true,
  imports: [CommonModule, NgIconsModule, RouterModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
       <div class="bg-white shadow-sm mb-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
           <h1 class="text-2xl font-bold text-gray-800">Manufactura</h1>
           <p class="text-gray-500 text-sm">Centro de Control de Producción</p>
        </div>
      </div>

      <div class="flex-grow p-6">
        <div class="max-w-6xl mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            
            <!-- Dashboard -->
            <div [routerLink]="['./dashboard']" 
                 class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer p-6 flex flex-col items-center justify-center group border border-transparent hover:border-blue-200">
              <div class="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ng-icon name="heroChartPieSolid" class="w-8 h-8 text-blue-600"></ng-icon>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Dashboard</h3>
              <p class="text-xs text-center text-gray-500 mt-1">Métricas y KPIs</p>
            </div>

            <!-- Catálogo -->
            <div [routerLink]="['./catalog']" 
                 class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer p-6 flex flex-col items-center justify-center group border border-transparent hover:border-indigo-200">
              <div class="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ng-icon name="heroClipboardDocumentListSolid" class="w-8 h-8 text-indigo-600"></ng-icon>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Catálogo</h3>
              <p class="text-xs text-center text-gray-500 mt-1">Productos y Materiales</p>
            </div>

            <!-- Órdenes de Producción -->
            <div [routerLink]="['./work-orders']" 
                 class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer p-6 flex flex-col items-center justify-center group border border-transparent hover:border-orange-200">
              <div class="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ng-icon name="heroClipboardDocumentCheckSolid" class="w-8 h-8 text-orange-600"></ng-icon>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Órdenes</h3>
              <p class="text-xs text-center text-gray-500 mt-1">Gestión de Trabajo</p>
            </div>

            <!-- Explosión de Materiales -->
            <div [routerLink]="['./bom']" 
                 class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer p-6 flex flex-col items-center justify-center group border border-transparent hover:border-pink-200">
              <div class="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ng-icon name="heroCubeTransparentSolid" class="w-8 h-8 text-pink-600"></ng-icon>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Recetas (BOM)</h3>
              <p class="text-xs text-center text-gray-500 mt-1">Fórmulas de Producción</p>
            </div>

            <!-- Procesos -->
            <div [routerLink]="['./processes']" 
                 class="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer p-6 flex flex-col items-center justify-center group border border-transparent hover:border-purple-200">
              <div class="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ng-icon name="heroCpuChipSolid" class="w-8 h-8 text-purple-600"></ng-icon>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Procesos</h3>
              <p class="text-xs text-center text-gray-500 mt-1">Rutas y Definiciones</p>
            </div>

             <!-- Back to Launcher -->
             <div [routerLink]="['/launcher']" 
                 class="bg-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer p-6 flex flex-col items-center justify-center group border border-transparent hover:border-gray-300">
              <div class="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ng-icon name="heroArrowLeftSolid" class="w-8 h-8 text-gray-600"></ng-icon>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">Volver</h3>
              <p class="text-xs text-center text-gray-500 mt-1">Al Inicio</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  `
})
export class ManufacturingLauncherComponent {
  constructor() { }
}
