import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceRepository } from '@core/repositories/finance.repository';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Facturación</h1>
      <div class="bg-white shadow rounded-lg p-6 text-center py-12">
        <p class="text-gray-500">Gestión de facturas y cobros.</p>
      </div>
    </div>
  `
})
export class BillingComponent {
  private financeRepo = inject(FinanceRepository);
}
