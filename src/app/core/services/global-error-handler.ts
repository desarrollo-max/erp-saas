import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {

  // Usamos Injector para obtener los servicios y evitar dependencias circulares
  constructor(private injector: Injector, private ngZone: NgZone) { }

  handleError(error: Error | HttpErrorResponse) {
    const logger = this.injector.get(LoggerService);
    const notifier = this.injector.get(NotificationService);

    let message: string;
    if (error instanceof HttpErrorResponse) {
      // Error del servidor
      message = `Error del servidor: ${error.status} - ${error.message}`;
    } else {
      // Error del cliente
      message = error.message ? error.message : error.toString();
    }
    
    logger.error('Error no controlado:', error);

    // NgZone asegura que la notificación se ejecute dentro del ciclo de detección de cambios de Angular
    this.ngZone.run(() => {
      notifier.error('Ocurrió un error inesperado. Por favor, intente de nuevo más tarde.');
    });
  }
}
