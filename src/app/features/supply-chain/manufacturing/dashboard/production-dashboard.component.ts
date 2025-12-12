
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-production-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">Tablero de Producción</h2>
      <p>Vista general de métricas de producción y KPIs.</p>
    </div>
  `
})
export class ProductionDashboardComponent { }
