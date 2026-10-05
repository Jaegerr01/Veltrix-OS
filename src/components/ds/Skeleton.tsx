'use client';

import React from 'react';

/**
 * Loading placeholders that mirror the shape of the content being fetched.
 *
 * The app's only loading affordance was a spinning JPEG (PostelSpinner, marked
 * `priority` in thirteen places), which tells the user nothing about what is
 * coming and downloads an image to say "wait". Use a skeleton wherever the
 * layout is known in advance; keep the spinner for full-screen boot only.
 *
 * The shimmer is a single CSS gradient animation and is disabled automatically
 * under prefers-reduced-motion by the global rule in postel-ds.css.
 */

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 'var(--radius-sm)',
  style,
}: {
  width?: number | string;
  height?: number | string;
  radius?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'block',
        width,
        height,
        borderRadius: radius,
        background:
          'linear-gradient(90deg, var(--ink-700) 25%, var(--ink-600) 37%, var(--ink-700) 63%)',
        backgroundSize: '400% 100%',
        animation: 'vxShimmer 1.4s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

/** A few stacked lines of text, with the last one short like real prose. */
export function SkeletonText({
  lines = 3,
  style,
}: {
  lines?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  );
}

/**
 * Card-shaped placeholder. Wrap a group of these in a container with
 * role="status" and an aria-label so the wait is announced once, rather than
 * every individual bar being read out.
 */
export function SkeletonCard({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        padding: 'var(--space-5)',
        background: 'var(--surface-card)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        ...style,
      }}
    >
      <Skeleton height={10} width="40%" />
      <Skeleton height={28} width="65%" />
      <SkeletonText lines={2} />
    </div>
  );
}

/**
 * Announces a loading region to assistive tech while showing skeletons.
 * Use instead of scattering aria-live on each placeholder.
 */
export function SkeletonRegion({
  label = 'Loading',
  children,
  style,
}: {
  label?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div role="status" aria-label={label} aria-busy="true" style={style}>
      {children}
    </div>
  );
}
