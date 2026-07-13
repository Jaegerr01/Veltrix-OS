import React from 'react';
import { VeltrixSpinner } from '@/components/ds';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Accessing operator console...' }: LoadingStateProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-[9999]"
      style={{
        background: '#060410',
      }}
    >
      <VeltrixSpinner size={80} message={message} />
    </div>
  );
}
