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
      title: 'Lanzador de Aplicaciones',
      description: 'Panel central para acceder a tus herramientas operativas.',
      tips: [
        'Haga clic en un icono para abrir el módulo.',
        'Los módulos instalados desde el Marketplace aparecerán aquí automáticamente.',
        'Use el selector de organización en el header si gestiona múltiples empresas.'
      ]
    },
    '/ventas/pedidos': {
      title: 'Gestión de Pedidos',
      description: 'Control centralizado de órdenes de venta y cotizaciones.',
      tips: [
        '1. Revise el resumen de KPIs para ver pedidos pendientes de entrega.',
        '2. Use el filtro de búsqueda para localizar clientes o folios específicos.',
        '3. Haga clic en un pedido para ver el desglose de productos y estatus de pago.'
      ]
    },
    '/finanzas/facturacion': {
      title: 'Facturación CFDI (SAT)',
      description: 'Emisión y timbrado de comprobantes fiscales legales.',
      tips: [
        '1. Verifique que la conexión con el SAT esté en verde.',
        '2. Use "Emitir CFDI" para facturar pedidos confirmados o ventas POS.',
        '3. Puede descargar el XML y PDF directamente desde el historial de folios.'
      ]
    },
    '/finanzas/gastos': {
      title: 'Control de Egresos',
      description: 'Registro de gastos directos y facturas de proveedores.',
      tips: [
        '1. Registre cada gasto con su respectivo folio de comprobante.',
        '2. Clasifique por categoría (Operativo, Servicios, etc.) para ver reportes exactos.',
        '3. Monitoree el gráfico de presupuesto para no exceder las metas del mes.'
      ]
    },
    '/finanzas/contabilidad': {
      title: 'Libro Diario y PGC',
      description: 'Corazón contable del sistema: Cuentas y asientos.',
      tips: [
        '1. Configure su Catálogo de Cuentas antes de iniciar operaciones.',
        '2. Los asientos manuales deben estar cuadrados (Debe = Haber).',
        '3. El sistema genera asientos automáticos desde Ventas e Inventario.'
      ]
    },
    '/rrhh/empleados': {
      title: 'Gestión de Talento',
      description: 'Control de personal, expedientes y nóminas.',
      tips: [
        '1. Añada a sus colaboradores con su esquema de pago (Semanal/Quincenal).',
        '2. Use los filtros por departamento para organizar la vista.',
        '3. Gestione contratos y documentos desde el perfil de cada empleado.'
      ]
    },
    '/marketing/campanas': {
      title: 'Estrategia de Crecimiento',
      description: 'Seguimiento de campañas publicitarias y ROI.',
      tips: [
        '1. Configure el presupuesto total antes de lanzar la campaña.',
        '2. Monitoree el CPC (Costo por Clic) para optimizar su inversión.',
        '3. El ROI se calcula automáticamente según las ventas ligadas a la campaña.'
      ]
    },
    '/web/blog': {
      title: 'Contenido y SEO',
      description: 'Editor de artículos para su sitio web oficial.',
      tips: [
        '1. Suba imágenes de alta resolución para mejorar el impacto visual.',
        '2. Use categorías para organizar su contenido (Novedades, Guías, etc.).',
        '3. Las publicaciones afectan directamente el posicionamiento en Google.'
      ]
    },
    '/produccion/dashboard': {
      title: 'Centro de Producción',
      description: 'Control de piso y órdenes de fabricación.',
      tips: [
        '1. Arrastre órdenes entre columnas para actualizar el avance en piso.',
        '2. Verifique la disponibilidad de materia prima antes de "Iniciar".',
        '3. Use el registro de desperdicio para ajustar el costo real del lote.'
      ]
    },
    '/cadena-suministro/inventario': {
      title: 'Inventario Inteligente',
      description: 'Monitor de existencias y valor de almacén.',
      tips: [
        '1. La columna "Existencias" muestra el stock global entre almacenes.',
        '2. Haga clic en la cantidad para ver en qué almacén físico se encuentra.',
        '3. Use "Bajos de Mínimo" para detectar productos que requieren reorden.'
      ]
    },
    '/pos': {
      title: 'Punto de Venta Retail',
      description: 'Terminal de venta rápida para mostrador.',
      tips: [
        '1. Seleccione el almacén correcto para que el stock se descuente fielmente.',
        '2. Escanee códigos de barras o busque nombre para agilizar.',
        '3. Al cerrar la venta, puede emitir ticket térmico o factura instantánea.'
      ]
    },
    '/cadena-suministro/almacenes': {
      title: 'Logística de Almacenes',
      description: 'Configuración de ubicaciones y transferencias.',
      tips: [
        '1. Cree almacenes separados para Materia Prima y Producto Terminado.',
        '2. Use "Transferencia" para mover stock sin afectar contabilidad externa.',
        '3. El historial muestra quién y cuándo movió cada unidad.'
      ]
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
