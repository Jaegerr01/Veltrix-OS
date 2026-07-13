'use client';

import React from 'react';

/**
 * Deep-space 3D ambient backdrop: drifting brand orbs, two perspective
 * rings, and a masked perspective grid. Fixed behind the whole app.
 * Ported from the prototype's bgLayer / bgOrbs / bgRing / bgGrid styles.
 */

const ORB_DEFS = [
  { size: 460, top: '-8%', left: '-6%', c1: 'rgba(139,92,246,0.30)', dur: 26 },
  { size: 380, top: '54%', left: '68%', c1: 'rgba(34,211,238,0.22)', dur: 32 },
  { size: 300, top: '72%', left: '8%', c1: 'rgba(217,70,239,0.18)', dur: 29 },
  { size: 240, top: '6%', left: '74%', c1: 'rgba(79,107,255,0.22)', dur: 23 },
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
            animation: `vxOrbDrift ${o.dur}s ease-in-out infinite`,
            animationDelay: `${i * 1.3}s`,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '58%',
          width: 520,
          height: 520,
          borderRadius: '50%',
          border: '1px solid rgba(139,92,246,0.14)',
          transformStyle: 'preserve-3d',
          animation: 'vxSpin3d 60s linear infinite',
          boxShadow: '0 0 40px rgba(139,92,246,0.08) inset',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '58%',
          left: '12%',
          width: 380,
          height: 380,
          borderRadius: '50%',
          border: '1px dashed rgba(34,211,238,0.16)',
          transformStyle: 'preserve-3d',
          animation: 'vxSpin3dRev 48s linear infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: '-20%',
          opacity: 0.35,
          backgroundImage:
            'linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px)',
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
