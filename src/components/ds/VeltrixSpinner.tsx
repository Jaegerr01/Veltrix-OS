'use client';

import React from 'react';
import Image from 'next/image';

interface VeltrixSpinnerProps {
  size?: number;
  message?: string;
  className?: string;
}

export function VeltrixSpinner({ size = 56, message, className = '' }: VeltrixSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-6 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Ambient halo breathing beneath */}
        <div
          className="absolute top-1/2 left-1/2 rounded-full opacity-45 pointer-events-none"
          style={{
            width: size * 1.4,
            height: size * 1.4,
            background: 'var(--grad-halo)',
            filter: 'blur(6px)',
            animation: 'vxHaloBreathe 3s ease-in-out infinite',
          }}
        />

        {/* Subtle background ring */}
        <div className="absolute inset-0 rounded-full border border-white/5" />

        {/* Rotating loader.jpeg */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{
            boxShadow: 'var(--glow-violet)',
            border: '1px solid var(--border-default)',
            animation: 'vxRingSpin 6s linear infinite',
          }}
        >
          <Image
            src="/loader.jpeg"
            alt="Loading..."
            fill
            sizes={`${size}px`}
            style={{ objectFit: 'cover' }}
            priority
          />
        </div>
      </div>
      {message && (
        <p className="text-[11px] font-mono tracking-widest text-muted uppercase animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
export default VeltrixSpinner;
