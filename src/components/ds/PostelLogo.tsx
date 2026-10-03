'use client';

import React from 'react';
import { PostelMark } from './PostelMark';

/**
 * Brand lockup: mark + "POSTEL" (bold) + "STUDIO"/"OS" (light) wordmark.
 *  - stacked:  mark above the wordmark (login, splash, sidebar)
 *  - inline:   mark left of the wordmark (compact headers)
 */
export interface PostelLogoProps {
  layout?: 'stacked' | 'inline';
  markSize?: number;
  /** Second word. "STUDIO" matches the brand lockup; "OS" is the product name. */
  suffix?: 'STUDIO' | 'OS';
  glow?: boolean;
  /** Render only the wordmark (no monogram). */
  showMark?: boolean;
  /** Override the wordmark font size in px. */
  fontSize?: number;
  /** Small "by Postel Studio" line under the wordmark. */
  byline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function PostelLogo({
  layout = 'stacked',
  markSize = 64,
  suffix = 'STUDIO',
  glow = true,
  showMark = true,
  fontSize,
  byline = false,
  className,
  style,
}: PostelLogoProps) {
  const stacked = layout === 'stacked';
  const fs = fontSize ?? Math.max(11, Math.round(markSize * (stacked ? 0.3 : 0.42)));
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        gap: stacked ? Math.round(markSize * 0.22) : Math.round(markSize * 0.3),
        ...style,
      }}
    >
      {showMark && <PostelMark size={markSize} glow={glow} />}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: stacked ? 'center' : 'flex-start', lineHeight: 1 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: fs,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--text-strong)',
            whiteSpace: 'nowrap',
          }}
        >
          <b style={{ fontWeight: 700 }}>POSTEL</b>
          <span style={{ fontWeight: 300, marginLeft: '0.5em', color: suffix === 'OS' ? 'var(--violet-300)' : 'var(--text-strong)' }}>{suffix}</span>
        </span>
        {byline && (
          <span
            style={{
              marginTop: 6,
              fontFamily: 'var(--font-display)',
              fontSize: Math.max(9, Math.round(fs * 0.62)),
              fontWeight: 400,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
            }}
          >
            by Postel Studio
          </span>
        )}
      </div>
    </div>
  );
}

export default PostelLogo;