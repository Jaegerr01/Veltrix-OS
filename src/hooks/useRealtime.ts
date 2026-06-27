'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useRealtime(table: string, onUpdate: () => void) {
  const isDbOnline = !!supabase;

  useEffect(() => {
    if (!isDbOnline) return;

    const channel = supabase
      .channel(`realtime-sync-${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onUpdate, isDbOnline]);
}
