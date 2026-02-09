import { useState, useEffect } from 'react';

export type DesignTheme = 'modern' | 'glass' | 'rounded' | 'sharp' | 'soft' | 'minimal' | 'brutalist' | 'neon' | 'retro';

export interface DesignThemeOption {
  id: DesignTheme;
  label: string;
  description: string;
  previewStyle: {
    radius: string;
    border: string;
    shadow: string;
    bg: string;
    font?: string;
  };
}

export const DESIGN_THEME_OPTIONS: DesignThemeOption[] = [
  {
    id: 'modern',
    label: 'Modern',
    description: 'Clean and contemporary',
    previewStyle: { radius: '12px', border: '1px solid hsl(var(--border))', shadow: '0 4px 12px -2px rgba(0,0,0,0.1)', bg: 'hsl(var(--card))' },
  },
  {
    id: 'glass',
    label: 'Glassmorphism',
    description: 'Frosted glass with blur',
    previewStyle: { radius: '16px', border: '1px solid rgba(255,255,255,0.2)', shadow: '0 8px 32px rgba(0,0,0,0.1)', bg: 'rgba(255,255,255,0.1)' },
  },
  {
    id: 'rounded',
    label: 'Rounded',
    description: 'Extra round and bubbly',
    previewStyle: { radius: '24px', border: '1px solid hsl(var(--border))', shadow: '0 4px 16px -4px rgba(0,0,0,0.1)', bg: 'hsl(var(--card))' },
  },
  {
    id: 'sharp',
    label: 'Sharp',
    description: 'Crisp edges, no rounding',
    previewStyle: { radius: '0px', border: '1px solid hsl(var(--border))', shadow: '0 2px 8px rgba(0,0,0,0.1)', bg: 'hsl(var(--card))' },
  },
  {
    id: 'soft',
    label: 'Soft',
    description: 'Neumorphic embossed look',
    previewStyle: { radius: '16px', border: 'none', shadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)', bg: 'hsl(var(--background))' },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Stripped down essentials',
    previewStyle: { radius: '8px', border: '1px solid hsl(var(--border))', shadow: 'none', bg: 'transparent' },
  },
  {
    id: 'brutalist',
    label: 'Brutalist',
    description: 'Bold borders, raw style',
    previewStyle: { radius: '0px', border: '3px solid hsl(var(--foreground))', shadow: '4px 4px 0 hsl(var(--foreground))', bg: 'hsl(var(--background))' },
  },
  {
    id: 'neon',
    label: 'Neon',
    description: 'Cyberpunk glow effects',
    previewStyle: { radius: '8px', border: '1px solid hsl(var(--primary))', shadow: '0 0 10px hsl(var(--primary) / 0.3), 0 0 20px hsl(var(--primary) / 0.1)', bg: 'hsl(var(--card))' },
  },
  {
    id: 'retro',
    label: 'Retro',
    description: 'Pixel-style vintage feel',
    previewStyle: { radius: '0px', border: '2px solid hsl(var(--foreground))', shadow: '3px 3px 0 hsl(var(--foreground))', bg: 'hsl(var(--card))', font: 'monospace' },
  },
];

export const useDesignTheme = () => {
  const [designTheme, setDesignThemeState] = useState<DesignTheme>(() => {
    const saved = localStorage.getItem('designTheme');
    return (saved as DesignTheme) || 'modern';
  });

  const setDesignTheme = (theme: DesignTheme) => {
    setDesignThemeState(theme);
    localStorage.setItem('designTheme', theme);
  };

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all design classes
    DESIGN_THEME_OPTIONS.forEach(opt => {
      root.classList.remove(`design-${opt.id}`);
    });
    
    // Add current design class
    root.classList.add(`design-${designTheme}`);
  }, [designTheme]);

  return { designTheme, setDesignTheme };
};
