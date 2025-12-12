
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-bom-form',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">BOM Form</h2>
      <p>Form to define a Bill of Materials.</p>
    </div>
  `
})
export class BomFormComponent { }
