import { db } from '../db';

/**
 * Victor (Lead Scout Agent) — bridge to Barry's local Google Maps scraper
 * (veltrix_maps_scraper.py v3: ratings-aware scoring, email extraction,
 * retries + jittered delays, per-day CSV output).
 *
 * Real contract (verified 2026-07-12):
 *   python veltrix_maps_scraper.py "<niche>" "<location>" --max <n> [--csv-only] [--no-email]
 *   Output: a clean per-day CSV file (12 columns) in the script's folder.
 *
 * We ALWAYS pass --csv-only: in that mode the script never constructs its
 * Supabase/Sheets clients, so Command OS remains the single write path into
 * the CRM (our import below does the dedup). This also sidesteps the Google
 * Sheets token entirely.
 *
 * Local-dev only; fails CLOSED in production (same precedent as /api/test-supabase).
 *
 * Env (.env.local) — all optional, sensible defaults baked in:
 *   SCRAPER_SCRIPT=C:\Users\H.H\.local\bin\veltrix_maps_scraper.py
 *   SCRAPER_PYTHON=python
 *   SCRAPER_NO_EMAIL=true        (skip email extraction — faster, lower yield)
 */

const DEFAULT_SCRIPT = 'C:\\Users\\H.H\\.local\\bin\\veltrix_maps_scraper.py';

export interface ScrapedLead {
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  vertical?: string;
  location?: string;
  rating?: string;
  reviews?: string;
  has_website?: boolean;
}

export interface ScraperResult {
  ok: boolean;
  leads: ScrapedLead[];
  csvFile?: string;
  raw?: string;
  error?: string;
}

const TIMEOUT_MS = 10 * 60_000; // scrapes with email extraction are slow — 10 min

export function scraperConfigured(): { ok: boolean; reason?: string; script?: string } {
  if (process.env.NODE_ENV === 'production') {
    return { ok: false, reason: 'Scraper runs are local-only (dev machine). Use Paste Import in production.' };
  }
  const script = process.env.SCRAPER_SCRIPT || DEFAULT_SCRIPT;
  return { ok: true, script };
}

// ── Minimal RFC-4180 CSV parser (handles quoted fields with commas/newlines) ──
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(f => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some(f => f.trim() !== '')) rows.push(row); }
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
}

/** Map the scraper's CSV columns → our lead shape (tolerant of header spellings). */
function normalize(item: Record<string, string>): ScrapedLead | null {
  const pick = (...keys: string[]) => {
    for (const k of keys) if (item[k]) return item[k];
    return undefined;
  };
  const name = pick('name', 'business_name', 'title', 'business');
  if (!name) return null;
  return {
    name,
    phone: pick('phone', 'phone_number'),
    email: pick('email'),
    website: pick('website', 'site', 'url'),
    address: pick('address', 'full_address', 'formatted_address'),
    vertical: pick('category', 'vertical', 'type', 'niche'),
    location: pick('city', 'location'),
    rating: pick('rating', 'stars'),
    reviews: pick('reviews', 'review_count', 'reviews_count'),
  };
}

/**
 * sheets=true → omit --csv-only: the scraper itself writes Supabase (own
 * dedup) AND Google Sheets. In that mode the caller must NOT run
 * importScrapedLeads (double-write); detect new leads from the DB instead.
 * Requires a live Google token — run one small scrape in a terminal first to
 * approve the consent screen if the token has expired.
 */
