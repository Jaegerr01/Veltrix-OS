import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Accessing mainframe data...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative w-12 h-12">
        {/* Cyber spinner */}
        <div className="absolute inset-0 rounded-full border-4 border-neon-purple/10 border-t-neon-purple animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-neon-cyan/10 border-b-neon-cyan animate-spin [animation-direction:reverse]" />
      </div>
      <p className="text-sm font-mono text-neon-cyan animate-pulse-glow">{message}</p>
    </div>
  );
}
