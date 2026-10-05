'use client';

import React from 'react';
import { PostelMark } from './PostelMark';

interface PostelSpinnerProps {
  size?: number;
  message?: string;
  className?: string;
}

/**
 * Loading indicator: the Postel monogram (vector, neon gradient) breathing in
 * a purple glow, with a ring + bright dot orbiting it. All animation lives in
 * CSS (.vx-spinner* in postel-ds.css) so it respects prefers-reduced-motion.
 */
export function PostelSpinner({ size = 56, message, className = '' }: PostelSpinnerProps) {
  const ringW = size >= 72 ? 3 : 2;
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 p-6 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className="vx-spinner"
        style={{ width: size, height: size, ['--ring-w' as string]: `${ringW}px` } as React.CSSProperties}
        aria-hidden="true"
      >
        <div className="vx-spinner__halo" />
        <div className="vx-spinner__track" />
        <div className="vx-spinner__ring" />
        <div className="vx-spinner__orbit" />
        <div className="vx-spinner__mark">
          <PostelMark size={Math.round(size * 0.58)} />
        </div>
      </div>
      {message ? (
        <p
          style={{
            fontSize: 'var(--text-xs)',
            letterSpacing: 'var(--ls-wide)',
            color: 'var(--text-muted)',
          }}
        >
          {message}
        </p>
      ) : (
        <span className="sr-only">Loading…</span>
      )}
    </div>
  );
}
export default PostelSpinner;