import React from 'react';
import { Database } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ title = 'No Data Available', description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 glass-panel neon-border-purple border-dashed rounded-lg bg-cyber-bg/40 max-w-md mx-auto my-4">
      <div className="p-4 rounded-full bg-neon-purple/10 text-neon-purple mb-4">
        <Database size={32} className="animate-pulse-glow" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-neon-purple hover:bg-neon-purple/80 text-white rounded text-sm transition font-medium neon-glow-purple cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
