import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';
import { APP_ICONS } from '@core/constants/app-icons';

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
  public readonly ICONS = APP_ICONS;

  kpis: KpiData[] = [];

  ngOnInit() {
    // Mock Data - In real app, fetch from DashboardRepository
    this.kpis = [
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
        value: '24',
        trend: -5.2,
        trendLabel: 'vs semana anterior',
        icon: this.ICONS.purchases,
        colorClass: 'accent-orange'
      },
      {
        title: 'Nuevos Clientes',
        value: '18',
        trend: 8.1,
        trendLabel: 'este mes',
        icon: this.ICONS.users,
        colorClass: 'accent-blue'
      },
      {
        title: 'Tickets Soporte',
        value: '5',
        trend: -2.0,
        trendLabel: 'respuesta rápida',
        icon: 'heroChatBubbleLeftRight', // Assuming generic icon usage or defined in APP_ICONS
        colorClass: 'accent-purple'
      }
    ];
  }
}