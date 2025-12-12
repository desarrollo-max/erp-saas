import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">Orders</h2>
      <p class="text-gray-600">Module under construction.</p>
    </div>
  `
})
export class OrdersComponent {}
