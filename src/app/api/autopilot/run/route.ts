import { NextResponse } from 'next/server';
import { runFullPipeline } from '@/lib/agents/pipeline';

// Vercel Cron calls this with a secret header
// Schedule: every 30 minutes — see vercel.json
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Allow: valid cron secret OR local dev (no secret set)
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
