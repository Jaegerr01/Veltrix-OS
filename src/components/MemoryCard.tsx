import React from 'react';
import { Memory } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { Brain, Star } from 'lucide-react';

interface MemoryCardProps {
  memory: Memory;
}

export default function MemoryCard({ memory }: MemoryCardProps) {
  // Render stars representing importance level (1-10, scale down to 5 stars)
  const renderImportance = (score: number) => {
    const starsCount = Math.round(score / 2);
    return (
      <div className="flex items-center space-x-0.5 text-neon-orange" title={`Importance: ${score}/10`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={11} fill={i < starsCount ? 'currentColor' : 'none'} className="opacity-80" />
        ))}
      </div>
    );
  };

  return (
    <div className="glass-panel border border-white/5 rounded-xl bg-cyber-bg/30 p-5 flex flex-col justify-between hover:border-neon-purple/20">
      <div>
        {/* Header: Type and Importance */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2 text-neon-purple">
            <Brain size={15} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neon-purple bg-neon-purple/10 px-2 py-0.5 rounded">
              {memory.type}
            </span>
          </div>
          {renderImportance(memory.importance)}
        </div>

        {/* Content */}
        <p className="text-xs text-foreground font-sans leading-relaxed mb-4 select-text">
          {memory.content}
        </p>
      </div>

      {/* Metadata Footer */}
      <div className="flex flex-col space-y-2 border-t border-white/5 pt-3">
        {/* Tags */}
        {memory.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {memory.tags.map((tag, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-white/2 text-[9px] font-mono text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground">
          <span>SOURCE: {memory.source.toUpperCase()}</span>
          <span>{new Date(memory.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
