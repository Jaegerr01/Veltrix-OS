'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from './primitives';
import { VxIcon } from './VxIcon';
import CeoSphere, { type CeoSphereHandle } from './CeoSphere';
import { AGENT_DEFS, STATUS_COLOR } from './agents';

/**
 * Hero "Orbital Command" view — the signature screen. A central animated
 * CEO Agent sphere ringed by orbiting specialist-agent nodes on a tilting
 * 3D stage, with dashed rotating rings, flowing connection lines, and a
 * scanline sweep. Ported from the dashboard hero in the prototype.
 */

const RADIUS = 190;

export default function OrbitalCommand() {
  const router = useRouter();
  const tiltRef = React.useRef({ x: 0, y: 0 });
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });
  const sphereRef = React.useRef<CeoSphereHandle>(null);
  const N = AGENT_DEFS.length;

  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    const next = { x: -py * 12, y: px * 12 };
    tiltRef.current = next;
    setTilt(next);
  };
  const onLeave = () => {
    tiltRef.current = { x: 0, y: 0 };
    setTilt({ x: 0, y: 0 });
  };

  return (
    <section
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="vx-glass"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--grad-panel)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-xl), var(--glow-soft)',
        minHeight: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'vxFadeUp 0.7s var(--ease-out) both',
      }}
    >
      {/* header labels */}
      <div style={{ position: 'absolute', top: 'var(--space-6)', left: 'var(--space-6)', zIndex: 3 }}>
        <div className="vx-eyebrow" style={{ color: 'var(--cyan-300)' }}>
          Orbital Network
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700, color: 'var(--text-strong)', marginTop: 4 }}>
          Your AI Workforce, Always On
        </div>
      </div>
      <div style={{ position: 'absolute', top: 'var(--space-6)', right: 'var(--space-6)', zIndex: 3, display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Badge tone="active" dot>
          8 / 100+ Agents
        </Badge>
        <div
          onClick={() => router.push('/command-center')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 14px',
            borderRadius: 999,
            background: 'var(--grad-brand)',
            color: '#fff',
            fontFamily: 'var(--font-display)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--glow-violet)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ display: 'flex' }}>
            <VxIcon name="plus" size={16} color="#fff" />
          </span>
          Add Agent
        </div>
      </div>

      {/* scanline */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: '40%',
          background: 'linear-gradient(180deg, rgba(34,211,238,0.08), rgba(34,211,238,0))',
          animation: 'vxScan 7s linear infinite',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* stage */}
      <div
        style={{
          position: 'relative',
          width: 480,
          height: 480,
          maxWidth: '90%',
          transform: `perspective(1100px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.18s var(--ease-out)',
        }}
      >
        {/* rings */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: RADIUS * 2 + 40,
            height: RADIUS * 2 + 40,
            borderRadius: '50%',
            border: '1px dashed rgba(139,92,246,0.22)',
            animation: 'vxRingSpin 90s linear infinite',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: RADIUS * 2 - 60,
            height: RADIUS * 2 - 60,
            borderRadius: '50%',
            border: '1px dashed rgba(34,211,238,0.18)',
            animation: 'vxRingSpinRev 70s linear infinite',
          }}
        />

        {/* orbit lines */}
        {AGENT_DEFS.map((_, i) => {
          const angle = -90 + i * (360 / N);
          return (
            <div
              key={`line-${i}`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: RADIUS - 26,
                height: 2,
                background: 'linear-gradient(90deg, rgba(139,92,246,0.65), rgba(139,92,246,0))',
                transformOrigin: 'left center',
                transform: `rotate(${angle}deg)`,
                borderRadius: 2,
                zIndex: 1,
                animation: 'vxLineFlow 3.2s ease-in-out infinite',
                animationDelay: `${i * 0.22}s`,
              }}
            />
          );
        })}

        {/* CEO halo + sphere */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 240,
            height: 240,
            borderRadius: '50%',
            transform: 'translate(-50%,-50%)',
            background: 'var(--grad-halo)',
            filter: 'blur(6px)',
            animation: 'vxHaloBreathe 4.5s ease-in-out infinite',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
        <div
          onClick={() => {
            sphereRef.current?.pulse();
            window.dispatchEvent(new Event('veltrix-toggle-voice'));
          }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
            transform: 'translate(-50%,-50%) translateZ(60px)',
          }}
        >
          <CeoSphere ref={sphereRef} tiltRef={tiltRef} size={240} />
          <span
            style={{
              marginTop: -18,
              fontFamily: 'var(--font-display)',
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.85)',
              textShadow: '0 0 12px rgba(139,92,246,0.8)',
              pointerEvents: 'none',
            }}
          >
            CEO Agent
          </span>
        </div>

        {/* orbit nodes */}
        {AGENT_DEFS.map((a, i) => {
          const angle = -90 + i * (360 / N);
          const rad = (angle * Math.PI) / 180;
          const x = Math.cos(rad) * RADIUS;
          const y = Math.sin(rad) * RADIUS;
          const color = STATUS_COLOR[a.status];
          return (
            <div
              key={a.id}
              onClick={() => router.push('/command-center')}
              style={{
                position: 'absolute',
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
                transform: 'translate(-50%,-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                zIndex: 2,
                animation: `vxNodeFloat ${5 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.35}s`,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: 52,
                  height: 52,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--grad-panel)',
                  border: '1px solid var(--border-default)',
                  boxShadow: `var(--shadow-md), 0 0 18px ${color}22`,
                  backdropFilter: 'var(--blur-sm)',
                }}
              >
                <span style={{ color: 'var(--violet-200)', display: 'flex' }}>
                  <VxIcon name={a.iconName} size={20} />
                </span>
                <span
                  style={{
                    position: 'absolute',
                    right: -3,
                    top: -3,
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: color,
                    border: '2px solid var(--ink-900)',
                    boxShadow: a.status === 'active' ? `0 0 8px ${color}` : 'none',
                    animation: a.status === 'active' ? 'vxDotBlink 2.4s ease-in-out infinite' : 'none',
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.01em',
                }}
              >
                {a.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
