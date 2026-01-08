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
  templateUrl: './main-layout.component.html'
})
export class MainLayoutComponent { }
