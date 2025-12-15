import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Signal to track Dark Mode state
  public isDark = signal<boolean>(false);

  constructor() {
    // 1. Initialize from LocalStorage or System Preference
    const storedTheme = localStorage.getItem('erp_theme');

    if (storedTheme) {
      this.isDark.set(storedTheme === 'dark');
    } else {
      // Fallback to System Preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark.set(prefersDark);
    }

    // 2. Effect to sync with DOM (document.documentElement) and LocalStorage
    effect(() => {
      const dark = this.isDark();
      if (dark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('erp_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('erp_theme', 'light');
      }
    });
  }

  /**
   * Toggles the current theme mode.
   */
  toggleTheme() {
    this.isDark.update(current => !current);
  }

  /**
   * Explicitly sets the theme.
   */
  setTheme(isDark: boolean) {
    this.isDark.set(isDark);
  }
}
