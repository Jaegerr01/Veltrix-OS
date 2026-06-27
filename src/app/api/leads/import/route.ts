import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';

// Shape the external scraper emits
interface ScrapedLead {
  name: string;
  phone?: string;
  website?: string;
  address?: string;
  vertical?: string;
  location?: string;
  has_website?: boolean;
}

const MAX_BATCH = 100;

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  // Tighter limit for bulk import — 5 batches/min per user
  const rl = checkRateLimit(`import:${auth.user.id}`, { limit: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Rate limit exceeded for bulk import. Try again in a minute.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!Array.isArray(body)) {
    return NextResponse.json(
      { success: false, error: 'Body must be an array of scraped leads.' },
      { status: 400 }
    );
  }

  if (body.length === 0) {
    return NextResponse.json({ success: true, imported: 0, skipped: 0, total: 0, leads: [] });
  }

  if (body.length > MAX_BATCH) {
    return NextResponse.json(
      { success: false, error: `Batch too large. Maximum ${MAX_BATCH} leads per request.` },
      { status: 400 }
    );
  }

  // Validate each item has at least a name
  const invalid = body.findIndex((item: any) => !item?.name || typeof item.name !== 'string');
  if (invalid !== -1) {
    return NextResponse.json(
      { success: false, error: `Item at index ${invalid} is missing required field "name".` },
      { status: 400 }
    );
  }

  const scraped = body as ScrapedLead[];

  // Load existing leads once for dedup check
  const existing = await db.getLeads().catch(() => []);
  const existingKeys = new Set(
    existing.map(l =>
      `${l.business_name.toLowerCase().trim()}|${(l.location ?? '').toLowerCase().trim()}`
    )
  );

  const imported: Awaited<ReturnType<typeof db.addLead>>[] = [];
  let skipped = 0;

  for (const item of scraped) {
    const businessName = item.name.trim();
    const location = (item.location ?? item.address ?? '').trim();
    const dupeKey = `${businessName.toLowerCase()}|${location.toLowerCase()}`;

    if (existingKeys.has(dupeKey)) {
      skipped++;
      continue;
    }

    // Map scraper fields → Lead fields
    const hasWebsite = item.has_website ?? (!!item.website && item.website.trim() !== '');
    const painPoint = hasWebsite
      ? undefined
      : 'No website — high opportunity for AI Website + Brand System';

    try {
      const lead = await db.addLead({
        business_name: businessName,
        phone: item.phone?.trim() || undefined,
        website: item.website?.trim() || undefined,
        industry: item.vertical?.trim() || undefined,
        location: location || undefined,
        pain_point: painPoint,
        lead_score: 0,
        status: 'New',
        source: 'google_maps',
        notes: item.address && item.address !== location
          ? `Address: ${item.address.trim()}`
          : undefined,
      });

      imported.push(lead);
      // Register the new key so later items in same batch can't dupe it
      existingKeys.add(dupeKey);
    } catch (err: any) {
      console.warn(`Failed to insert lead "${businessName}":`, err.message);
      // Don't abort the batch — continue with remaining items
    }
  }

  // Fire scoring for each inserted lead — async, non-blocking
  // Follows the same pattern as api/leads/route.ts
  if (imported.length > 0) {
    (async () => {
      try {
        const { runAutopilotForLead } = await import('@/lib/agents/autopilot');
        for (const lead of imported) {
          await runAutopilotForLead(lead.id);
        }
      } catch (err) {
        console.error('Background scoring failed for imported leads:', err);
      }
    })();
  }

  return NextResponse.json({
    success: true,
    imported: imported.length,
    skipped,
    total: scraped.length,
    leads: imported,
  });
}
