
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-process-detail',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">Process Detail</h2>
      <p>Details of a specific process.</p>
    </div>
  `
})
export class ProcessDetailComponent { }
