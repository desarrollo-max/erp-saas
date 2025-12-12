
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bom-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h2 class="text-2xl font-bold mb-4">Lista de Materiales (BOM)</h2>
      <p>Lista de recetas de producción.</p>
    </div>
  `
})
export class BomListComponent { }
