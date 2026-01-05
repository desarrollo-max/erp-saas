import { Injectable, signal, computed, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';



export type AppTheme = 'theme-blue' | 'theme-emerald' | 'theme-pink' | 'theme-violet' | 'theme-amber' | 'theme-rose' | 'theme-cyan' | 'theme-indigo';


@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private router = inject(Router);

  // Usamos un signal para reactividad moderna en Angular
  activeTheme = signal<AppTheme>('theme-blue');
  isDark = signal<boolean>(false);

  // Alias para compatibilidad con componentes antiguos
  colorTheme = computed(() => this.activeTheme());


  constructor() {
    this.initDarkMode();
    this.setupRouteListener();
  }

  private setupRouteListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Detección automática de tema basada en la ruta (opcional, si el módulo no lo hace)
      // Por ahora dejamos que los componentes de "página" llamen a applyThemeByColor
    });
  }


  // No iniciamos tema desde localStorage para el color, solo para el modo oscuro


  private initDarkMode(): void {
    const isDark = document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark') ||
      localStorage.getItem('theme') === 'dark';
    this.isDark.set(isDark);
    this.applyDarkMode(isDark);
  }

  setTheme(theme: AppTheme): void {
    this.activeTheme.set(theme);
    this.applyTheme(theme);
  }

  /**
   * Aplica un tema basado en un color hexadecimal (viniendo del modelo de Módulo)
   */
  applyThemeByColor(hexColor: string | undefined | null): void {
    if (!hexColor) {
      this.setTheme('theme-blue');
      return;
    }

    const theme = this.getThemeFromHex(hexColor);
    this.setTheme(theme);
  }

  private getThemeFromHex(hex: string): AppTheme {
    hex = hex.toLowerCase();

    // Mapeo directo de colores comunes en stitch_siac_erp
    if (hex.includes('#135bec')) return 'theme-blue';
    if (hex.includes('#10b77f')) return 'theme-emerald';
    if (hex.includes('#ec4699') || hex.includes('#ed45a4')) return 'theme-pink';
    if (hex.includes('#833cf6') || hex.includes('#6b6deb')) return 'theme-violet';
    if (hex.includes('#f59f0a') || hex.includes('#f5a70a')) return 'theme-amber';
    if (hex.includes('#f43e5c')) return 'theme-rose';
    if (hex.includes('#07b6d5')) return 'theme-cyan';
    if (hex.includes('#6467f2')) return 'theme-indigo';

    // Fallback por proximidad (simplificado)
    return 'theme-blue';
  }


  // Compatibilidad con componentes que usan nombres de colores antiguos
  setSpecificColorTheme(color: string): void {
    const mapping: Record<string, AppTheme> = {
      'blue': 'theme-blue',
      'green': 'theme-emerald',
      'orange': 'theme-amber',
      'purple': 'theme-violet'
    };
    const newTheme = mapping[color] || 'theme-blue';
    this.setTheme(newTheme);
  }

  toggleDarkMode(): void {
    const newValue = !this.isDark();
    this.isDark.set(newValue);
    localStorage.setItem('theme', newValue ? 'dark' : 'light');
    this.applyDarkMode(newValue);
  }

  private applyDarkMode(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // Compatibilidad con HeaderComponent
  cycleColorTheme(): void {
    const themes: AppTheme[] = ['theme-blue', 'theme-emerald', 'theme-pink', 'theme-violet', 'theme-amber', 'theme-rose', 'theme-cyan', 'theme-indigo'];
    const currentIndex = themes.indexOf(this.activeTheme());
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }

  getCurrentPrimaryColor(): string {
    const colors: Record<AppTheme, string> = {
      'theme-blue': '#135bec',
      'theme-emerald': '#10b77f',
      'theme-pink': '#ec4699',
      'theme-violet': '#833cf6',
      'theme-amber': '#f59f0a',
      'theme-rose': '#f43e5c',
      'theme-cyan': '#07b6d5',
      'theme-indigo': '#6467f2'
    };
    return colors[this.activeTheme()];
  }

  private applyTheme(theme: AppTheme): void {
    const body = document.body;

    // Remover temas anteriores
    const themeClasses: AppTheme[] = ['theme-blue', 'theme-emerald', 'theme-pink', 'theme-violet', 'theme-amber', 'theme-rose', 'theme-cyan', 'theme-indigo'];
    body.classList.remove(...themeClasses);

    // Aplicar nuevo tema
    body.classList.add(theme);
  }
}

