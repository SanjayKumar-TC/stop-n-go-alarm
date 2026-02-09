import { useState, useEffect } from 'react';

export type UIDesign = 'modern' | 'glass' | 'rounded' | 'sharp' | 'soft' | 'minimal' | 'brutalist' | 'neon' | 'retro';

export interface UIDesignOption {
  id: UIDesign;
  label: string;
  description: string;
  borderRadius: string;
  shadowStyle: string;
  panelStyle: string;
}

export const UI_DESIGN_OPTIONS: UIDesignOption[] = [
  { 
    id: 'modern', 
    label: 'Modern', 
    description: 'Clean and balanced design',
    borderRadius: '0.75rem',
    shadowStyle: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    panelStyle: 'solid'
  },
  { 
    id: 'glass', 
    label: 'Glassmorphism', 
    description: 'Frosted glass effects',
    borderRadius: '1rem',
    shadowStyle: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    panelStyle: 'glass'
  },
  { 
    id: 'rounded', 
    label: 'Rounded', 
    description: 'Extra rounded corners',
    borderRadius: '1.5rem',
    shadowStyle: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    panelStyle: 'solid'
  },
  { 
    id: 'sharp', 
    label: 'Sharp', 
    description: 'Angular and minimal',
    borderRadius: '0.25rem',
    shadowStyle: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    panelStyle: 'solid'
  },
  { 
    id: 'soft', 
    label: 'Soft', 
    description: 'Gentle neumorphic style',
    borderRadius: '1rem',
    shadowStyle: '6px 6px 12px #d1d5db, -6px -6px 12px #ffffff',
    panelStyle: 'neumorphic'
  },
  { 
    id: 'minimal', 
    label: 'Minimal', 
    description: 'Ultra clean, borderless',
    borderRadius: '0.5rem',
    shadowStyle: 'none',
    panelStyle: 'minimal'
  },
  { 
    id: 'brutalist', 
    label: 'Brutalist', 
    description: 'Bold borders, raw aesthetic',
    borderRadius: '0',
    shadowStyle: '4px 4px 0 0 currentColor',
    panelStyle: 'brutalist'
  },
  { 
    id: 'neon', 
    label: 'Neon', 
    description: 'Glowing cyberpunk vibes',
    borderRadius: '0.5rem',
    shadowStyle: '0 0 20px rgba(0, 255, 255, 0.5)',
    panelStyle: 'neon'
  },
  { 
    id: 'retro', 
    label: 'Retro', 
    description: 'Vintage pixel-perfect style',
    borderRadius: '0',
    shadowStyle: '3px 3px 0 0 #000',
    panelStyle: 'retro'
  },
];

export const useUIDesign = () => {
  const [uiDesign, setUIDesignState] = useState<UIDesign>(() => {
    const saved = localStorage.getItem('uiDesign');
    return (saved as UIDesign) || 'modern';
  });

  const setUIDesign = (design: UIDesign) => {
    setUIDesignState(design);
    localStorage.setItem('uiDesign', design);
  };

  // Apply design styles to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    const designOption = UI_DESIGN_OPTIONS.find(d => d.id === uiDesign) || UI_DESIGN_OPTIONS[0];
    
    root.style.setProperty('--radius', designOption.borderRadius);
    root.style.setProperty('--design-shadow', designOption.shadowStyle);
    
    // Remove all design classes first
    root.classList.remove('design-modern', 'design-glass', 'design-rounded', 'design-sharp', 'design-soft', 'design-minimal', 'design-brutalist', 'design-neon', 'design-retro');
    
    // Add current design class
    root.classList.add(`design-${uiDesign}`);
    
  }, [uiDesign]);

  return { uiDesign, setUIDesign };
};
