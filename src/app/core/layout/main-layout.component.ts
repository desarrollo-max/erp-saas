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
    <div class="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <!-- HEADER (SINGLE COLUMN TOP) -->
      <app-header></app-header>

      <!-- MAIN CONTENT (SINGLE COLUMN BODY, 100% WIDTH) -->
      <main class="flex-grow w-full px-4 sm:px-6 lg:px-8 py-6 relative">
        <!-- Route content renders here -->
        <router-outlet></router-outlet>
        
        <!-- Floating Assistant -->
        <app-assistant-sphere></app-assistant-sphere>
      </main>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MainLayoutComponent { }