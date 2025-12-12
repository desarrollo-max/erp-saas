import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SessionService } from '../services/session.service';
import { SupabaseService } from '../services/supabase.service';

/**
 * AuthGuard: Asegura que el usuario esté logueado y que el contexto del Tenant esté cargado.
 * La Promesa de loadSession() garantiza la espera del contexto.
 */
export const AuthGuard: CanActivateFn = async (route, state) => {
  const sessionService = inject(SessionService);
  const router = inject(Router);
  const supabaseService = inject(SupabaseService);

  // 1. FORZAR LA CARGA DEL CONTEXTO: 
  // loadSession() gestionará la autenticación, la consulta a la BD y el seteo de Signals.
  await sessionService.loadSession();

  // 2. Verificar el estado final de la Signal SÍNCRONAMENTE.
  if (sessionService.isLoggedIn()) {
    return true; // Acceso concedido (Tiene tenant seleccionado)
  }

  // 3. Excepción para la ruta /companies:
  // Si intenta acceder a /companies (o /launcher si se decide usar ese nombre) y tiene usuario (auth de Supabase), permitir.
  // Esto rompe el bucle de redirección.
  const targetUrl = state.url;
  if (targetUrl.includes('/companies') && sessionService.currentUserId()) {
    return true;
  }

  // 4. Si está autenticado (Supabase) pero no tiene contexto (Tenant) y quiere ir a otra ruta protegida,
  // redirigir a selección de empresa.
  if (sessionService.currentUserId()) {
    return router.createUrlTree(['/companies']);
  }

  // 5. Si no hay sesión válida, redirigir al login
  return router.createUrlTree(['/login']);
};