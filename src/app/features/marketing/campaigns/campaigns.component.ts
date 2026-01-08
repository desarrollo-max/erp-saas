import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SessionService } from '@core/services/session.service';
import { NotificationService } from '@core/services/notification.service';
import { NgIconsModule, provideIcons } from '@ng-icons/core';
import * as heroIcons from '@ng-icons/heroicons/solid';

@Component({
    selector: 'app-campaigns',
    standalone: true,
    imports: [CommonModule, NgIconsModule],
  viewProviders: [provideIcons(heroIcons)],
    templateUrl: './campaigns.component.html',
    styles: [`
    :host { display: block; height: 100%; width: 100%; }
    .pulse { animation: pulseAnim 2s infinite; }
    @keyframes pulseAnim {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.5; }
    }
  `]
})
export class CampaignsComponent implements OnInit {
    campaigns = signal<any[]>([]);

    ngOnInit() {
        this.campaigns.set([
            { id: 1, name: 'Lanzamiento Invierno 2026', description: 'Campaña multicanal para la nueva colección de calzado térmico y botas de montaña.', status: 'ACTIVA', clicks: 8420, impressions: 120500, budget: 125000 },
            { id: 2, name: 'Retargeting Carritos Abandonados', description: 'Estrategia de email automatizado para recuperación de ventas en eCommerce.', status: 'ACTIVA', clicks: 1240, impressions: 5400, budget: 12000 },
            { id: 3, name: 'Hot Sale Prime - Anticipo', description: 'Generación de leads para el evento más grande del año en ventas retail.', status: 'PAUSADA', clicks: 450, impressions: 12000, budget: 5000 }
        ]);
    }
}
