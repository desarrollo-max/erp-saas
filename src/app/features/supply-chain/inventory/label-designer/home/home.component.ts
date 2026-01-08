import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationError } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { SessionService } from '@core/services/session.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-label-designer-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 bg-[#111418] min-h-full text-white">
      <div class="flex flex-col gap-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-black leading-tight tracking-[-0.033em]">Diseñador de Etiquetas</h1>
            <p class="text-[#9dabb9] text-base font-normal">Crea y gestiona plantillas de etiquetas personalizadas.</p>
          </div>
          <div class="flex gap-3">
             <button routerLink="/cadena-suministro/inventario" class="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#3b4754] bg-[#1C242C] px-4 text-sm font-bold text-white transition hover:bg-[#283039]">
                <span class="material-symbols-outlined">arrow_back</span>
                Volver a Inventario
             </button>
          </div>
        </div>

        <!-- Dashboard / Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="p-6 rounded-xl border border-[#3b4754] bg-[#1C242C] hover:border-primary transition-all cursor-pointer group" routerLink="new">
                <div class="h-12 w-12 rounded-lg bg-primary/20 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <span class="material-symbols-outlined text-2xl">add_circle</span>
                </div>
                <h3 class="text-xl font-bold mb-2">Nueva Plantilla</h3>
                <p class="text-[#9dabb9]">Crear un nuevo diseño de etiqueta desde cero.</p>
            </div>

            <div class="p-6 rounded-xl border border-[#3b4754] bg-[#1C242C] hover:border-primary transition-all cursor-pointer group" routerLink="history">
                <div class="h-12 w-12 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <span class="material-symbols-outlined text-2xl">history</span>
                </div>
                <h3 class="text-xl font-bold mb-2">Historial</h3>
                <p class="text-[#9dabb9]">Ver historial de impresiones y movimientos asociados.</p>
            </div>

            <div class="p-6 rounded-xl border border-[#3b4754] bg-[#1C242C] hover:border-primary transition-all cursor-pointer group" routerLink="preview">
                <div class="h-12 w-12 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <span class="material-symbols-outlined text-2xl">preview</span>
                </div>
                <h3 class="text-xl font-bold mb-2">Vista Previa</h3>
                <p class="text-[#9dabb9]">Previsualizar diseños con datos reales de productos.</p>
            </div>
        </div>
      </div>
    </div>
  `
})
export class LabelDesignerHomeComponent {
  private router = inject(Router);
  private notification = inject(NotificationService);
  private session = inject(SessionService);

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationError) {
        this.notification.error('Error al navegar');
      }
    });
  }

  ngOnInit() {
    if (!this.session.isLoggedIn()) {
      this.notification.error('Sesión no válida. Seleccione una empresa.');
      this.router.navigate(['/companies']);
    }
  }
}
