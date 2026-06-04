'use client';

import React from 'react';
import { ContentIdea } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { FileCode, Globe, Check, Send, Sparkles } from 'lucide-react';

interface ContentIdeaCardProps {
  idea: ContentIdea;
  onUpdateStatus: (id: string, status: ContentIdea['status']) => void;
}

export default function ContentIdeaCard({ idea, onUpdateStatus }: ContentIdeaCardProps) {
  const getPlatformIcon = (platform: string) => {
    return <Globe size={15} className="text-neon-cyan" />;
  };

  return (
    <div className="glass-panel border border-white/5 rounded-xl bg-cyber-bg/30 p-5 flex flex-col justify-between hover:border-neon-cyan/20">
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2 text-neon-cyan">
            {getPlatformIcon(idea.platform)}
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded">
              {idea.platform}
            </span>
          </div>
          <StatusBadge status={idea.status} />
        </div>

        {/* Title */}
        <h4 className="text-sm font-semibold text-foreground mb-2 select-text">{idea.title}</h4>

        {/* Hook */}
        {idea.hook && (
          <div className="my-2.5 p-2 bg-neon-purple/5 border border-neon-purple/10 rounded text-[11px] font-sans text-neon-purple">
            <span className="text-[8px] font-mono uppercase tracking-widest block font-bold mb-0.5">Viral Hook:</span>
            <p className="italic select-text">"{idea.hook}"</p>
          </div>
        )}

        {/* Content body */}
        {idea.content && (
          <p className="text-xs text-muted-foreground font-sans leading-relaxed select-text mt-2 whitespace-pre-line">
            {idea.content}
          </p>
        )}

        {/* Format tag */}
        {idea.content_type && (
          <div className="mt-3 flex items-center space-x-1.5">
            <span className="text-[8px] font-mono text-muted-foreground uppercase">Format:</span>
            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] font-mono text-foreground border border-white/5">
              {idea.content_type}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center mt-5 pt-3 border-t border-white/5 font-mono text-[9px]">
        <span className="text-muted-foreground">CREATED: {new Date(idea.created_at).toLocaleDateString()}</span>
        
        <div className="flex space-x-1">
          {idea.status === 'Idea' && (
            <button
              onClick={() => onUpdateStatus(idea.id, 'Approved')}
              className="px-2 py-1 rounded bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/20 text-neon-purple text-[9px] transition cursor-pointer flex items-center space-x-1"
            >
              <Check size={9} />
              <span>APPROVE</span>
            </button>
          )}
          {idea.status !== 'Posted' && (
            <button
              onClick={() => onUpdateStatus(idea.id, 'Posted')}
              className="px-2 py-1 rounded bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/20 text-neon-green text-[9px] transition cursor-pointer flex items-center space-x-1"
            >
              <Send size={9} />
              <span>MARK POSTED</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
