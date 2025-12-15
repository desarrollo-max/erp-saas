import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Router, NavigationEnd } from '@angular/router';
import { filter, startWith, map } from 'rxjs/operators';
import { KnowledgeBaseWidgetComponent } from '../knowledge-base-widget/knowledge-base-widget.component';
import { Observable } from 'rxjs';
import { AiCoreComponent } from '../ai-core/ai-core.component';
import { OnboardingService } from '@core/services/onboarding.service'; // Added
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import { heroAcademicCap } from '@ng-icons/heroicons/outline';

export interface ModuleContext {
  title: string;
  description: string;
  tips: string[];
}

@Component({
  selector: 'app-assistant-sphere',
  standalone: true,
  imports: [CommonModule, DragDropModule, KnowledgeBaseWidgetComponent, AiCoreComponent, NgIconsModule],
  viewProviders: [provideIcons({ heroAcademicCap })],
  template: `
    <div class="sphere-wrapper fixed bottom-10 right-10 z-[1000] pointer-events-none" id="sphere-assistant">

        <!-- Draggable Sphere Container -->
        <!-- pointer-events-auto inside creates the interactive area -->
        <div class="sphere-container pointer-events-auto cursor-move relative flex flex-col items-end"
            [class.active]="isOpen" cdkDrag>

            <!-- Popover Content (Knowledge Base) - Moves with Sphere -->
            <div *ngIf="isOpen"
                class="widget-popover absolute bottom-full right-0 mb-4 w-80 sm:w-96 transition-all duration-300 origin-bottom-right z-50 pointer-events-auto"
                (click)="$event.stopPropagation()" [class.animate-pop-in]="isOpen">
                
                <!-- Onboarding Trigger (Custom Addition) -->
                <div class="bg-white dark:bg-slate-800 rounded-t-xl border-t border-x border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between shadow-sm relative z-10 -mb-2 pb-4">
                    <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-2">Asistencia</span>
                    <button (click)="startOnboarding()" 
                            class="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                        <ng-icon name="heroAcademicCap" class="w-4 h-4"></ng-icon>
                        Tour Guiado
                    </button>
                </div>

                <!-- stopPropagation prevents closing when clicking inside the widget -->
                <app-knowledge-base-widget [context]="currentContext$ | async"></app-knowledge-base-widget>
            </div>

            <!-- Orb Visual -->
            <div (click)="toggleOpen()" class="relative flex items-center justify-center shrink-0 p-2 cursor-pointer transition-transform hover:scale-105">
               <app-ai-core [isProcessing]="false"></app-ai-core>
            </div>
        </div>

    </div>
  `,
  styles: [`
    /* Inline styles that were essentially in the SCSS, ensuring self-contained component for this refactor */
    .animate-pop-in {
        animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes popIn {
        from { opacity: 0; transform: scale(0.9) translateY(10px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }
  `]
})
export class AssistantSphereComponent {
  private router = inject(Router);
  private onboardingService = inject(OnboardingService); // Inject Service
  isOpen = false;

  currentContext$: Observable<ModuleContext>;

  private contextMap: Record<string, ModuleContext> = {
    '/launcher': {
      title: 'Launcher',
      description: 'Tu punto de partida. Accede a todos los módulos disponibles.',
      tips: ['Usa "Cambiar" para alternar entre empresas.', 'Aquí verás notificaciones importantes.']
    },
    '/produccion/dashboard': {
      title: 'Tablero de Producción',
      description: 'Gestión visual de tus órdenes de trabajo.',
      tips: ['Arrastra las tarjetas para cambiar el estado.', 'Usa los filtros superiores para ver procesos específicos.']
    },
    '/produccion/work-orders': {
      title: 'Órdenes de Producción',
      description: 'Lista detallada de todas las órdenes.',
      tips: ['Crea nuevas órdenes con el botón "Nueva Orden".', 'Verifica el stock antes de iniciar.']
    },
    '/produccion/bom': {
      title: 'Explosión de Materiales',
      description: 'Define las recetas (BOM) para tus productos.',
      tips: ['Asigna insumos y cantidades exactas.', 'El % de desperdicio ayuda a calcular costos reales.']
    },
    '/cadena-suministro/inventario': {
      title: 'Inventario Global',
      description: 'Control de existencias de todos los almacenes.',
      tips: ['Usa "Importar" para cargas masivas.', 'Las alertas naranjas indican stock bajo.']
    },
    '/cadena-suministro/almacenes/stock': {
      title: 'Existencias por Almacén',
      description: 'Visualiza qué productos hay exactamente en esta ubicación.',
      tips: ['Compara "Físico" vs "Disponible" (reservado en órdenes).']
    },
    '/cadena-suministro/almacenes': {
      title: 'Gestión de Almacenes',
      description: 'Administra tus ubicaciones físicas de inventario.',
      tips: ['Crea múltiples almacenes para segregar stock.', 'Marca un almacén como "Predeterminado" para agilizar operaciones.']
    },
    '/pos': {
      title: 'Punto de Venta',
      description: 'Realiza ventas rápidas y directas al cliente.',
      tips: ['Selecciona un "Almacén de Salida" para descontar stock.', 'Usa el buscador para añadir productos rápidamente.']
    },
    '/cadena-suministro/compras': {
      title: 'Compras y Abastecimiento',
      description: 'Registra la entrada de productos a tus almacenes.',
      tips: ['Realiza compras internas o a proveedores.', 'Esto generará entradas de stock automáticamente.']
    },
    '/cadena-suministro/movimientos': {
      title: 'Transferencias de Stock',
      description: 'Mueve inventario entre almacenes.',
      tips: ['Requiere seleccionar Origen y Destino distintos.', 'Se generan movimientos de Salida y Entrada simultáneos.']
    }
  };

  constructor() {
    this.currentContext$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
      map(url => {
        // Simple matching logic - can be improved with regex
        // We sort keys by length descending to match most specific first
        const sortedKeys = Object.keys(this.contextMap).sort((a, b) => b.length - a.length);
        const key = sortedKeys.find(k => url.includes(k));

        return key ? this.contextMap[key] : {
          title: 'Asistente ERP',
          description: 'Estoy aquí para ayudarte en cualquier pantalla.',
          tips: ['Navega a un módulo para ver ayuda específica.']
        };
      })
    );
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
  }

  startOnboarding() {
    this.onboardingService.startTour();
    // Optional: close the sphere popover when starting tour
    this.isOpen = false;
  }
}
