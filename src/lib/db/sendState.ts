import { supabase, getUserId, safeWrite } from './_core';

export type SendTable = 'outreach_messages' | 'followups' | 'proposals';

/**
 * Atomically move a record to 'Sending' ONLY if it is currently in one of `fromStatuses`.
 * Returns false when another request already claimed it (or it is not in an allowed state),
 * which is what prevents a double-click / retry race from emailing the same lead twice.
 */
export async function claimForSending(table: SendTable, id: string, fromStatuses: string[]): Promise<boolean> {
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from(table)
      .update({ status: 'Sending' })
      .eq('id', id)
      .eq('user_id', userId)
      .in('status', fromStatuses)
      .select('id');
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  }, 'claimForSending');
}
