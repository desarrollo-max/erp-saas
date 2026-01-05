import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { APP_ICONS } from '@core/constants/app-icons';
import { StockRepository } from '@core/repositories/stock.repository';
import { PurchaseOrderRepository } from '@core/repositories/purchase-order.repository';
import { ThemeService } from '@core/services/theme.service';

interface KpiData {
  title: string;
  value: string;
  trend: number; // percentage
  trendLabel: string;
  icon: string;
  colorClass: string; // 'accent-green', 'accent-blue', etc.
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private stockRepo = inject(StockRepository);
  private poRepo = inject(PurchaseOrderRepository);
  public themeService = inject(ThemeService);

  public readonly ICONS = APP_ICONS;

  // Señales para el estado y los datos
  isLoading = signal(true);
  kpiData = signal<KpiData[]>([]);

  // Mantener 'kpis' para compatibilidad con el template actual
  get kpis() {
    return this.kpiData();
  }

  async ngOnInit() {
    await this.loadDashboardData();
  }

  /**
   * Carga los datos reales de los repositorios para dinamizar los KPIs.
   */
  private async loadDashboardData() {
    try {
      this.isLoading.set(true);

      // Llamadas concurrentes a los nuevos métodos de repositorio
      const [criticalStock, pendingOrders] = await Promise.all([
        this.stockRepo.getCriticalStockCount(4),
        this.poRepo.getPendingOrdersCount()
      ]);

      // Mapeo de datos a la señal kpiData
      this.kpiData.set([
        {
          title: 'Ingresos Totales',
          value: '$128,430',
          trend: 12.5,
          trendLabel: 'vs mes anterior',
          icon: this.ICONS.money,
          colorClass: 'accent-green'
        },
        {
          title: 'Órdenes Pendientes',
          value: pendingOrders.toString(),
          trend: 0,
          trendLabel: 'órdenes por procesar',
          icon: this.ICONS.purchases,
          colorClass: 'accent-orange'
        },
        {
          title: 'Stock Crítico',
          value: criticalStock.toString(),
          trend: 0,
          trendLabel: 'niveles bajos de inventario',
          icon: this.ICONS.warning,
          colorClass: 'accent-red'
        },
        {
          title: 'Nuevos Usuarios',
          value: '18',
          trend: 8.1,
          trendLabel: 'registros del mes',
          icon: this.ICONS.users,
          colorClass: 'accent-blue'
        }
      ]);
    } catch (error) {
      console.error('Error al cargar KPIs del dashboard:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  cycleThemeColor(): void {
    this.themeService.cycleColorTheme();
  }
}