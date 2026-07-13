'use client';

import React from 'react';

/**
 * CEO Agent — animated particle sphere (fibonacci lattice, tri-color
 * cyan→violet→magenta by latitude, additive blend). Ported from the
 * prototype's _startCeo / ceoCanvasRef canvas routine. Pointer-steered,
 * click to pulse, and coupled to the hero's orbital tilt via `tiltRef`.
 */

export interface CeoSphereHandle {
  pulse: () => void;
}

const CeoSphere = React.forwardRef<
  CeoSphereHandle,
  { tiltRef?: React.RefObject<{ x: number; y: number }>; size?: number }
>(function CeoSphere({ tiltRef, size = 240 }, ref) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const stateRef = React.useRef<{ pulse: number; spin: number } | null>(null);

  React.useImperativeHandle(ref, () => ({
    pulse: () => {
      const c = stateRef.current;
      if (!c) return;
      c.pulse = 1;
      c.spin += 0.16;
    },
  }));

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width,
      H = canvas.height,
      cx = W / 2,
      cy = H / 2;
    const N = 1100,
      R = W * 0.34;

    // fibonacci sphere
    const pts: { x: number; y: number; z: number; s: number; p: number }[] = [];
    const gold = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = gold * i;
      pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, s: Math.random() * 0.6 + 0.7, p: Math.random() * Math.PI * 2 });
    }

    const c = {
      rotX: -0.35,
      rotY: 0,
      spin: 0,
      hover: 0,
      targetHover: 0,
      pulse: 0,
      mx: 0,
      my: 0,
      t: 0,
    };
    stateRef.current = c as unknown as { pulse: number; spin: number };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      c.mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      c.my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onEnter = () => {
      c.targetHover = 1;
    };
    const onLeave = () => {
      c.targetHover = 0;
      c.mx = 0;
      c.my = 0;
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerenter', onEnter);
    canvas.addEventListener('pointerleave', onLeave);

    // tri-color gradient cyan -> violet -> magenta by vertical position
    const col = (t: number) => {
      const stops = [
        [34, 211, 238],
        [139, 92, 246],
        [217, 70, 239],
      ];
      const seg = t * 2,
        i = Math.min(1, Math.floor(seg)),
        f = seg - i;
      const a = stops[i],
        b = stops[i + 1];
      return [
        Math.round(a[0] + (b[0] - a[0]) * f),
        Math.round(a[1] + (b[1] - a[1]) * f),
        Math.round(a[2] + (b[2] - a[2]) * f),
      ];
    };

    let raf = 0;
    const loop = () => {
      c.t += 0.016;
      c.hover += (c.targetHover - c.hover) * 0.08;
      c.pulse *= 0.92;
      const tilt = tiltRef?.current || { x: 0, y: 0 };
      const tiltX = tilt.x / 40,
        tiltY = tilt.y / 40;
      c.rotY += 0.0032 + c.spin + (c.mx * 0.03 + tiltY * 0.02);
      c.rotX += (-0.35 + c.my * 0.5 + tiltX * 0.3 - c.rotX) * 0.05;
      c.spin *= 0.9;
      const scale = 1 + c.hover * 0.12 + c.pulse * 0.18;
      const cosX = Math.cos(c.rotX),
        sinX = Math.sin(c.rotX);
      const cosY = Math.cos(c.rotY),
        sinY = Math.sin(c.rotY);

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const arr: { x: number; y: number; z: number; i: number }[] = [];
      for (let i = 0; i < N; i++) {
        const pt = pts[i];
        const wob = 1 + Math.sin(c.t * 1.6 + pt.p) * 0.04 + c.pulse * 0.1;
        const x = pt.x * R * wob * scale,
          y = pt.y * R * wob * scale,
          z = pt.z * R * wob * scale;
        const x1 = x * cosY - z * sinY,
          z1 = x * sinY + z * cosY;
        const y1 = y * cosX - z1 * sinX,
          z2 = y * sinX + z1 * cosX;
        arr.push({ x: x1, y: y1, z: z2, i });
      }
      arr.sort((a, b) => a.z - b.z);
      for (const p of arr) {
        const pt = pts[p.i];
        const depth = (p.z + R) / (2 * R);
        const vt = (pt.y + 1) / 2;
        const [r, g, b] = col(vt);
        const alpha = 0.22 + depth * 0.78;
        const sz = pt.s * (0.7 + depth * 1.9) * (1 + c.hover * 0.25);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.arc(cx + p.x, cy + p.y, sz, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerenter', onEnter);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [tiltRef]);

  return (
    <canvas
      ref={canvasRef}
      width={480}
      height={480}
      style={{ width: size, height: size, display: 'block', cursor: 'pointer' }}
    />
  );
});

export default CeoSphere;
