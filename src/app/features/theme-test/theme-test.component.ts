import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-theme-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 space-y-8">
      <h1 class="text-3xl font-bold">Theme Test Component</h1>

      <div class="grid grid-cols-2 gap-4">
        <div class="p-4 bg-primary-50 text-primary-900 rounded-lg">
          <h3 class="font-bold">Primary 50/900</h3>
          <p>Background: primary-50, Text: primary-900</p>
        </div>

        <div class="p-4 bg-primary-100 text-primary-800 rounded-lg">
          <h3 class="font-bold">Primary 100/800</h3>
          <p>Background: primary-100, Text: primary-800</p>
        </div>

        <div class="p-4 bg-primary-200 text-primary-700 rounded-lg">
          <h3 class="font-bold">Primary 200/700</h3>
          <p>Background: primary-200, Text: primary-700</p>
        </div>

        <div class="p-4 bg-primary-500 text-white rounded-lg">
          <h3 class="font-bold">Primary 500</h3>
          <p>Background: primary-500, Text: white</p>
        </div>
      </div>

      <div class="space-y-4">
        <h2 class="text-xl font-bold">Current Theme Info:</h2>
        <div class="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
          <p><strong>Dark Mode:</strong> {{ themeService.isDark() ? 'Yes' : 'No' }}</p>
          <p><strong>Color Theme:</strong> {{ themeService.colorTheme() }}</p>
          <p><strong>Document Classes:</strong> {{ documentClasses }}</p>
          <p><strong>Primary 500 Value:</strong> {{ primary500Value }}</p>
        </div>
      </div>

      <button
        (click)="cycleTheme()"
        class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
        Cycle Theme (Current: {{ themeService.colorTheme() }})
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: var(--app-bg);
      color: var(--app-text);
    }
  `]
})
export class ThemeTestComponent {
  themeService = inject(ThemeService);

  get documentClasses(): string {
    return document.documentElement.className;
  }

  get primary500Value(): string {
    return getComputedStyle(document.documentElement).getPropertyValue('--primary-500');
  }

  cycleTheme() {
    this.themeService.cycleColorTheme();
  }
}