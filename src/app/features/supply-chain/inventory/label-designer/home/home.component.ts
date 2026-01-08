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
  templateUrl: './home.component.html'
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
