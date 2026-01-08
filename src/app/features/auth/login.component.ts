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
    <div class="relative flex min-h-screen w-full flex-row overflow-hidden bg-[#101922] font-display text-white transition-colors duration-200">
      
      <!-- Left Panel: Visual Impact (Hidden on Mobile) -->
      <div class="hidden lg:flex lg:w-1/2 relative bg-[#1c242d] overflow-hidden">
        <div class="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] hover:scale-110" 
             style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDEN15JQcxKPvsgPpeA7rAN3Lw_RpyAbkwwLnfGbECj_3M-9gCEkr7XSLYhaC6BfAphOD7kmeL9ON7puu3pzedtPRLR0tt3crI25IRnNoeMx71x1zyBTjsfIRkuyQrJF7JWPDdZlsuvxReT66bFmBqMvYhrNp5w-mAJgQ7uhuEM3Jd5T-lu_H72bTn1qGtjqOo6nHg1UivVDrxh-t5K47cUEQOfwkXoFs6kHzR4G4O-objcRT9OkZTO_rTdSEy1PCBXJU2Q4fTWVRA');">
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-[#101922]/95 via-[#101922]/60 to-primary/20 mix-blend-multiply"></div>
        <div class="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent"></div>
        
        <div class="relative z-10 flex flex-col justify-end p-16 w-full animate-siac-in">
          <div class="mb-6 h-14 w-14 rounded-full bg-gradient-to-br from-[#1e3a8a] via-[#0ea5e9] to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/30 border border-white/10">
            <span class="material-symbols-outlined text-white text-3xl font-bold">arrow_upward</span>
          </div>
          <h2 class="text-4xl font-bold text-white mb-4 leading-tight tracking-tight">Gestión empresarial <br/>inteligente y conectada.</h2>
          <p class="text-[#9dabb9] text-lg max-w-md font-medium">Optimice sus recursos y tome decisiones informadas con la potencia de SIAC ERP.</p>
          <div class="mt-12 flex gap-4 w-full max-w-md">
            <div class="h-1 flex-1 rounded-full bg-[#1e293b] overflow-hidden">
              <div class="h-full w-1/3 rounded-full bg-gradient-to-r from-emerald-500 to-primary animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Login Form -->
      <div class="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-12 relative bg-[#101922]">
        <div class="absolute inset-0 lg:hidden z-0 opacity-10 pointer-events-none" 
             style="background-image: radial-gradient(#137fec 1px, transparent 1px); background-size: 24px 24px;">
        </div>
        
        <div class="w-full max-w-[440px] flex flex-col z-10 animate-siac-in">
          
          <!-- Header -->
          <div class="mb-10 text-center sm:text-left">
            <div class="flex items-center justify-center sm:justify-start gap-4 mb-8">
              <div class="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#1e3a8a] to-emerald-500 flex items-center justify-center shadow-lg shadow-primary/20">
                <span class="material-symbols-outlined text-white text-3xl">arrow_upward</span>
              </div>
              <h1 class="text-3xl font-black tracking-tighter text-white flex items-center gap-2">
                SIAC <span class="text-primary">ERP</span>
              </h1>
            </div>
            <h2 class="text-3xl font-bold text-white mb-2 italic">Bienvenido de nuevo</h2>
            <p class="text-[#9dabb9] font-medium">Acceda a su cuenta para continuar al centro de mando.</p>
          </div>

          <!-- Form -->
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
            
            <div class="flex flex-col gap-2.5">
              <label class="text-[11px] font-black uppercase tracking-[0.2em] text-[#9dabb9] ml-1" for="email">
                Correo Electrónico
              </label>
              <div class="relative flex items-center group">
                <input class="w-full rounded-xl border border-[#2d3748] bg-[#1c242d] px-5 py-4 pl-12 text-base text-white placeholder-slate-500 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all group-hover:border-slate-600" 
                       id="email" formControlName="email" placeholder="usuario@empresa.com" type="email"/>
                <div class="absolute left-4.5 text-slate-500 group-focus-within:text-primary transition-colors flex items-center pointer-events-none">
                  <span class="material-symbols-outlined text-[22px]">mail</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-2.5">
              <label class="text-[11px] font-black uppercase tracking-[0.2em] text-[#9dabb9] ml-1" for="password">
                Contraseña
              </label>
              <div class="relative flex items-center group">
                <input class="w-full rounded-xl border border-[#2d3748] bg-[#1c242d] px-5 py-4 pl-12 text-base text-white placeholder-slate-500 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all group-hover:border-slate-600" 
                       id="password" formControlName="password" placeholder="••••••••••••" type="password"/>
                <div class="absolute left-4.5 text-slate-500 group-focus-within:text-primary transition-colors flex items-center pointer-events-none">
                  <span class="material-symbols-outlined text-[22px]">lock</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between mt-1">
              <label class="flex items-center gap-2.5 cursor-pointer group">
                <input class="size-4 rounded border-[#3b4754] bg-[#1c242d] text-primary focus:ring-offset-0 focus:ring-primary/20 transition-all cursor-pointer" type="checkbox"/>
                <span class="text-sm text-[#9dabb9] group-hover:text-white transition-colors">Mantener sesión iniciada</span>
              </label>
              <a class="text-sm font-bold text-primary hover:text-emerald-400 transition-colors" href="#">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" [disabled]="loginForm.invalid || isLoading()"
                    class="mt-4 w-full rounded-xl bg-primary hover:bg-blue-600 text-white font-black text-sm uppercase tracking-widest h-14 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50">
              <span *ngIf="!isLoading()">Iniciar Sesión</span>
              <span *ngIf="isLoading()">Verificando...</span>
              <span *ngIf="!isLoading()" class="material-symbols-outlined text-[20px]">arrow_forward</span>
            </button>
          </form>

          <!-- Footer -->
          <div class="mt-16 pt-8 border-t border-[#2d3748]/50 flex flex-col items-center gap-4">
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-[#637588] text-center">
              © 2026 **DevBajio** &bull; Desarrollado por **Mario Felipe Luevano Villagomez**
            </p>
          </div>

        </div>
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