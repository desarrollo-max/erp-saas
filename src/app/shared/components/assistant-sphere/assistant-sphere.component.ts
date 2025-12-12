import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Router, NavigationEnd } from '@angular/router';
import { filter, startWith, map } from 'rxjs/operators';
import { KnowledgeBaseWidgetComponent } from '../knowledge-base-widget/knowledge-base-widget.component';
import { Observable } from 'rxjs';
import { AiCoreComponent } from '../ai-core/ai-core.component';

export interface ModuleContext {
  title: string;
  description: string;
  tips: string[];
}

@Component({
  selector: 'app-assistant-sphere',
  standalone: true,
  imports: [CommonModule, DragDropModule, KnowledgeBaseWidgetComponent, AiCoreComponent],
  templateUrl: './assistant-sphere.component.html',
  styleUrls: ['./assistant-sphere.component.scss']
})
export class AssistantSphereComponent {
  private router = inject(Router);
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
}
