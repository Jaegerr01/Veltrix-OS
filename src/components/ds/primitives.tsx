'use client';

import React from 'react';
import Image from 'next/image';

/* ============================================================
   PostelOS Design System primitives — ported from _ds_bundle.js
   (Avatar, Badge, Button, Card, Input, Switch, StatCard).
   Faithful to the prototype's inline-style rendering.
   ============================================================ */

type Style = React.CSSProperties;

/* ---------------------------------- StatCard ---------------------------------- */
const STAT_ACCENTS: Record<string, string> = {
  violet: 'var(--violet-300)',
  blue: 'var(--blue-300)',
  cyan: 'var(--cyan-300)',
  magenta: 'var(--magenta-300)',
  signal: 'var(--signal-400)',
};

export function StatCard({
  label,
  value,
  unit,
  delta,
  deltaLabel = 'vs last week',
  accent = 'cyan',
  icon,
  style,
  ...rest
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  unit?: React.ReactNode;
  delta?: string | number | null;
  /** What the delta is measured against. Say the real period, not a default. */
  deltaLabel?: React.ReactNode;
  accent?: keyof typeof STAT_ACCENTS | string;
  icon?: React.ReactNode;
  style?: Style;
} & React.HTMLAttributes<HTMLDivElement>) {
  const accentColor = STAT_ACCENTS[accent] || STAT_ACCENTS.cyan;
  const up =
    typeof delta === 'string' ? delta.trim().startsWith('+') : (delta || 0) >= 0;
  const trendColor = up ? 'var(--signal-400)' : 'var(--danger-300)';
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        padding: 'var(--space-5)',
        background: 'var(--grad-panel)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md), var(--sheen-top)',
        ...style,
      }}
      {...rest}
    >
      <span
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: accentColor, opacity: 0.8 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon ? <span style={{ color: accentColor, display: 'inline-flex' }}>{icon}</span> : null}
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 30, fontWeight: 500, color: 'var(--text-strong)', lineHeight: 1 }}>
          {value}
        </span>
        {unit ? <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>{unit}</span> : null}
      </div>
      {delta != null ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 'var(--text-xs)', fontWeight: 600, color: trendColor }}>
          {/* The arrow is decorative — the direction is already in the text and
              in the colour, and colour alone must never carry the meaning. */}
          <span aria-hidden="true">{up ? '▲' : '▼'}</span>
          <span>
            {up ? 'Up ' : 'Down '}
            {typeof delta === 'string' ? delta.replace(/^\+/, '') : Math.abs(delta) + '%'}
          </span>
          {deltaLabel ? <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>{deltaLabel}</span> : null}
        </span>
      ) : null}
    </div>
  );
}

/* ---------------------------------- Avatar ---------------------------------- */
const AVATAR_SIZES: Record<string, number> = { sm: 28, md: 40, lg: 56, xl: 80 };

export function Avatar({
  src,
  name = '',
  size = 'md',
  ring = true,
  status,
  children,
  style,
  ...rest
}: {
  src?: string;
  name?: string;
  size?: keyof typeof AVATAR_SIZES | string;
  ring?: boolean;
  status?: 'active' | 'busy' | 'offline' | string;
  children?: React.ReactNode;
  style?: Style;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const px = AVATAR_SIZES[size] || AVATAR_SIZES.md;
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const statusColor =
    status === 'active'
      ? 'var(--signal-400)'
      : status === 'busy'
      ? 'var(--warn-400)'
      : status === 'offline'
      ? 'var(--mist-400)'
      : null;
  return (
    <span style={{ position: 'relative', display: 'inline-flex', ...style }} {...rest}>
      <span
        style={{
          width: px,
          height: px,
          borderRadius: '50%',
          padding: ring ? 2 : 0,
          background: ring ? 'var(--grad-brand)' : 'transparent',
          boxShadow: ring ? '0 0 14px rgba(124,58,237,0.35)' : 'none',
          display: 'inline-flex',
        }}
      >
        <span
          style={{
            flex: 1,
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'var(--ink-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-strong)',
            fontFamily: 'var(--font-display)',
            fontWeight: 'var(--fw-semibold)' as unknown as number,
            fontSize: px * 0.38,
          }}
        >
          {src ? (
            <Image src={src} alt={name} width={px} height={px} unoptimized style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            children || initials
          )}
        </span>
      </span>
      {statusColor ? (
        <span
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: Math.max(8, px * 0.26),
            height: Math.max(8, px * 0.26),
            borderRadius: '50%',
            background: statusColor,
            border: '2px solid var(--ink-900)',
            boxShadow: status === 'active' ? `0 0 8px ${statusColor}` : 'none',
          }}
        />
      ) : null}
    </span>
  );
}

