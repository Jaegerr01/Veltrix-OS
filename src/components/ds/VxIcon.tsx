'use client';

import React from 'react';

/**
 * Line-icon set ported verbatim from the "VELTRIX Command OS" design
 * prototype (ICON_PATHS). Uniform 1.75px stroke, 24-grid, currentColor.
 * These are the exact glyphs the design uses inside agent orbs and chrome.
 */

type El = [string, Record<string, string | number>];

const ICON_PATHS: Record<string, () => El[]> = {
  crown: () => [
    ['polyline', { points: '3,17 5,7 9.5,12 12,5 14.5,12 19,7 21,17' }],
    ['line', { x1: 4, y1: 20, x2: 20, y2: 20 }],
  ],
  mail: () => [
    ['rect', { x: 3, y: 5, width: 18, height: 14, rx: 2 }],
    ['polyline', { points: '3,7 12,13 21,7' }],
  ],
  target: () => [
    ['circle', { cx: 12, cy: 12, r: 9 }],
    ['circle', { cx: 12, cy: 12, r: 5 }],
    ['circle', { cx: 12, cy: 12, r: 1 }],
  ],
  megaphone: () => [
    ['path', { d: 'M3 11v2a2 2 0 0 0 2 2h1l2 6h2l-1.2-6H12l7 3V6l-7 3H6a2 2 0 0 0-2 2z' }],
  ],
  clipboard: () => [
    ['rect', { x: 5, y: 4, width: 14, height: 17, rx: 2 }],
    ['rect', { x: 9, y: 2, width: 6, height: 3, rx: 1 }],
    ['line', { x1: 8, y1: 10, x2: 16, y2: 10 }],
    ['line', { x1: 8, y1: 14, x2: 16, y2: 14 }],
    ['line', { x1: 8, y1: 18, x2: 13, y2: 18 }],
  ],
  headset: () => [
    ['path', { d: 'M4 13a8 8 0 0 1 16 0' }],
    ['rect', { x: 2, y: 13, width: 4, height: 6, rx: 1.5 }],
    ['rect', { x: 18, y: 13, width: 4, height: 6, rx: 1.5 }],
    ['path', { d: 'M20 19v1a3 3 0 0 1-3 3h-3' }],
  ],
  calendar: () => [
    ['rect', { x: 3, y: 5, width: 18, height: 16, rx: 2 }],
    ['line', { x1: 3, y1: 10, x2: 21, y2: 10 }],
    ['line', { x1: 8, y1: 3, x2: 8, y2: 7 }],
    ['line', { x1: 16, y1: 3, x2: 16, y2: 7 }],
  ],
  dollar: () => [
    ['line', { x1: 12, y1: 2, x2: 12, y2: 22 }],
    ['path', { d: 'M17 6.5c0-1.9-2-3-5-3s-5 1.3-5 3.3S9.5 10 12 10.5s5 1.3 5 3.5-2 3.5-5 3.5-5-1.4-5-3.2' }],
  ],
  chartbar: () => [
    ['line', { x1: 5, y1: 20, x2: 5, y2: 12 }],
    ['line', { x1: 12, y1: 20, x2: 12, y2: 6 }],
    ['line', { x1: 19, y1: 20, x2: 19, y2: 15 }],
  ],
  usercheck: () => [
    ['circle', { cx: 9, cy: 8, r: 4 }],
    ['path', { d: 'M2 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5' }],
    ['polyline', { points: '17,11 19,13 22.5,8.5' }],
  ],
  mic: () => [
    ['rect', { x: 9, y: 2, width: 6, height: 12, rx: 3 }],
    ['path', { d: 'M5 11a7 7 0 0 0 14 0' }],
    ['line', { x1: 12, y1: 18, x2: 12, y2: 22 }],
    ['line', { x1: 8, y1: 22, x2: 16, y2: 22 }],
  ],
  camera: () => [
    ['path', { d: 'M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }],
    ['circle', { cx: 12, cy: 12.5, r: 3.5 }],
  ],
  check: () => [
    ['polyline', { points: '4,12 10,18 20,6' }],
  ],
  gem: () => [
    ['path', { d: 'M6 3h12l3 6-9 12L3 9z' }],
    ['path', { d: 'M3 9h18' }],
    ['path', { d: 'M9 3 7.5 9 12 21l4.5-12L15 3' }],
  ],
  brain: () => [
    ['path', { d: 'M9.5 4a2.5 2.5 0 0 0-2.5 2.5A2.5 2.5 0 0 0 5 9a2.5 2.5 0 0 0 1 4 2.5 2.5 0 0 0 3.5 3V4z' }],
    ['path', { d: 'M14.5 4A2.5 2.5 0 0 1 17 6.5 2.5 2.5 0 0 1 19 9a2.5 2.5 0 0 1-1 4 2.5 2.5 0 0 1-3.5 3V4z' }],
  ],
  grid: () => [
    ['rect', { x: 3, y: 3, width: 7, height: 7, rx: 1.5 }],
    ['rect', { x: 14, y: 3, width: 7, height: 7, rx: 1.5 }],
    ['rect', { x: 3, y: 14, width: 7, height: 7, rx: 1.5 }],
    ['rect', { x: 14, y: 14, width: 7, height: 7, rx: 1.5 }],
  ],
  terminal: () => [
    ['polyline', { points: '5,8 9,12 5,16' }],
    ['line', { x1: 12, y1: 16, x2: 19, y2: 16 }],
  ],
  send: () => [
    ['path', { d: 'M22 3 11 14' }],
    ['path', { d: 'M22 3 15 21l-4-7-7-4z' }],
  ],
  briefcase: () => [
    ['rect', { x: 3, y: 7, width: 18, height: 13, rx: 2 }],
    ['path', { d: 'M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }],
  ],
  folder: () => [
    ['path', { d: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }],
  ],
  gear: () => [
    ['circle', { cx: 12, cy: 12, r: 3 }],
    ['path', { d: 'M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1' }],
  ],
  activity: () => [
    ['polyline', { points: '3,12 7,12 10,4 14,20 17,12 21,12' }],
  ],
  doc: () => [
    ['path', { d: 'M6 2h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z' }],
    ['polyline', { points: '14,2 14,7 19,7' }],
  ],
  users: () => [
    ['circle', { cx: 9, cy: 8, r: 3.5 }],
    ['path', { d: 'M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5' }],
    ['path', { d: 'M16 5.5a3.5 3.5 0 0 1 0 6.5M17 20c0-2.5-.8-4.2-2-5.2' }],
  ],
  refresh: () => [
    ['path', { d: 'M4 12a8 8 0 0 1 14-5.3L21 9' }],
    ['polyline', { points: '21,3 21,9 15,9' }],
    ['path', { d: 'M20 12a8 8 0 0 1-14 5.3L3 15' }],
    ['polyline', { points: '3,21 3,15 9,15' }],
  ],
  plus: () => [
    ['line', { x1: 12, y1: 5, x2: 12, y2: 19 }],
    ['line', { x1: 5, y1: 12, x2: 19, y2: 12 }],
  ],
  bell: () => [
    ['path', { d: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7z' }],
    ['path', { d: 'M10 21a2 2 0 0 0 4 0' }],
  ],
  search: () => [
    ['circle', { cx: 11, cy: 11, r: 7 }],
    ['line', { x1: 21, y1: 21, x2: 16.5, y2: 16.5 }],
  ],
  play: () => [
    ['polygon', { points: '6,4 20,12 6,20' }],
  ],
  sparkle: () => [
    ['path', { d: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z' }],
    ['path', { d: 'M19 15l.9 2.4L22 18l-2.1.6L19 21l-.9-2.4L16 18l2.1-.6z' }],
  ],
  branch: () => [
    ['circle', { cx: 6, cy: 6, r: 2.5 }],
    ['circle', { cx: 6, cy: 18, r: 2.5 }],
    ['circle', { cx: 18, cy: 8, r: 2.5 }],
    ['path', { d: 'M6 8.5v7M6 15.5c0-5 12-3 12-7' }],
  ],
  shield: () => [
    ['path', { d: 'M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z' }],
    ['polyline', { points: '9,12 11,14 15,10' }],
  ],
};

export type VxIconName = keyof typeof ICON_PATHS;

export function VxIcon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.75,
  style,
}: {
  name: VxIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}) {
  const build = ICON_PATHS[name] || ICON_PATHS.target;
  const els = build();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {els.map((e, i) => {
        const Tag = e[0] as keyof React.JSX.IntrinsicElements;
        return <Tag key={i} {...(e[1] as Record<string, unknown>)} />;
      })}
    </svg>
  );
}

export default VxIcon;
