'use client';

import React from 'react';

/**
 * Deep-space ambient backdrop: static brand glows + a masked perspective
 * grid, fixed behind the whole app. Motion removed per design rule 2 —
 * the backdrop sets atmosphere; it has no reason to move. The static
 * gradients keep the exact same look at rest, and every section shares
 * this one continuous background (rule 7).
 */

const ORB_DEFS = [
  { size: 520, top: '-10%', left: '-8%', c1: 'rgba(139,92,246,0.34)' },
  { size: 420, top: '54%', left: '68%', c1: 'rgba(177,76,255,0.26)' },
  { size: 320, top: '72%', left: '8%', c1: 'rgba(192,38,211,0.2)' },
  { size: 260, top: '6%', left: '74%', c1: 'rgba(109,40,217,0.3)' },
];

export default function AmbientBackground() {
  return (
    <div
      aria-hidden
      style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none', background: 'var(--bg-space)' }}
    >
      {ORB_DEFS.map((o, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: o.top,
            left: o.left,
            width: o.size,
            height: o.size,
            borderRadius: '50%',
            filter: 'blur(60px)',
            background: `radial-gradient(circle at 40% 40%, ${o.c1}, transparent 70%)`,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          opacity: 0.35,
          backgroundImage:
            'linear-gradient(rgba(177,76,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(177,76,255,0.06) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          transform: 'perspective(600px) rotateX(58deg) translateY(20%) scale(1.6)',
          transformOrigin: 'center top',
          maskImage: 'radial-gradient(ellipse at 50% 30%, #000 20%, transparent 72%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, #000 20%, transparent 72%)',
        }}
      />
    </div>
  );
}