/* ---------------------------------- Badge ---------------------------------- */
const BADGE_TONES: Record<string, { fg: string; bg: string; bd: string; glow: boolean }> = {
  active: { fg: 'var(--signal-400)', bg: 'rgba(46,230,160,0.12)', bd: 'rgba(46,230,160,0.32)', glow: true },
  info: { fg: 'var(--cyan-400)', bg: 'rgba(34,211,238,0.12)', bd: 'rgba(34,211,238,0.32)', glow: false },
  brand: { fg: 'var(--violet-300)', bg: 'rgba(139,92,246,0.14)', bd: 'rgba(139,92,246,0.34)', glow: false },
  warning: { fg: 'var(--warn-400)', bg: 'rgba(245,181,68,0.12)', bd: 'rgba(245,181,68,0.32)', glow: false },
  danger: { fg: 'var(--danger-300)', bg: 'rgba(255,77,109,0.12)', bd: 'rgba(255,77,109,0.34)', glow: false },
  neutral: { fg: 'var(--mist-300)', bg: 'rgba(237,234,251,0.06)', bd: 'var(--border-default)', glow: false },
};

export function Badge({
  tone = 'neutral',
  dot = false,
  children,
  style,
  ...rest
}: {
  tone?: keyof typeof BADGE_TONES | string;
  dot?: boolean;
  children?: React.ReactNode;
  style?: Style;
} & React.HTMLAttributes<HTMLSpanElement>) {
  const t = BADGE_TONES[tone] || BADGE_TONES.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: '22px',
        padding: dot ? '0 10px 0 8px' : '0 10px',
        fontFamily: 'var(--font-display)',
        fontSize: '11px',
        fontWeight: 'var(--fw-semibold)' as unknown as number,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        color: t.fg,
        background: t.bg,
        border: `1px solid ${t.bd}`,
        borderRadius: 'var(--radius-pill)',
        whiteSpace: 'nowrap',
        ...style,
      }}
      {...rest}
    >
      {dot ? (
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: t.fg, boxShadow: t.glow ? `0 0 8px ${t.fg}` : 'none' }} />
      ) : null}
      {children}
    </span>
  );
}

