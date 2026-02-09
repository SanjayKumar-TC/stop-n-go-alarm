import { useState, useEffect } from 'react';

export type DesignTheme = 'modern' | 'glass' | 'rounded' | 'sharp' | 'soft' | 'minimal' | 'brutalist' | 'neon' | 'retro';

export interface DesignThemeOption {
  id: DesignTheme;
  label: string;
  description: string;
  previewStyles: {
    borderRadius: string;
    border: string;
    shadow: string;
    background: string;
    fontStyle?: string;
  };
}

export const DESIGN_THEME_OPTIONS: DesignThemeOption[] = [
  {
    id: 'modern',
    label: 'Modern',
    description: 'Clean lines, balanced spacing',
    previewStyles: { borderRadius: '12px', border: '1px solid hsl(220 13% 91%)', shadow: '0 4px 12px rgba(0,0,0,0.08)', background: 'transparent' },
  },
  {
    id: 'glass',
    label: 'Glassmorphism',
    description: 'Frosted glass with blur effects',
    previewStyles: { borderRadius: '16px', border: '1px solid rgba(255,255,255,0.2)', shadow: '0 8px 32px rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.1)' },
  },
  {
    id: 'rounded',
    label: 'Rounded',
    description: 'Extra rounded, friendly feel',
    previewStyles: { borderRadius: '24px', border: '1px solid hsl(220 13% 91%)', shadow: '0 4px 16px rgba(0,0,0,0.06)', background: 'transparent' },
  },
  {
    id: 'sharp',
    label: 'Sharp',
    description: 'No rounding, precise edges',
    previewStyles: { borderRadius: '0px', border: '1px solid hsl(220 13% 91%)', shadow: '0 2px 8px rgba(0,0,0,0.1)', background: 'transparent' },
  },
  {
    id: 'soft',
    label: 'Soft',
    description: 'Neumorphic embossed feel',
    previewStyles: { borderRadius: '16px', border: 'none', shadow: '4px 4px 10px rgba(0,0,0,0.1), -4px -4px 10px rgba(255,255,255,0.7)', background: 'transparent' },
  },
  {
    id: 'minimal',
    label: 'Minimal',
    description: 'Stripped down, content-first',
    previewStyles: { borderRadius: '4px', border: '1px solid hsl(220 13% 91%)', shadow: 'none', background: 'transparent' },
  },
  {
    id: 'brutalist',
    label: 'Brutalist',
    description: 'Bold borders, raw aesthetic',
    previewStyles: { borderRadius: '0px', border: '3px solid currentColor', shadow: '4px 4px 0 currentColor', background: 'transparent' },
  },
  {
    id: 'neon',
    label: 'Neon',
    description: 'Cyberpunk glowing accents',
    previewStyles: { borderRadius: '8px', border: '1px solid hsl(174 72% 50%)', shadow: '0 0 12px hsl(174 72% 50% / 0.3), 0 0 4px hsl(174 72% 50% / 0.2)', background: 'transparent' },
  },
  {
    id: 'retro',
    label: 'Retro',
    description: 'Vintage pixel-style borders',
    previewStyles: { borderRadius: '0px', border: '2px solid currentColor', shadow: '3px 3px 0 currentColor', background: 'transparent', fontStyle: 'monospace' },
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
    DESIGN_THEME_OPTIONS.forEach((opt) => {
      root.classList.remove(`design-${opt.id}`);
    });

    // Add current design class
    root.classList.add(`design-${designTheme}`);

    // Set CSS variables per design
    const vars: Record<string, string> = {};

    switch (designTheme) {
      case 'modern':
        vars['--radius'] = '0.75rem';
        vars['--design-shadow'] = '0 4px 12px rgba(0,0,0,0.08)';
        break;
      case 'glass':
        vars['--radius'] = '1rem';
        vars['--design-shadow'] = '0 8px 32px rgba(0,0,0,0.1)';
        break;
      case 'rounded':
        vars['--radius'] = '1.5rem';
        vars['--design-shadow'] = '0 4px 16px rgba(0,0,0,0.06)';
        break;
      case 'sharp':
        vars['--radius'] = '0px';
        vars['--design-shadow'] = '0 2px 8px rgba(0,0,0,0.1)';
        break;
      case 'soft':
        vars['--radius'] = '1rem';
        vars['--design-shadow'] = '4px 4px 10px rgba(0,0,0,0.1), -4px -4px 10px rgba(255,255,255,0.7)';
        break;
      case 'minimal':
        vars['--radius'] = '0.25rem';
        vars['--design-shadow'] = 'none';
        break;
      case 'brutalist':
        vars['--radius'] = '0px';
        vars['--design-shadow'] = '4px 4px 0 hsl(var(--foreground))';
        break;
      case 'neon':
        vars['--radius'] = '0.5rem';
        vars['--design-shadow'] = '0 0 12px hsl(var(--primary) / 0.3), 0 0 4px hsl(var(--primary) / 0.2)';
        break;
      case 'retro':
        vars['--radius'] = '0px';
        vars['--design-shadow'] = '3px 3px 0 hsl(var(--foreground))';
        break;
    }

    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [designTheme]);

  return { designTheme, setDesignTheme };
};
