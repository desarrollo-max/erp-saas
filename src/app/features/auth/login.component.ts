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
    <div class="min-h-screen flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
      
      <!-- Background Decorative Elements -->
      <div class="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 -z-10"></div>
      <div class="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl dark:bg-indigo-500/5"></div>
      <div class="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl dark:bg-purple-500/5"></div>

      <!-- Toggle Button Top Right -->
      <div class="absolute top-4 right-4 z-20">
         <button (click)="themeService.toggleTheme()" class="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition focus:outline-none bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm shadow-sm">
            <ng-icon [name]="themeService.isDark() ? 'heroSunSolid' : 'heroMoonSolid'" class="w-6 h-6"></ng-icon>
         </button>
      </div>

      <div class="w-full max-w-md p-8 glass-panel shadow-2xl rounded-2xl animate-fade-in relative z-10">
        
        <div class="text-center mb-8">
          <h1 class="text-3xl font-extrabold flex flex-col items-center gap-3" style="color: var(--app-text);">
            <div class="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg mb-2 flex items-center justify-center">
                <span class="text-4xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400">SIAC</span>
                <span class="text-xl font-bold text-slate-500 dark:text-slate-400 ml-2 tracking-widest">ERP</span>
            </div>
            <span class="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Acceso
            </span>
          </h1>
          <p class="mt-2 text-sm font-medium" style="color: var(--app-text-muted);">Bienvenido de nuevo</p>
        </div>

        <!-- Alerta de Error -->
        <div *ngIf="errorMessage()" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-4 mb-6 rounded-lg text-sm flex items-start gap-2">
          <lucide-icon name="alert-circle" class="w-5 h-5 flex-shrink-0 mt-0.5"></lucide-icon>
          <div>
              <p class="font-bold">Error</p>
              <p>{{ errorMessage() }}</p>
          </div>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
          
          <!-- Correo Electrónico -->
          <div>
            <label for="email" class="block text-sm font-semibold mb-1.5 ml-1" style="color: var(--app-text);">Correo Electrónico</label>
            <input type="email" id="email" formControlName="email" 
                   class="app-input"
                   placeholder="nombre@empresa.com">
          </div>

          <!-- Contraseña -->
          <div>
            <label for="password" class="block text-sm font-semibold mb-1.5 ml-1" style="color: var(--app-text);">Contraseña</label>
            <input type="password" id="password" formControlName="password"
                   class="app-input"
                   placeholder="••••••••">
          </div>

          <!-- Botón de Envío -->
          <button type="submit" [disabled]="loginForm.invalid || isLoading()"
                  class="app-button-primary w-full mt-4">
            
            <span *ngIf="!isLoading()">Iniciar Sesión</span>
            <div *ngIf="isLoading()" class="flex items-center">
              <lucide-icon name="loader-2" class="w-5 h-5 mr-2 animate-spin"></lucide-icon>
              Verificando...
            </div>
          </button>
        </form>
        
        <p class="mt-8 text-center text-sm" style="color: var(--app-text-muted);">
          &copy; {{ 2026 }} SIAC ERP. Todos los derechos reservados.
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

      console.log('Supabase Auth successful');
      this.notification.success('¡Bienvenido!');

      // Cargar sesión
      console.log('Loading session context...');
      await this.session.loadSession(true);

      const userId = this.session.currentUserId();
      console.log('Session loaded. User ID:', userId);

      if (userId) {
        // Forzar navegación fuera del ciclo de eventos actual para evitar bloqueos
        setTimeout(() => {
          this.router.navigate(['/companies']).then(success => {
            console.log('Navigation to /companies result:', success);
            if (!success) {
              console.error('Navigation failed via Router');
              this.isLoading.set(false);
            }
          }).catch(err => {
            console.error('Navigation error:', err);
            this.isLoading.set(false);
          });
        }, 100);
      } else {
        throw new Error('No se pudo establecer la sesión de usuario final.');
      }

    } catch (error: any) {
      console.error('Login error:', error);
      this.errorMessage.set(error.message || 'Credenciales inválidas. Intente de nuevo.');
      this.notification.error('Fallo de inicio de sesión');
      this.isLoading.set(false);
    }
  }
}