/* ---------------------------------- Button ---------------------------------- */
const BTN_SIZES: Record<string, { height: string; padding: string; fontSize: string; radius: string; gap: string }> = {
  sm: { height: 'var(--control-h-sm)', padding: '0 14px', fontSize: '13px', radius: 'var(--radius-sm)', gap: '7px' },
  md: { height: 'var(--control-h-md)', padding: '0 20px', fontSize: '14px', radius: 'var(--radius-md)', gap: '8px' },
  lg: { height: 'var(--control-h-lg)', padding: '0 26px', fontSize: '15px', radius: 'var(--radius-md)', gap: '10px' },
};
const BTN_VARIANTS: Record<string, Style> = {
  primary: { background: 'var(--grad-brand)', color: 'var(--text-on-accent)', border: '1px solid transparent', boxShadow: 'var(--glow-violet)' },
  secondary: { background: 'var(--surface-card)', color: 'var(--text-body)', border: '1px solid var(--border-default)', boxShadow: 'var(--sheen-top)' },
  ghost: { background: 'transparent', color: 'var(--text-muted)', border: '1px solid transparent', boxShadow: 'none' },
  danger: { background: 'var(--danger-600)', color: 'var(--white)', border: '1px solid transparent', boxShadow: '0 0 22px rgba(255,77,109,0.4)' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  disabled = false,
  type = 'button',
  children,
  style,
  ...rest
}: {
  variant?: keyof typeof BTN_VARIANTS | string;
  size?: keyof typeof BTN_SIZES | string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: Style;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const s = BTN_SIZES[size] || BTN_SIZES.md;
  const v = BTN_VARIANTS[variant] || BTN_VARIANTS.primary;
  return (
    <button
      type={type}
      disabled={disabled}
      style={{
        display: fullWidth ? 'flex' : 'inline-flex',
        width: fullWidth ? '100%' : 'auto',
        alignItems: 'center',
        justifyContent: 'center',
        gap: s.gap,
        height: s.height,
        padding: s.padding,
        fontFamily: 'var(--font-body)',
        fontSize: s.fontSize,
        fontWeight: 'var(--fw-semibold)' as unknown as number,
        letterSpacing: '0.01em',
        lineHeight: 1,
        borderRadius: s.radius,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        whiteSpace: 'nowrap',
        transition: 'transform var(--dur-fast) var(--ease-out), filter var(--dur-base) var(--ease-out), background var(--dur-base) var(--ease-out)',
        ...v,
        ...style,
      }}
      {...rest}
      /* These sit AFTER {...rest} on purpose. Declared before it, a caller
         passing its own onMouseEnter silently replaced the hover treatment;
         now the built-in effect runs and the caller's handler is chained. */
      onMouseDown={(e) => {
        if (!disabled) e.currentTarget.style.transform = 'translateY(1px) scale(0.99)';
        rest.onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = '';
        rest.onMouseUp?.(e);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.filter = '';
        if (variant === 'ghost') e.currentTarget.style.background = 'transparent';
        rest.onMouseLeave?.(e);
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.filter = variant === 'ghost' ? 'none' : 'brightness(1.12)';
        if (!disabled && variant === 'ghost') e.currentTarget.style.background = 'var(--surface-hover)';
        rest.onMouseEnter?.(e);
      }}
    >
      {leadingIcon ? <span style={{ display: 'inline-flex', fontSize: '1.1em' }}>{leadingIcon}</span> : null}
      {children}
      {trailingIcon ? <span style={{ display: 'inline-flex', fontSize: '1.1em' }}>{trailingIcon}</span> : null}
    </button>
  );
}

/* ---------------------------------- Card ---------------------------------- */
export function Card({
  glow = false,
  interactive = false,
  padding = 'var(--space-6)',
  as: Tag = 'div',
  children,
  style,
  ...rest
}: {
  glow?: boolean;
  interactive?: boolean;
  padding?: string | number;
  as?: React.ElementType;
  children?: React.ReactNode;
  style?: Style;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [hover, setHover] = React.useState(false);
  return (
    <Tag
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      style={{
        position: 'relative',
        background: 'var(--grad-panel)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding,
        color: 'var(--text-body)',
        boxShadow: glow || (interactive && hover) ? 'var(--shadow-lg), var(--glow-soft), var(--sheen-top)' : 'var(--shadow-md), var(--sheen-top)',
        backdropFilter: 'var(--blur-sm)',
        WebkitBackdropFilter: 'var(--blur-sm)',
        transition: 'transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
        transform: interactive && hover ? 'translateY(-2px)' : 'none',
        borderColor: interactive && hover ? 'var(--border-strong)' : 'var(--border-default)',
        cursor: interactive ? 'pointer' : 'default',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ---------------------------------- Input ---------------------------------- */
export function Input({
  label,
  hint,
  error,
  leadingIcon,
  size = 'md',
  id,
  style,
  disabled,
  ...rest
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  leadingIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  style?: Style;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'style'>) {
  const [focus, setFocus] = React.useState(false);
  const reactId = React.useId();
  const fid = id || reactId;
  const h = size === 'sm' ? 'var(--control-h-sm)' : size === 'lg' ? 'var(--control-h-lg)' : 'var(--control-h-md)';
  const borderColor = error ? 'var(--danger-400)' : focus ? 'var(--border-focus)' : 'var(--border-default)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', ...style }}>
      {label ? (
        <label
          htmlFor={fid}
          style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}
        >
          {label}
        </label>
      ) : null}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          height: h,
          padding: '0 14px',
          background: 'var(--ink-800)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: focus ? '0 0 0 3px rgba(139,92,246,0.18), var(--glow-violet)' : 'var(--sheen-top)',
          transition: 'border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out)',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {leadingIcon ? <span style={{ display: 'inline-flex', color: 'var(--text-dim)' }}>{leadingIcon}</span> : null}
        <input
          id={fid}
          disabled={disabled}
          onFocus={(e) => {
            setFocus(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocus(false);
            rest.onBlur?.(e);
          }}
          aria-invalid={error ? true : undefined}
          {...rest}
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            background: 'transparent',
            border: 'none',
            /* No `outline: none` here. The wrapper's colour change is a hint,
               not a focus indicator, and it never fires for programmatic focus —
               the global :focus-visible ring is what keyboard users rely on. */
            color: 'var(--text-strong)',
            fontFamily: 'var(--font-body)',
            fontSize: size === 'sm' ? 'var(--text-sm)' : 'var(--text-base)',
          }}
        />
      </div>
      {error || hint ? (
        <span style={{ fontSize: 12, color: error ? 'var(--danger-300)' : 'var(--text-dim)' }}>{error || hint}</span>
      ) : null}
    </div>
  );
}

/* ---------------------------------- Switch ---------------------------------- */
export function Switch({
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  label,
  ariaLabel,
  id,
  style,
}: {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label?: React.ReactNode;
  /** Accessible name when no visible `label` is given. */
  ariaLabel?: string;
  id?: string;
  style?: Style;
}) {
  const isControlled = checked !== undefined;
  const [internal, setInternal] = React.useState(defaultChecked);
  const on = isControlled ? checked : internal;
  const reactId = React.useId();
  const fid = id || reactId;
  const toggle = () => {
    if (disabled) return;
    if (!isControlled) setInternal(!on);
    onChange?.(!on);
  };
  const control = (
    <button type="button" role="switch" aria-checked={on} aria-label={label ? undefined : ariaLabel} id={fid} onClick={toggle} disabled={disabled} className="vx-switch">
      <span className="vx-switch__track" data-on={on}><span className="vx-switch__thumb" /></span>
    </button>
  );
  if (!label) return <span style={style}>{control}</span>;
  return (
    <label
      htmlFor={fid}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {control}
      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-body)' }}>{label}</span>
    </label>
  );
}
