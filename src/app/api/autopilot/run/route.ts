import { checkCronAuth } from '@/lib/auth/cron';
import { NextResponse } from 'next/server';
import { runFullPipeline } from '@/lib/agents/pipeline';

// Vercel Cron calls this with a secret header
// Schedule: every 30 minutes — see vercel.json
export async function GET(req: Request) {
  // Constant-time bearer check; fails closed in production when CRON_SECRET is unset.
  const gate = checkCronAuth(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  try {
    console.log('[Autopilot] Pipeline run triggered');
    const result = await runFullPipeline();

    return NextResponse.json({
      success: true,
      startedAt: result.startedAt,
      leadsProcessed: result.leadsProcessed,
      actionsExecuted: result.actionsExecuted,
      errors: result.errors,
      durationMs: result.duration
    });
  } catch (err: any) {
    console.error('[Autopilot] Pipeline run failed:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// Also support POST for manual dashboard triggers
export async function POST(req: Request) {
  return GET(req);
}
