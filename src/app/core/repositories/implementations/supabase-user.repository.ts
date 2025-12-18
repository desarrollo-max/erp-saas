import { Injectable } from '@angular/core';
import { UserRepository } from '../user.repository';

@Injectable({
    providedIn: 'root'
})
export class SupabaseUserRepository extends UserRepository {
    async getUserDisplayName(userId: string): Promise<string> {
        // SIMULATION: In a real scenario we would query auth.users or a profiles table.
        // Since we cannot easily query auth.users from client due to security,
        // we return a placeholder or mock based on ID.

        // Attempt to be deterministic
        if (!userId) return 'Sistema';
        const lastChar = userId.slice(-4);
        return `Usuario (${lastChar})`;
    }
}
