'use client';

import React from 'react';
import { VxIcon } from './VxIcon';

/**
 * Form controls. Pages previously used raw <select> and <textarea> elements
 * carrying an ad-hoc `inputStyle` object copied between files, so they picked
 * up none of the design system's labelling, error or focus behaviour.
 *
 * All three share FieldShell, so a label, hint and error look and announce the
 * same way whatever the control is. Note there is no `outline: none` here —
 * the global :focus-visible ring is allowed to do its job.
 */

type Style = React.CSSProperties;

const labelStyle: Style = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--text-2xs)',
  fontWeight: 'var(--fw-semibold)' as unknown as number,
  letterSpacing: 'var(--ls-wide)',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
};

const controlBase: Style = {
  width: '100%',
  padding: '0 var(--space-3)',
  background: 'var(--ink-800)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-strong)',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--text-base)',
  transition: 'border-color var(--dur-base) var(--ease-out)',
};

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
  style,
}: {
  id: string;
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
  style?: Style;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', ...style }}>
      {label ? (
        <label htmlFor={id} style={labelStyle}>
          {label}
          {required ? <span style={{ color: 'var(--danger-300)' }}> *</span> : null}
        </label>
      ) : null}

      {children}

      {error || hint ? (
        <span
          id={`${id}-msg`}
          /* Errors are announced when they appear, hints are not. */
          role={error ? 'alert' : undefined}
          style={{
            fontSize: 'var(--text-xs)',
            lineHeight: 'var(--lh-normal)',
            color: error ? 'var(--danger-300)' : 'var(--text-dim)',
          }}
        >
          {error || hint}
        </span>
      ) : null}
    </div>
  );
}

/* ---------------------------------- Select ---------------------------------- */

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  id,
  style,
  required,
  ...rest
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  options: SelectOption[];
  placeholder?: string;
  style?: Style;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'style'>) {
  const reactId = React.useId();
  const fid = id || reactId;

  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} required={required} style={style}>
      <div style={{ position: 'relative', display: 'flex' }}>
        <select
          id={fid}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${fid}-msg` : undefined}
          {...rest}
          style={{
            ...controlBase,
            height: 'var(--control-h-md)',
            paddingRight: 'var(--space-10)',
            borderColor: error ? 'var(--danger-400)' : 'var(--border-default)',
            appearance: 'none',
            cursor: 'pointer',
          }}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <span
          style={{
            position: 'absolute',
            right: 'var(--space-3)',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-dim)',
            pointerEvents: 'none',
            display: 'inline-flex',
          }}
        >
          <VxIcon name="chevronDown" size={16} />
        </span>
      </div>
    </FieldShell>
  );
}

/* --------------------------------- Textarea --------------------------------- */

export function Textarea({
  label,
  hint,
  error,
  id,
  rows = 4,
  style,
  required,
  ...rest
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  style?: Style;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'style'>) {
  const reactId = React.useId();
  const fid = id || reactId;

  return (
    <FieldShell id={fid} label={label} hint={hint} error={error} required={required} style={style}>
      <textarea
        id={fid}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${fid}-msg` : undefined}
        {...rest}
        style={{
          ...controlBase,
          padding: 'var(--space-3)',
          minHeight: 'calc(var(--control-h-md) * 2)',
          lineHeight: 'var(--lh-normal)',
          resize: 'vertical',
          borderColor: error ? 'var(--danger-400)' : 'var(--border-default)',
        }}
      />
    </FieldShell>
  );
}

/* --------------------------------- Checkbox --------------------------------- */

export function Checkbox({
  label,
  hint,
  id,
  style,
  ...rest
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  style?: Style;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'style' | 'type'>) {
  const reactId = React.useId();
  const fid = id || reactId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', ...style }}>
      <label
        htmlFor={fid}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          cursor: rest.disabled ? 'not-allowed' : 'pointer',
          opacity: rest.disabled ? 0.5 : 1,
        }}
      >
        <input
          id={fid}
          type="checkbox"
          aria-describedby={hint ? `${fid}-msg` : undefined}
          {...rest}
          style={{
            width: 16,
            height: 16,
            flex: '0 0 auto',
            accentColor: 'var(--violet-400)',
            cursor: 'inherit',
          }}
        />
        <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-body)' }}>{label}</span>
      </label>
      {hint ? (
        <span
          id={`${fid}-msg`}
          style={{ paddingLeft: 28, fontSize: 'var(--text-xs)', color: 'var(--text-dim)' }}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}
