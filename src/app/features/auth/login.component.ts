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

/**
 * @component LoginComponent
 * @description Componente de autenticación para el acceso seguro al sistema.
 * Gestiona el inicio de sesión mediante Supabase Auth y la inicialización del contexto de la sesión.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 transition-all duration-500 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      
      <!-- Premium Background Elements -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_30%,rgba(79,70,229,0.1)_0%,transparent_50%)]"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.05)_0%,transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_70%,rgba(139,92,246,0.1)_0%,transparent_50%)]"></div>
      <div class="absolute -top-48 -left-48 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
      <div class="absolute -bottom-48 -right-48 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-pulse" style="animation-delay: 2s;"></div>

      <!-- Theme Switcher -->
      <div class="absolute top-6 right-6 z-20">
         <button (click)="cycleThemeColor()" class="p-3 rounded-2xl text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-900 transition-all focus:outline-none bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-sm border border-slate-200/50 dark:border-slate-800/50">
            <div class="w-6 h-6 rounded-full border-2 border-current flex items-center justify-center">
              <div class="w-4 h-4 rounded-full" [style.background-color]="themeService.getCurrentPrimaryColor()"></div>
            </div>
         </button>
      </div>

      <div class="w-full max-w-md p-10 glass-panel shadow-2xl rounded-[2.5rem] animate-fade-in relative z-10 border border-white/50 dark:border-slate-800/50">
        
        <div class="text-center mb-10">
          <div class="flex flex-col items-center gap-4">
            <div class="p-6 bg-white dark:bg-slate-900 rounded-3xl shadow-xl mb-2 flex items-center justify-center border border-slate-100 dark:border-slate-800">
                <span class="text-5xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 drop-shadow-sm">SIAC</span>
                <span class="text-xl font-black text-slate-400 dark:text-slate-500 ml-3 tracking-[0.3em] uppercase opacity-70">ERP</span>
            </div>
            <div class="space-y-2">
                <h1 class="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">Acceso al Sistema</h1>
                <p class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Premium Management Solution</p>
            </div>
          </div>
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">
          
          <!-- Correo Electrónico -->
          <div>
            <label for="email" class="block text-[10px] font-black uppercase tracking-widest mb-2 ml-4 text-slate-500 dark:text-slate-400">Correo Electrónico</label>
            <input type="email" id="email" formControlName="email" 
                   class="app-input !rounded-2xl !bg-slate-50/50 dark:!bg-slate-900/50 !border-slate-200 dark:!border-slate-800 focus:!border-indigo-500"
                   placeholder="admin@siac-erp.com">
          </div>

          <!-- Contraseña -->
          <div>
            <label for="password" class="block text-[10px] font-black uppercase tracking-widest mb-2 ml-4 text-slate-500 dark:text-slate-400">Contraseña</label>
            <input type="password" id="password" formControlName="password"
                   class="app-input !rounded-2xl !bg-slate-50/50 dark:!bg-slate-900/50 !border-slate-200 dark:!border-slate-800 focus:!border-indigo-500"
                   placeholder="••••••••">
          </div>

          <!-- Botón de Envío -->
          <button type="submit" [disabled]="loginForm.invalid || isLoading()"
                  class="app-button-primary w-full !rounded-2xl !py-4 glow-effect shadow-indigo-500/25">
            
            <span *ngIf="!isLoading()" class="text-sm font-black uppercase tracking-widest">Entrar al Sistema</span>
            <div *ngIf="isLoading()" class="flex items-center justify-center">
              <lucide-icon name="loader-2" class="w-5 h-5 mr-3 animate-spin"></lucide-icon>
              <span class="text-sm font-black uppercase tracking-widest">Verificando...</span>
            </div>
          </button>
        </form>
        
        <p class="mt-10 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">
          &copy; 2026 SIAC ERP &bull; Advanced Digital Core
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

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.errorMessage.set('Por favor, ingresa credenciales válidas.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.value;

    try {
      const { error } = await this.supabase.client.auth.signInWithPassword({
        email: email as string,
        password: password as string,
      });

      if (error) throw error;

      this.notification.success('¡Bienvenido!');
      await this.session.loadSession(true);

      const userId = this.session.currentUserId();

      if (userId) {
        setTimeout(() => {
          this.router.navigate(['/companies']).then(success => {
            if (!success) {
              this.isLoading.set(false);
            }
          }).catch(() => {
            this.isLoading.set(false);
          });
        }, 100);
      } else {
        throw new Error('No se pudo establecer el contexto de usuario tras la autenticación.');
      }

    } catch (error: any) {
      this.errorMessage.set(error.message || 'Credenciales inválidas. Intente de nuevo.');
      this.notification.error('Error de acceso');
      this.isLoading.set(false);
    }
  }

  cycleThemeColor(): void {
    this.themeService.cycleColorTheme();
  }
}