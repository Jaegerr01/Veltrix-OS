'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AppearanceContextType {
  theme: string; // 'violet' | 'cyan' | 'emerald' | 'magenta' | 'custom'
  accentColor: string;
  backgroundColor: string;
  avatar: string;
  setTheme: (t: string) => void;
  setAccentColor: (c: string) => void;
  setBackgroundColor: (c: string) => void;
  setAvatar: (a: string) => void;
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

// Preset themes matching the design prototype:
export const THEME_PRESETS: Record<string, { name: string; swatch: string; accent: string; secondary: string }> = {
  violet: { name: 'Violet', swatch: 'linear-gradient(135deg,#8B5CF6,#4F6BFF)', accent: '#8B5CF6', secondary: '#4F6BFF' },
  cyan: { name: 'Cyan', swatch: 'linear-gradient(135deg,#22D3EE,#4F6BFF)', accent: '#22D3EE', secondary: '#4F6BFF' },
  emerald: { name: 'Emerald', swatch: 'linear-gradient(135deg,#2EE6A0,#22D3EE)', accent: '#2EE6A0', secondary: '#22D3EE' },
  magenta: { name: 'Magenta', swatch: 'linear-gradient(135deg,#D946EF,#8B5CF6)', accent: '#D946EF', secondary: '#8B5CF6' },
};

// Mix a hex color with white (weight between 0 and 1, where 1 is pure white)
export function mixWithWhite(hex: string, weight: number): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return hex;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  const mixedR = Math.round(r * (1 - weight) + 255 * weight);
  const mixedG = Math.round(g * (1 - weight) + 255 * weight);
  const mixedB = Math.round(b * (1 - weight) + 255 * weight);

  return `#${mixedR.toString(16).padStart(2, '0')}${mixedG.toString(16).padStart(2, '0')}${mixedB.toString(16).padStart(2, '0')}`;
}

// Convert a hex string to rgba components for use in CSS shadows/glows
export function hexToRgbString(hex: string): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return '139,92,246'; // fallback to violet rgb
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState('violet');
  const [accentColor, setAccentColorState] = useState('#8B5CF6');
  const [backgroundColor, setBackgroundColorState] = useState('#060410');
  const [avatar, setAvatarState] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('vx_theme') || 'violet';
    const savedAccent = localStorage.getItem('vx_accent') || '#8B5CF6';
    const savedBg = localStorage.getItem('vx_bg') || '#060410';
    const savedAvatar = localStorage.getItem('vx_avatar') || '';

    setThemeState(savedTheme);
    setAccentColorState(savedAccent);
    setBackgroundColorState(savedBg);
    setAvatarState(savedAvatar);
    setIsMounted(true);
  }, []);

  // Write changes to localStorage and apply CSS custom properties
  useEffect(() => {
    if (!isMounted) return;

    localStorage.setItem('vx_theme', theme);
    localStorage.setItem('vx_accent', accentColor);
    localStorage.setItem('vx_bg', backgroundColor);
    localStorage.setItem('vx_avatar', avatar);

    const root = document.documentElement;

    // Apply Accent variables
    const rgb = hexToRgbString(accentColor);
    const secondaryColor = theme !== 'custom' && THEME_PRESETS[theme] ? THEME_PRESETS[theme].secondary : '#4F6BFF';
    
    root.style.setProperty('--violet-50', mixWithWhite(accentColor, 0.95));
    root.style.setProperty('--violet-100', mixWithWhite(accentColor, 0.85));
    root.style.setProperty('--violet-200', mixWithWhite(accentColor, 0.55));
    root.style.setProperty('--violet-300', mixWithWhite(accentColor, 0.25));
    root.style.setProperty('--violet-400', accentColor);
    root.style.setProperty('--violet-500', mixWithWhite(accentColor, -0.15)); // darken slightly or lighter
    root.style.setProperty('--grad-brand', `linear-gradient(135deg, ${accentColor} 0%, ${secondaryColor} 100%)`);
    root.style.setProperty('--glow-violet', `0 0 24px rgba(${rgb},0.45), 0 0 4px rgba(${rgb},0.6)`);
    root.style.setProperty('--grad-halo', `radial-gradient(circle, rgba(${rgb},0.45) 0%, rgba(79,107,255,0.15) 55%, transparent 72%)`);
    root.style.setProperty('--border-subtle', `rgba(${rgb},0.12)`);
    root.style.setProperty('--border-default', `rgba(${rgb},0.22)`);
    root.style.setProperty('--border-strong', `rgba(${rgb},0.42)`);
    root.style.setProperty('--inner-ring', `inset 0 0 0 1px rgba(${rgb},0.18)`);

    // Apply Background variables (derive raised surfaces to maintain premium look)
    root.style.setProperty('--ink-900', backgroundColor);
    
    // Calculate elevated dark colors by mixing the custom background color with small weights of pure white
    const ink800 = mixWithWhite(backgroundColor, 0.02);
    const ink700 = mixWithWhite(backgroundColor, 0.05);
    const ink600 = mixWithWhite(backgroundColor, 0.09);
    const ink500 = mixWithWhite(backgroundColor, 0.16);
    const ink400 = mixWithWhite(backgroundColor, 0.25);
    const ink300 = mixWithWhite(backgroundColor, 0.35);

    root.style.setProperty('--ink-800', ink800);
    root.style.setProperty('--ink-700', ink700);
    root.style.setProperty('--ink-600', ink600);
    root.style.setProperty('--ink-500', ink500);
    root.style.setProperty('--ink-400', ink400);
    root.style.setProperty('--ink-300', ink300);

    // Dynamic translucent panel gradient
    root.style.setProperty('--grad-panel', `linear-gradient(155deg, ${ink700}cc 0%, ${backgroundColor}80 100%)`);

  }, [theme, accentColor, backgroundColor, avatar, isMounted]);

  const setTheme = (t: string) => {
    setThemeState(t);
    if (THEME_PRESETS[t]) {
      setAccentColorState(THEME_PRESETS[t].accent);
    }
  };

  const setAccentColor = (c: string) => {
    setThemeState('custom');
    setAccentColorState(c);
  };

  const setBackgroundColor = (bg: string) => {
    setBackgroundColorState(bg);
  };

  const setAvatar = (a: string) => {
    setAvatarState(a);
  };

  return (
    <AppearanceContext.Provider
      value={{
        theme,
        accentColor,
        backgroundColor,
        avatar,
        setTheme,
        setAccentColor,
        setBackgroundColor,
        setAvatar,
      }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}
