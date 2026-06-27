export default function Sparkline({ data, color = '#a855f7' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const W = 220, H = 56;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - (v / max) * H * 0.82 + H * 0.09,
  ]);
  const polyPts = pts.map(p => p.join(',')).join(' ');
  const areaD   = `M0,${H} L${pts.map(p => p.join(',')).join(' L')} L${W},${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 56 }}>
      <defs>
        <linearGradient id="sparkArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkArea)" />
      <polyline points={polyPts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill={color} />
      ))}
    </svg>
  );
}
