
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
    selector: 'app-hr',
    standalone: true,
    imports: [CommonModule, RouterModule, RouterLink, RouterLinkActive],
    template: `
    <div class="h-full flex flex-col bg-gray-50">
      <header class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex">
              <div class="flex-shrink-0 flex items-center">
                <h1 class="text-xl font-bold text-gray-900">Recursos Humanos</h1>
              </div>
              <nav class="ml-8 -my-px flex space-x-8">
                <a routerLink="employees" routerLinkActive="border-indigo-500 text-gray-900" class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Empleados</a>
                <a routerLink="time-off" routerLinkActive="border-indigo-500 text-gray-900" class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Vacaciones</a>
                <a routerLink="recruitment" routerLinkActive="border-indigo-500 text-gray-900" class="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Reclutamiento</a>
              </nav>
            </div>
          </div>
        </div>
      </header>
      
      <main class="flex-1 overflow-y-auto">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class HrComponent { }
