import React from 'react';

interface LeadScoreBadgeProps {
  score: number;
}

export default function LeadScoreBadge({ score }: LeadScoreBadgeProps) {
  const getStyle = () => {
    if (score >= 8.0) {
      return 'bg-neon-green/10 text-neon-green border-neon-green/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
    } else if (score >= 5.0) {
      return 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30';
    } else {
      return 'bg-neon-pink/10 text-neon-pink border-neon-pink/30';
    }
  };

  const getTier = () => {
    if (score >= 8.0) return 'HIGH FIT';
    if (score >= 5.0) return 'MED FIT';
    return 'LOW FIT';
  };

  return (
    <div className="flex items-center space-x-1.5">
      <span className={`px-2 py-0.5 text-xs font-mono font-bold border rounded ${getStyle()}`}>
        {score.toFixed(1)}
      </span>
      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">
        {getTier()}
      </span>
    </div>
  );
}
