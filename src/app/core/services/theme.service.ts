import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme-preference';
  
  // Usamos signals para gestionar el estado del tema
  currentTheme = signal<'light' | 'dark'>('light');

  constructor() {
    this.loadTheme();
    
    // Efecto para aplicar el tema cuando cambie la señal
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
      this.saveTheme(theme);
    });
  }

  toggleTheme() {
    this.currentTheme.update(current => current === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: 'light' | 'dark') {
    this.currentTheme.set(theme);
  }

  isDark() {
    return this.currentTheme() === 'dark';
  }

  private loadTheme() {
    const saved = localStorage.getItem(this.THEME_KEY) as 'light' | 'dark';
    if (saved) {
      this.currentTheme.set(saved);
    } else {
      // Detección automática del sistema si no hay preferencia guardada
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme.set(prefersDark ? 'dark' : 'light');
    }
  }

  private applyTheme(theme: 'light' | 'dark') {
    // Aplicamos el atributo al body para selectores CSS globales
    document.body.setAttribute('data-theme', theme);
    
    // Opcional: Si usas Tailwind con clase 'dark' en lugar de data-theme (o ambos)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private saveTheme(theme: 'light' | 'dark') {
    localStorage.setItem(this.THEME_KEY, theme);
  }
}
