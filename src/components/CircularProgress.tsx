export default function CircularProgress({ percentage }: { percentage: number }) {
  const r = 50;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percentage, 100) / 100) * circ;
  return (
    <div className="relative w-[120px] h-[120px] flex-shrink-0">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#a855f7" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke="url(#ringGrad)" strokeWidth="9" strokeLinecap="round"
          strokeDasharray={circ}
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1) 0.4s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[22px] font-bold font-mono text-white leading-none">{percentage}%</span>
        <span className="text-[9px] font-mono text-white/30 tracking-wider mt-0.5">of goal</span>
      </div>
    </div>
  );
}
