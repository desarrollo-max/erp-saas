import { Injectable, signal } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AssistantService {
    public stockAlert = signal<{ item: string } | null>(null);

    triggerStockAlert(item: string) {
        this.stockAlert.set({ item });
    }

    clearAlert() {
        this.stockAlert.set(null);
    }
}
