import { Skeleton } from '@/components/ds';

/** Designed loading state that mirrors the real page rhythm (title, stat tiles, two cards), so nothing jumps when data arrives. */
export default function PageSkeleton({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="vx-stack" role="status" aria-busy="true" aria-live="polite">
      <span className="vx-sr-only">{label}</span>
      <div className="vx-pagehead" aria-hidden="true"><div><Skeleton width={260} height={28} /><div style={{ height: 8 }} /><Skeleton width={340} height={14} /></div></div>
      <div className="vx-grid vx-grid--stats" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="vx-stat"><Skeleton width="55%" height={12} /><Skeleton width="35%" height={28} /><Skeleton width="70%" height={12} /></div>
        ))}
      </div>
      <div className="vx-grid vx-grid--2" aria-hidden="true">
        <div className="vx-card"><Skeleton width="40%" height={18} /><div style={{ height: 14 }} /><Skeleton height={64} /><div style={{ height: 10 }} /><Skeleton height={64} /></div>
        <div className="vx-card"><Skeleton width="40%" height={18} /><div style={{ height: 14 }} /><Skeleton height={64} /><div style={{ height: 10 }} /><Skeleton height={64} /></div>
      </div>
    </div>
  );
}
