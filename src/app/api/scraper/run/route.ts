import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';
import { runScraper, importScrapedLeads, scraperConfigured } from '@/lib/scraper/run';

// GET /api/scraper/run — is the scraper configured on this machine?
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const check = scraperConfigured();
  return NextResponse.json({ success: true, configured: check.ok, reason: check.reason });
}

// POST /api/scraper/run — Victor (Lead Scout) runs Barry's local Google Maps
// scraper, imports results into the CRM, and (optionally) fires Daniel's
// research chain. Local-only; fails closed in production.
// Body: { niche: string, location: string, limit?: number, research?: boolean }
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  const rl = checkRateLimit(`scraper:${auth.user.id}`, { limit: 3, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit: max 3 scrape runs per minute.' }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const niche = String(body.niche || '').trim();
    const location = String(body.location || '').trim();
    const limit = Math.min(Number(body.limit) || 20, 100);
    const research = body.research !== false;
    const sheets = body.sheets === true;

    if (!niche || !location) {
      return NextResponse.json({ success: false, error: 'niche and location are required.' }, { status: 400 });
    }

    const startedAt = Date.now();
    const result = await runScraper({ niche, location, limit, sheets });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error, raw: result.raw }, { status: 422 });
    }

    let imported: { id: string; business_name: string }[] = [];
    let skipped = 0;

    if (sheets) {
      // Full mode: the scraper wrote Supabase (own dedup) + Google Sheets.
      // Detect the rows it just inserted so we can count + research them.
      const leads = await db.getLeads().catch(() => []);
      imported = leads
        .filter(l => new Date(l.created_at).getTime() >= startedAt - 5000)
        .map(l => ({ id: l.id, business_name: l.business_name }));
      skipped = Math.max(0, result.leads.length - imported.length);
    } else {
      ({ imported, skipped } = await importScrapedLeads(result.leads));
    }

    await db.logAgentAction(
      'Victor (Lead Scout Agent)',
      'Scrape Run',
      `query="${niche} in ${location}", limit=${limit}, sheets=${sheets}`,
      `Imported ${imported.length} new leads, skipped ${skipped} duplicates${sheets ? ' (scraper wrote Supabase + Google Sheets directly)' : ''}.`,
      'Success'
    );

    // Fire Daniel's research chain (non-blocking) — same as paste-import flow
    if (imported.length > 0 && research) {
      (async () => {
        try {
          const { runAutopilotForLead } = await import('@/lib/agents/autopilot');
          for (const lead of imported) {
            await runAutopilotForLead(lead.id);
          }
        } catch (err) {
          console.error('[scout] background research failed:', err);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      scraped: result.leads.length,
      imported: imported.length,
      skipped,
      research: imported.length > 0 && research,
      leads: imported,
    });
  } catch (error: any) {
    console.error('Error in POST /api/scraper/run:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
