
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';

/**
 * @component HrComponent
 * @description Componente raíz del módulo de Recursos Humanos (RRHH).
 * Actúa como contenedor principal y proporciona la navegación secundaria para
 * empleados, vacaciones y reclutamiento.
 */
@Component({
  selector: 'app-hr',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
  template: `
    <div class="h-full flex flex-col bg-gray-50">
      <!-- Encabezado del Módulo -->
      <header class="bg-white border-b border-gray-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex">
              <div class="flex-shrink-0 flex items-center">
                <h1 class="text-xl font-bold text-gray-900 tracking-tight">Recursos Humanos</h1>
              </div>
              <!-- Navegación Secundaria (Tabs) -->
              <nav class="ml-8 -my-px flex space-x-8">
                <a routerLink="employees" 
                   routerLinkActive="border-indigo-500 text-gray-900" 
                   class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                   Empleados
                </a>
                <a routerLink="time-off" 
                   routerLinkActive="border-indigo-500 text-gray-900" 
                   class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                   Vacaciones
                </a>
                <a routerLink="recruitment" 
                   routerLinkActive="border-indigo-500 text-gray-900" 
                   class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors">
                   Reclutamiento
                </a>
              </nav>
            </div>
          </div>
        </div>
      </header>
      
      <!-- Contenedor de Vistas Hijas -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class HrComponent {
  /**
   * El componente HrComponent sirve como punto de entrada para todas las funcionalidades de RRHH.
   * La lógica específica se maneja en los componentes hijos cargados vía router-outlet.
   */
}
