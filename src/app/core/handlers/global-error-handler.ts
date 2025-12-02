import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LoggerService } from '../services/logger.service';
import { NotificationService } from '../services/notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  constructor(private injector: Injector, private ngZone: NgZone) { }

  handleError(error: Error | HttpErrorResponse): void {
    const logger = this.injector.get(LoggerService);
    const notifier = this.injector.get(NotificationService);

    const message = error.message ? error.message : error.toString();
    
    logger.error('Error global capturado:', error);

    // Usar NgZone para asegurar que la notificación se muestre correctamente en el ciclo de Angular
    this.ngZone.run(() => {
      notifier.error('Ocurrió un error inesperado. Por favor, intente de nuevo.');
    });
  }
}