export async function runScraper(opts: { niche: string; location: string; limit?: number; sheets?: boolean }): Promise<ScraperResult> {
  const check = scraperConfigured();
  if (!check.ok) return { ok: false, leads: [], error: check.reason };

  const { niche, location, limit = 20, sheets = false } = opts;
  const script = check.script!;
  const python = process.env.SCRAPER_PYTHON || 'python';

  const path = await import('node:path');
  const fs = await import('node:fs/promises');
  const { execFile } = await import('node:child_process');

  const scriptDir = path.dirname(script);
  const startedAt = Date.now();

  const args = [script, niche, location, '--max', String(Math.min(limit, 100))];
  if (!sheets) args.push('--csv-only'); // csv-only = OS is the single write path
  if (process.env.SCRAPER_NO_EMAIL === 'true') args.push('--no-email');

  const stdout: string = await new Promise((resolve, reject) => {
    execFile(
      python,
      args,
      { timeout: TIMEOUT_MS, maxBuffer: 20 * 1024 * 1024, windowsHide: true, cwd: scriptDir },
      (err, out, stderr) => {
        if (err) reject(new Error(`Scraper failed: ${err.message}${stderr ? ` — ${String(stderr).slice(0, 400)}` : ''}`));
        else resolve(String(out));
      }
    );
  });

  // Find the per-day CSV the run produced/updated (newest .csv touched since start)
  let csvFile: string | undefined;
  try {
    const entries = await fs.readdir(scriptDir);
    let newest: { file: string; mtime: number } | null = null;
    for (const e of entries) {
      if (!e.toLowerCase().endsWith('.csv')) continue;
      const st = await fs.stat(path.join(scriptDir, e));
      if (st.mtimeMs >= startedAt - 2000 && (!newest || st.mtimeMs > newest.mtime)) {
        newest = { file: path.join(scriptDir, e), mtime: st.mtimeMs };
      }
    }
    csvFile = newest?.file;
  } catch { /* fall through */ }

  if (!csvFile) {
    if (sheets) {
      // Full mode wrote Supabase + Sheets itself; CSV is best-effort here.
      return { ok: true, leads: [], raw: stdout.slice(0, 1000) };
    }
    return { ok: false, leads: [], raw: stdout.slice(0, 1000), error: 'Run finished but no fresh CSV found next to the scraper. Check its output folder.' };
  }

  const csvText = await fs.readFile(csvFile, 'utf-8');
  const records = parseCsv(csvText);
  const leads = records.map(normalize).filter((l): l is ScrapedLead => !!l);

  return { ok: true, leads, csvFile };
}

/** Import scraped leads into the CRM — same mapping + dedup as /api/leads/import. */
export async function importScrapedLeads(scraped: ScrapedLead[], sourceLabel = 'google_maps_scout') {
  const existing = await db.getLeads().catch(() => []);
  const keys = new Set(existing.map(l => `${l.business_name.toLowerCase().trim()}|${(l.location ?? '').toLowerCase().trim()}`));

  const imported: { id: string; business_name: string }[] = [];
  let skipped = 0;

  for (const item of scraped) {
    const businessName = item.name.trim();
    const location = (item.location ?? item.address ?? '').trim();
    const key = `${businessName.toLowerCase()}|${location.toLowerCase()}`;
    if (keys.has(key)) { skipped++; continue; }

    const hasWebsite = item.has_website ?? (!!item.website && item.website.trim() !== '');
    const extraNotes: string[] = [];
    if (item.address && item.address !== location) extraNotes.push(`Address: ${item.address.trim()}`);
    if (item.rating) extraNotes.push(`Google rating: ${item.rating}${item.reviews ? ` (${item.reviews} reviews)` : ''}`);

    try {
      const lead = await db.addLead({
        business_name: businessName,
        phone: item.phone?.trim() || undefined,
        email: item.email?.trim() || undefined,
        website: item.website?.trim() || undefined,
        industry: item.vertical?.trim() || undefined,
        location: location || undefined,
        pain_point: hasWebsite ? undefined : 'No website — high opportunity for AI Website + Brand System',
        lead_score: 0,
        status: 'New',
        source: sourceLabel,
        notes: extraNotes.length ? extraNotes.join('\n') : undefined,
      });
      imported.push({ id: lead.id, business_name: lead.business_name });
      keys.add(key);
    } catch (err: any) {
      console.warn(`[scout] failed to insert "${businessName}":`, err.message);
    }
  }

  return { imported, skipped };
}
