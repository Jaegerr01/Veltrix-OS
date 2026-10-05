'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from './primitives';
import { VxIcon } from './VxIcon';
import CeoSphere, { type CeoSphereHandle } from './CeoSphere';
import { AGENT_ICONS } from './agents';
import { useAgentRoster } from '../useAgentRoster';
import { clickable } from '@/lib/a11y';

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
  // Live roster: status/metrics come from the tasks table (no seeded numbers).
  const { agents: roster } = useAgentRoster();
  const AGENT_DEFS = roster.map((a) => ({ ...a, iconName: (AGENT_ICONS[a.id] ?? 'sparkle') as import('./VxIcon').VxIconName }));
  const N = AGENT_DEFS.length;

  const [voiceState, setVoiceState] = React.useState({ isListening: false, isSpeaking: false });

  React.useEffect(() => {
    const handleVoiceStatus = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setVoiceState({ isListening: !!detail.isListening, isSpeaking: !!detail.isSpeaking });
      }
    };
    window.addEventListener('postelos-voice-status', handleVoiceStatus as EventListener);
    return () => window.removeEventListener('postelos-voice-status', handleVoiceStatus as EventListener);
  }, []);

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
          {N} agents, coordinated by the CEO
        </div>
      </div>
      <div style={{ position: 'absolute', top: 'var(--space-6)', right: 'var(--space-6)', zIndex: 3, display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Badge tone="active" dot>
          {AGENT_DEFS.filter((a) => a.status === 'busy').length} working now
        </Badge>
        <div
          {...clickable(() => router.push('/ceo'))}
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
          Open CEO Console
        </div>
      </div>

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
        {/* rings - static hairlines; the orbit structure is the meaning, spin added none */}
        <div className="vx-orbit__ring vx-orbit__ring--outer" />
        <div className="vx-orbit__ring vx-orbit__ring--inner" />

        {/* orbit lines - static; they show which agents connect to ARIA */}
        {AGENT_DEFS.map((_, i) => (
          <div key={`line-${i}`} className="vx-orbit__line" style={{ transform: `rotate(${-90 + i * (360 / N)}deg)` }} />
        ))}

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
            background: voiceState.isListening
              ? 'radial-gradient(circle, rgba(196,123,255,0.5) 0%, rgba(196,123,255,0) 70%)'
              : voiceState.isSpeaking
              ? 'radial-gradient(circle, rgba(192,38,211,0.5) 0%, rgba(192,38,211,0) 70%)'
              : 'var(--grad-halo)',
            filter: 'blur(8px)',
            /* Halo only animates when it means something: ARIA listening/speaking.
               Idle = static glow (rule 2). */
            animation: voiceState.isListening || voiceState.isSpeaking
              ? 'vxHaloBreathe 1.2s ease-in-out infinite'
              : 'none',
            zIndex: 1,
            pointerEvents: 'none',
            transition: 'background 0.3s ease',
          }}
        />
        <div
          role="button"
          tabIndex={0}
          onClick={() => { sphereRef.current?.pulse(); window.dispatchEvent(new Event('postelos-toggle-voice')); }}
          onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); sphereRef.current?.pulse(); window.dispatchEvent(new Event('postelos-toggle-voice')); } }}
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
              textShadow: '0 0 12px rgba(177,76,255,0.9)',
              pointerEvents: 'none',
            }}
          >
            {voiceState.isSpeaking ? 'ARIA TRANSMITTING' : voiceState.isListening ? 'ARIA LISTENING' : 'ARIA'}
          </span>
        </div>

        {/* orbit nodes: layout lives in ui.css (.vx-orbit__*); only the computed position is inline */}
        {AGENT_DEFS.map((a, i) => {
          const rad = ((-90 + i * (360 / N)) * Math.PI) / 180;
          return (
            <div
              key={a.id}
              className="vx-orbit__node"
              title={`${a.role} - ${a.metric} done`}
              {...clickable(() => router.push('/ceo'))}
              style={{ left: `calc(50% + ${Math.cos(rad) * RADIUS}px)`, top: `calc(50% + ${Math.sin(rad) * RADIUS}px)` }}
            >
              <div className="vx-orbit__orb">
                <span className="vx-orbit__icon">
                  <VxIcon name={a.iconName} size={20} />
                </span>
                <span className="vx-orbit__dot" data-status={a.status} />
              </div>
              <span className="vx-orbit__label">{a.name}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
