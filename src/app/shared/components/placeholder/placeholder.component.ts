import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 text-center">
      <h2 class="text-2xl font-bold text-gray-900">Módulo: {{ category() | titlecase }} / {{ feature() | titlecase }}</h2>
      <p class="mt-4 text-gray-600">Este módulo está en construcción o se carga dinámicamente.</p>
      <div class="mt-6">
        <span class="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
          En Desarrollo
        </span>
      </div>
    </div>
  `
})
export class PlaceholderComponent {
  private route = inject(ActivatedRoute);

  category = signal<string>('Desconocido');
  feature = signal<string>('Desconocido');

  constructor() {
    this.route.paramMap.subscribe(params => {
      this.category.set(params.get('category') || 'Desconocido');
      this.feature.set(params.get('feature') || 'Desconocido');
    });
  }
}
