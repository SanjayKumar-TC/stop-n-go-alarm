import { useState, useEffect } from 'react';

export type UITheme = 'teal' | 'blue' | 'purple' | 'orange' | 'rose' | 'emerald';

export interface UIThemeOption {
  id: UITheme;
  label: string;
  description: string;
  primaryColor: string; // For preview swatch
  lightColor: string; // Light mode preview
  darkColor: string; // Dark mode preview
}

export const UI_THEME_OPTIONS: UIThemeOption[] = [
  { id: 'teal', label: 'Teal', description: 'Default calming teal', primaryColor: '#2db4a5', lightColor: '#2db4a5', darkColor: '#40c9ba' },
  { id: 'blue', label: 'Ocean Blue', description: 'Classic navigation blue', primaryColor: '#3b82f6', lightColor: '#3b82f6', darkColor: '#60a5fa' },
  { id: 'purple', label: 'Amethyst', description: 'Rich purple accent', primaryColor: '#8b5cf6', lightColor: '#8b5cf6', darkColor: '#a78bfa' },
  { id: 'orange', label: 'Sunset', description: 'Warm orange tones', primaryColor: '#f97316', lightColor: '#f97316', darkColor: '#fb923c' },
  { id: 'rose', label: 'Rose', description: 'Soft pink accents', primaryColor: '#f43f5e', lightColor: '#f43f5e', darkColor: '#fb7185' },
  { id: 'emerald', label: 'Emerald', description: 'Fresh green theme', primaryColor: '#10b981', lightColor: '#10b981', darkColor: '#34d399' },
];

// HSL values for each theme (light mode primary, dark mode primary)
const THEME_COLORS: Record<UITheme, { light: string; dark: string }> = {
  teal: { light: '174 72% 40%', dark: '174 72% 50%' },
  blue: { light: '217 91% 60%', dark: '217 91% 65%' },
  purple: { light: '258 90% 66%', dark: '258 90% 70%' },
  orange: { light: '25 95% 53%', dark: '25 95% 58%' },
  rose: { light: '350 89% 60%', dark: '350 89% 65%' },
  emerald: { light: '160 84% 39%', dark: '160 84% 50%' },
};

export const useUITheme = () => {
  const [uiTheme, setUIThemeState] = useState<UITheme>(() => {
    const saved = localStorage.getItem('uiTheme');
    return (saved as UITheme) || 'teal';
  });

  const setUITheme = (theme: UITheme) => {
    setUIThemeState(theme);
    localStorage.setItem('uiTheme', theme);
  };

  // Apply theme colors to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const colors = THEME_COLORS[uiTheme];
    
    // Set the primary color CSS variable
    root.style.setProperty('--primary-theme-light', colors.light);
    root.style.setProperty('--primary-theme-dark', colors.dark);
    
    // Update CSS variables based on current mode
    const updateColors = () => {
      const isDark = root.classList.contains('dark');
      const primaryValue = isDark ? colors.dark : colors.light;
      root.style.setProperty('--primary', primaryValue);
      root.style.setProperty('--ring', primaryValue);
      root.style.setProperty('--sidebar-primary', primaryValue);
      root.style.setProperty('--sidebar-ring', primaryValue);
    };

    updateColors();

    // Watch for theme class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          updateColors();
        }
      });
    });

    observer.observe(root, { attributes: true });

    return () => observer.disconnect();
  }, [uiTheme]);

  return { uiTheme, setUITheme };
};
