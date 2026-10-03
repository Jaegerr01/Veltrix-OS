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
  // Brand default: Postel violet → neon purple. Cyan/emerald stay as optional accents.
  violet: { name: 'Postel Violet', swatch: 'linear-gradient(135deg,#8B5CF6,#B02FE0)', accent: '#8B5CF6', secondary: '#B02FE0' },
  cyan: { name: 'Cyan', swatch: 'linear-gradient(135deg,#22D3EE,#8B5CF6)', accent: '#22D3EE', secondary: '#8B5CF6' },
  emerald: { name: 'Emerald', swatch: 'linear-gradient(135deg,#2EE6A0,#22D3EE)', accent: '#2EE6A0', secondary: '#22D3EE' },
  magenta: { name: 'Neon Orchid', swatch: 'linear-gradient(135deg,#C026D3,#8B5CF6)', accent: '#C026D3', secondary: '#8B5CF6' },
};

/** Brand defaults (Postel Studio: near-black canvas, electric-purple accent). */
export const DEFAULT_ACCENT = '#8B5CF6';
export const DEFAULT_BACKGROUND = '#04030C';
/** Pre-rebrand canvas default; a stored value equal to this is upgraded once. */
const LEGACY_DEFAULT_BACKGROUND = '#060410';

const clampChannel = (n: number) => Math.min(255, Math.max(0, Math.round(n)));
const toHexPair = (n: number) => clampChannel(n).toString(16).padStart(2, '0');

/**
 * Mix a hex colour toward white. `weight` is 0–1, where 1 is pure white.
 *
 * Channels are clamped: this used to be called with a negative weight to mean
 * "darken", which pushed channels past 255 and produced 3-hex-digit garbage
 * like `#10a…` for --violet-500. Use `darken()` for that.
 */
export function mixWithWhite(hex: string, weight: number): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return hex;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const w = Math.min(1, Math.max(0, weight));

  return `#${toHexPair(r * (1 - w) + 255 * w)}${toHexPair(g * (1 - w) + 255 * w)}${toHexPair(b * (1 - w) + 255 * w)}`;
}

/** Mix a hex colour toward black. `weight` is 0–1, where 1 is pure black. */
export function darken(hex: string, weight: number): string {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return hex;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const w = Math.min(1, Math.max(0, weight));

  return `#${toHexPair(r * (1 - w))}${toHexPair(g * (1 - w))}${toHexPair(b * (1 - w))}`;
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
  const [accentColor, setAccentColorState] = useState(DEFAULT_ACCENT);
  const [backgroundColor, setBackgroundColorState] = useState(DEFAULT_BACKGROUND);
  const [avatar, setAvatarState] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('vx_theme') || 'violet';
    const savedAccent = localStorage.getItem('vx_accent') || DEFAULT_ACCENT;
    // One-time upgrade: users who never customised the canvas still have the
    // old default stored; move them to the new brand black. Custom values stay.
    let savedBg = localStorage.getItem('vx_bg') || DEFAULT_BACKGROUND;
    if (savedBg.toLowerCase() === LEGACY_DEFAULT_BACKGROUND) savedBg = DEFAULT_BACKGROUND;
    const savedAvatar = localStorage.getItem('vx_avatar') || '';

    setThemeState(savedTheme);
    setAccentColorState(savedAccent);
    setBackgroundColorState(savedBg);
    setAvatarState(savedAvatar);
    setIsMounted(true);
  }, []);

  // The avatar is persisted on its own. It used to sit in the colour effect's
  // dependency list, so changing a profile photo rewrote all ~20 CSS variables.
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('vx_avatar', avatar);
  }, [avatar, isMounted]);

  // Write colour changes to localStorage and apply CSS custom properties.
  // These are the same tokens the Tailwind theme bridge in globals.css aliases,
  // so an accent change now recolours the whole app rather than half of it.
  useEffect(() => {
    if (!isMounted) return;

    localStorage.setItem('vx_theme', theme);
    localStorage.setItem('vx_accent', accentColor);
    localStorage.setItem('vx_bg', backgroundColor);

    const root = document.documentElement;

    // Apply Accent variables
    const rgb = hexToRgbString(accentColor);
    const secondaryColor = theme !== 'custom' && THEME_PRESETS[theme] ? THEME_PRESETS[theme].secondary : '#B02FE0';
    
    root.style.setProperty('--violet-50', mixWithWhite(accentColor, 0.95));
    root.style.setProperty('--violet-100', mixWithWhite(accentColor, 0.85));
    root.style.setProperty('--violet-200', mixWithWhite(accentColor, 0.55));
    root.style.setProperty('--violet-300', mixWithWhite(accentColor, 0.25));
    root.style.setProperty('--violet-400', accentColor);
    root.style.setProperty('--violet-500', darken(accentColor, 0.15));
    root.style.setProperty('--grad-brand', `linear-gradient(135deg, ${darken(accentColor, 0.12)} 0%, ${secondaryColor} 100%)`);
    root.style.setProperty('--glow-violet', `0 0 24px rgba(${rgb},0.45), 0 0 4px rgba(${rgb},0.6)`);
    root.style.setProperty('--grad-halo', `radial-gradient(circle, rgba(${rgb},0.45) 0%, rgba(177,76,255,0.16) 55%, transparent 72%)`);
    root.style.setProperty('--border-subtle', `rgba(${rgb},0.12)`);
    root.style.setProperty('--border-default', `rgba(${rgb},0.22)`);
    root.style.setProperty('--border-strong', `rgba(${rgb},0.42)`);
    root.style.setProperty('--inner-ring', `inset 0 0 0 1px rgba(${rgb},0.18)`);

    // Apply Background variables (derive raised surfaces to maintain premium look).
    //
    // KNOWN LIMITATION: the text ramp (--text-strong/--text-body) is fixed light,
    // so a light backgroundColor yields white-on-white. The Settings picker is
    // constrained to dark values when it is rebuilt (Phase 4c).
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

  }, [theme, accentColor, backgroundColor, isMounted]);

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
