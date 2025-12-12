import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@env/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseAdminService {
    private adminClient: SupabaseClient | null = null;

    constructor() {
        this.initClient();
    }

    private initClient() {
        // Solo inicializar si existe la key, para evitar errores en runtime si no se ha configurado
        if (environment.supabaseServiceRoleKey) {
            this.adminClient = createClient(environment.supabaseUrl, environment.supabaseServiceRoleKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            });
        }
    }

    async inviteUserByEmail(email: string, tenantId: string, role: string) {
        if (!this.adminClient) {
            this.initClient();
            if (!this.adminClient) {
                throw new Error('Service Role Key no configurada en environment.ts');
            }
        }

        return this.adminClient.auth.admin.inviteUserByEmail(email, {
            data: { tenant_id: tenantId, role: role }
        });
    }

    async createUser(email: string, password: string, tenantId: string, role: string) {
        if (!this.adminClient) {
            this.initClient();
            if (!this.adminClient) {
                throw new Error('Service Role Key no configurada en environment.ts');
            }
        }

        return this.adminClient.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Confirmar automáticamente el email
            user_metadata: { tenant_id: tenantId, role: role }
        });
    }
}
