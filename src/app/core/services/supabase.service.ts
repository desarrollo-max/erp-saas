import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { LoggerService } from './logger.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public client: SupabaseClient;

  constructor(
    private logger: LoggerService,
    private notification: NotificationService
  ) {
    // CORRECCIÓN CRÍTICA: Configuración de autenticación explícita
    this.client = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: true, // Guarda el token en LocalStorage
        autoRefreshToken: true, // Refresca el token automáticamente
        detectSessionInUrl: true // Detecta si vienes de un link de email mágico
      }
    });
  }

  // Wrapper directo para mayor flexibilidad (usado por repositorios avanzados)
  from(table: string) {
    return this.client.from(table);
  }

  // Acceso directo a auth (usado por el Login)
  get auth() {
    return this.client.auth;
  }

  async getTable<T>(tableName: string, tenantId?: string): Promise<{ data: T[] | null; error: any }> {
    try {
      let query = this.client.from(tableName).select('*');
      
      // Solo aplicamos el filtro si tenantId existe y no es vacío
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return { data: data as T[], error: null };
    } catch (error: any) {
      this.logger.error(`Error al obtener datos de la tabla ${tableName}:`, error);
      // Opcional: No notificar error de lectura si es solo "lista vacía" o permiso
      // this.notification.error(`No se pudieron cargar los datos.`); 
      return { data: null, error };
    }
  }

  async insert<T>(tableName: string, row: any): Promise<{ data: T[] | null; error: any }> {
    try {
      const { data, error } = await this.client.from(tableName).insert(row).select();
      
      if (error) throw error;
      
      // Notificación de éxito (puedes comentarla si prefieres que la UI lo maneje)
      // this.notification.success('Registro creado exitosamente.');
      
      return { data: data as T[], error: null };
    } catch (error: any) {
      this.logger.error(`Error al insertar en la tabla ${tableName}:`, error);
      // Dejamos que el componente decida si muestra el error
      return { data: null, error };
    }
  }

  async update<T>(tableName: string, id: string | number, updates: any): Promise<{ data: T[] | null; error: any }> {
    try {
      const { data, error } = await this.client.from(tableName).update(updates).eq('id', id).select();
      
      if (error) throw error;
      this.notification.success('Registro actualizado exitosamente.');
      return { data: data as T[], error: null };
    } catch (error: any) {
      this.logger.error(`Error al actualizar en la tabla ${tableName} (ID: ${id}):`, error);
      return { data: null, error };
    }
  }

  async delete(tableName: string, id: string | number): Promise<{ data: any; error: any }> {
    try {
      const { data, error } = await this.client.from(tableName).delete().eq('id', id);
      
      if (error) throw error;
      this.notification.success('Registro eliminado exitosamente.');
      return { data, error: null };
    } catch (error: any) {
      this.logger.error(`Error al eliminar en la tabla ${tableName} (ID: ${id}):`, error);
      return { data: null, error };
    }
  }
}