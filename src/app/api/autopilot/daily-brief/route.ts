import { NextResponse } from 'next/server';
import { generateDailyBrief } from '@/lib/agents/pipeline';

// Vercel Cron: 0 22 * * * (10PM every day)
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Daily Brief] Generating 10PM brief...');
    const brief = await generateDailyBrief();

    return NextResponse.json({
      success: true,
      brief,
      generatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[Daily Brief] Failed:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
