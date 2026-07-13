import React from 'react';
import { VeltrixSpinner } from '@/components/ds';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Accessing mainframe data...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12">
      <VeltrixSpinner size={64} message={message} />
    </div>
  );
}

