
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-work-order-form',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">Work Order Form</h2>
      <p>Form to create or edit work orders.</p>
    </div>
  `
})
export class WorkOrderFormComponent { }
