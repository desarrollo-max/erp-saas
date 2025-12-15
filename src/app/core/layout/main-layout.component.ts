import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { AssistantSphereComponent } from '../../shared/components/assistant-sphere/assistant-sphere.component';
import { OnboardingTourComponent } from '../../shared/components/onboarding-tour/onboarding-tour.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    HeaderComponent,
    AssistantSphereComponent,
    OnboardingTourComponent
  ],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
      
      <!-- Top Navigation Header -->
      <app-header></app-header>
      
      <!-- Main Content Area -->
      <!-- Added pt-4 to ensure content doesn't butt up strictly against the header if it has no internal padding -->
      <main class="flex-1 w-full relative">
        <router-outlet></router-outlet>
      </main>

      <!-- Floating Assistant -->
      <app-assistant-sphere></app-assistant-sphere>

      <!-- Global Onboarding Tour Overlay -->
      <app-onboarding-tour></app-onboarding-tour>
      
    </div>
  `
})
export class MainLayoutComponent { }