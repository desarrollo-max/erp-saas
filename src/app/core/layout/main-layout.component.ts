import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { AssistantSphereComponent } from '../../shared/components/assistant-sphere/assistant-sphere.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    AssistantSphereComponent
  ],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- HEADER FIXO -->
      <app-header></app-header>

      <!-- CONTENIDO PRINCIPAL (Una sola columna) -->
      <main class="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <!-- El Router Outlet renderiza el módulo actual aquí -->
        <router-outlet></router-outlet>
        
        <!-- Esfera flotante siempre disponible -->
        <app-assistant-sphere></app-assistant-sphere>
      </main>

      <!-- OPTIONAL FOOTER can go here -->
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MainLayoutComponent { }