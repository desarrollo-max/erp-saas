import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '@core/services/supabase.service';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { LucideAngularModule } from 'lucide-angular';
import { ThemeService } from '@core/services/theme.service';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 transition-colors duration-300" style="background-color: var(--app-bg); color: var(--app-text);">
      
      <!-- Toggle Button Top Right -->
      <div class="absolute top-4 right-4">
         <button (click)="themeService.toggleTheme()" class="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition focus:outline-none bg-white dark:bg-slate-800 shadow-sm">
            <ng-icon [name]="themeService.isDark() ? 'heroSunSolid' : 'heroMoonSolid'" class="w-6 h-6"></ng-icon>
         </button>
      </div>

      <div class="w-full max-w-md shadow-xl rounded-xl p-8 border-t-4 border-indigo-600 transition-colors duration-300" style="background-color: var(--card-bg);">
        
        <div class="text-center mb-8">
          <h1 class="text-3xl font-extrabold" style="color: var(--app-text);">ERP SaaS Acceso</h1>
          <p class="mt-1" style="color: var(--app-text-muted);">Inicia sesión para continuar</p>
        </div>

        <!-- Alerta de Error -->
        <div *ngIf="errorMessage()" class="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 mb-4 rounded-md">
          <p class="font-bold">Error de Autenticación</p>
          <p class="text-sm">{{ errorMessage() }}</p>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          
          <!-- Correo Electrónico -->
          <div class="mb-4">
            <label for="email" class="block text-sm font-medium" style="color: var(--app-text);">Correo Electrónico</label>
            <input type="email" id="email" formControlName="email" 
                   class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 focus:border-indigo-500 focus:ring-indigo-500 font-medium"
                   style="background-color: var(--subtle-bg); color: var(--app-text);"
                   placeholder="admin@mi-erp.com">
          </div>

          <!-- Contraseña -->
          <div class="mb-6">
            <label for="password" class="block text-sm font-medium" style="color: var(--app-text);">Contraseña</label>
            <input type="password" id="password" formControlName="password"
                   class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 focus:border-indigo-500 focus:ring-indigo-500 font-medium"
                   style="background-color: var(--subtle-bg); color: var(--app-text);"
                   placeholder="******">
          </div>

          <!-- Botón de Envío -->
          <button type="submit" [disabled]="loginForm.invalid || isLoading()"
                  class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition duration-150">
            
            <span *ngIf="!isLoading()">Iniciar Sesión</span>
            <div *ngIf="isLoading()" class="flex items-center">
              <lucide-icon name="loader-2" class="w-5 h-5 mr-2 animate-spin"></lucide-icon>
              Cargando...
            </div>
          </button>
        </form>
        
        <p class="mt-6 text-center text-sm" style="color: var(--app-text-muted);">
          ¿No tienes cuenta? <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">Regístrate</a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private supabase = inject(SupabaseService);
  private session = inject(SessionService);
  private notification = inject(NotificationService);
  public themeService = inject(ThemeService);

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['admin@mi-erp.com', [Validators.required, Validators.email]],
    password: ['123456', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    console.log('LoginComponent initialized');
  }

  async onSubmit(): Promise<void> {
    console.log('Login onSubmit triggered');
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage.set('Por favor, ingresa credenciales válidas.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;
    console.log('Attempting login with:', email);

    try {
      const { error } = await this.supabase.client.auth.signInWithPassword({
        email: email as string,
        password: password as string,
      });

      if (error) throw error;

      console.log('Login successful');
      this.notification.success('¡Bienvenido!');

      // Cargar sesión y navegar explícitamente al selector
      await this.session.loadSession(true);
      // Forzar redirección al selector de compañías
      this.router.navigateByUrl('/companies').catch(err => console.error(err));

    } catch (error: any) {
      console.error('Login error:', error);
      this.errorMessage.set(error.message || 'Credenciales inválidas. Intente de nuevo.');
      this.notification.error('Fallo de inicio de sesión');
    } finally {
      this.isLoading.set(false);
    }
  }
}