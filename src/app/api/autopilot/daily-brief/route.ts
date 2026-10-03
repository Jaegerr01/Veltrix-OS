import { checkCronAuth } from '@/lib/auth/cron';
import { NextResponse } from 'next/server';
import { generateDailyBrief } from '@/lib/agents/pipeline';
import { journalToVault } from '@/lib/db/vault';

// Vercel Cron: 0 22 * * * (10PM every day)
export async function GET(req: Request) {
  // Constant-time bearer check; fails closed in production when CRON_SECRET is unset.
  const gate = checkCronAuth(req);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  try {
    console.log('[Daily Brief] Generating 10PM brief...');
    const brief = await generateDailyBrief();
    // File the brief in the Memory Vault (best effort; failure never fails the brief).
    const day = new Date().toISOString().slice(0, 10);
    await journalToVault({ title: `Daily Brief ${day}`, folder: 'Daily Briefs', body: String(brief), tags: ['daily-brief'], agent: 'ceo' });

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
