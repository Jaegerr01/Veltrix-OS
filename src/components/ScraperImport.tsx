'use client';

import React, { useMemo, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import { X, Upload, FileJson, Radar, CheckCircle2, AlertTriangle, Loader2, Sparkles } from 'lucide-react';

/**
 * ScraperImport — bridge between Barry's Python Google Maps scraper and the
 * pipeline. Paste or drop the scraper's output (JSON or CSV); we map fields
 * flexibly, preview what will be imported, push via /api/leads/import, and
 * optionally hand every imported lead straight to Daniel (Lead Research
 * Agent) so the research → outreach → proposal chain starts immediately.
 */

interface ParsedLead {
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  vertical?: string;
  location?: string;
  has_website?: boolean;
}

// Accept the many field spellings a scraper might emit.
const FIELD_ALIASES: Record<keyof ParsedLead, string[]> = {
  name: ['name', 'business_name', 'businessname', 'title', 'company', 'business'],
  phone: ['phone', 'phone_number', 'phonenumber', 'tel', 'telephone', 'contact_phone'],
  email: ['email', 'e-mail', 'mail', 'contact_email'],
  website: ['website', 'url', 'site', 'web', 'domain', 'website_url'],
  address: ['address', 'full_address', 'street', 'addr'],
  vertical: ['vertical', 'category', 'industry', 'type', 'niche', 'business_type'],
  location: ['location', 'city', 'area', 'region'],
  has_website: ['has_website', 'haswebsite'],
};

function normalizeRecord(raw: Record<string, unknown>): ParsedLead | null {
  const lower: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) lower[k.toLowerCase().trim()] = v;

  const pick = (field: keyof ParsedLead): unknown => {
    for (const alias of FIELD_ALIASES[field]) {
      if (lower[alias] !== undefined && lower[alias] !== null && lower[alias] !== '') return lower[alias];
    }
    return undefined;
  };

  const name = String(pick('name') ?? '').trim();
  if (!name) return null;

  const website = pick('website') ? String(pick('website')).trim() : undefined;
  return {
    name,
    phone: pick('phone') ? String(pick('phone')).trim() : undefined,
    email: pick('email') ? String(pick('email')).trim() : undefined,
    website,
    address: pick('address') ? String(pick('address')).trim() : undefined,
    vertical: pick('vertical') ? String(pick('vertical')).trim() : undefined,
    location: pick('location') ? String(pick('location')).trim() : undefined,
    has_website: pick('has_website') !== undefined ? Boolean(pick('has_website')) : !!website,
  };
}

/** Tolerant CSV parser (quoted fields, commas inside quotes). */
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(v => v.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some(v => v.trim() !== '')) rows.push(row);

  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
}

function parseScraperOutput(text: string): { leads: ParsedLead[]; error?: string } {
  const trimmed = text.trim();
  if (!trimmed) return { leads: [], error: 'Nothing to parse.' };

  // JSON first — array, or object wrapping an array (results/leads/data/items)
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const arr: unknown[] = Array.isArray(parsed)
        ? parsed
        : (parsed.results ?? parsed.leads ?? parsed.data ?? parsed.items ?? []);
      if (!Array.isArray(arr) || arr.length === 0) {
        return { leads: [], error: 'JSON parsed but no lead array found (looked for results/leads/data/items).' };
      }
      const leads = arr
        .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
        .map(normalizeRecord)
        .filter((x): x is ParsedLead => x !== null);
      return leads.length
        ? { leads }
        : { leads: [], error: 'No rows had a recognizable business name field.' };
    } catch (e: any) {
      return { leads: [], error: `Invalid JSON: ${e.message}` };
    }
  }

  // CSV fallback
  const records = parseCsv(trimmed);
  if (!records.length) return { leads: [], error: 'Could not parse as JSON or CSV.' };
  const leads = records.map(normalizeRecord).filter((x): x is ParsedLead => x !== null);
  return leads.length
    ? { leads }
    : { leads: [], error: 'CSV parsed but no rows had a recognizable business name column.' };
}

interface Props {
  onClose: () => void;
  onImported: () => void;
}

export default function ScraperImport({ onClose, onImported }: Props) {
  const [rawText, setRawText] = useState('');
  const [autoResearch, setAutoResearch] = useState(true);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState('');
  const [done, setDone] = useState<{ imported: number; skipped: number; researched: number } | null>(null);
  const [error, setError] = useState('');

  const parsed = useMemo(() => parseScraperOutput(rawText), [rawText]);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setRawText(String(reader.result || ''));
    reader.readAsText(file);
  };

  const runImport = async () => {
    if (!parsed.leads.length) return;
    setImporting(true);
    setError('');
    try {
      // Import in batches of 100 (API limit). The server kicks off Daniel's
      // research chain in the background for every imported lead unless the
      // checkbox is off (?research=off).
      let imported = 0, skipped = 0;
      const endpoint = `/api/leads/import${autoResearch ? '' : '?research=off'}`;
      for (let i = 0; i < parsed.leads.length; i += 100) {
        const batch = parsed.leads.slice(i, i + 100);
        setProgress(`Importing leads ${i + 1}–${Math.min(i + 100, parsed.leads.length)} of ${parsed.leads.length}…`);
        const res = await authFetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batch),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error || 'Import failed');
        imported += json.imported ?? 0;
        skipped += json.skipped ?? 0;
      }

      setDone({ imported, skipped, researched: 0 });
      setProgress('');
      onImported();
    } catch (e: any) {
      setError(e.message || 'Import failed');
      setProgress('');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-panel w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radar size={18} className="text-neon-cyan" />
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">Fetch Leads — Scraper Import</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Paste or drop the output of your Google Maps scraper (JSON or CSV)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground cursor-pointer" aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {done ? (
          /* ── Success state ── */
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 size={40} className="text-neon-green mx-auto" />
            <p className="text-foreground font-semibold">
              {done.imported} lead{done.imported === 1 ? '' : 's'} pushed to the pipeline
            </p>
            <p className="text-xs text-muted-foreground">
              {done.skipped > 0 && `${done.skipped} duplicate${done.skipped === 1 ? '' : 's'} skipped. `}
              {autoResearch
                ? 'Daniel (Lead Research) is researching them in the background — scores and statuses will update live.'
                : 'Research is off — trigger it per lead from the table, or flip Autopilot on.'}
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 bg-neon-cyan hover:bg-neon-cyan/85 text-black rounded-lg text-xs font-mono font-bold cursor-pointer"
            >
              VIEW PIPELINE
            </button>
          </div>
        ) : (
          <>
            {/* Input area */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            >
              <textarea
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={'Paste scraper output here, or drop the .json / .csv file…\n\nExample JSON row:\n[{"name": "Bright Smile Dental", "phone": "+1 …", "website": "https://…", "address": "…", "category": "Dentist"}]'}
                className="w-full h-44 bg-white/[0.04] border border-white/10 rounded-xl p-3.5 text-xs font-mono text-foreground placeholder:text-white/25 focus:outline-none focus:border-neon-cyan/60 resize-y"
                spellCheck={false}
              />
              <div className="flex items-center justify-between mt-2">
                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-muted-foreground cursor-pointer transition">
                  <Upload size={13} />
                  <span>Load file</span>
                  <input
                    type="file"
                    accept=".json,.csv,.txt"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </label>
                {rawText && (
                  <span className={`text-xs font-mono flex items-center gap-1.5 ${parsed.leads.length ? 'text-neon-green' : 'text-neon-orange'}`}>
                    {parsed.leads.length
                      ? <><FileJson size={13} /> {parsed.leads.length} lead{parsed.leads.length === 1 ? '' : 's'} detected</>
                      : <><AlertTriangle size={13} /> {parsed.error}</>}
                  </span>
                )}
              </div>
            </div>

            {/* Preview */}
            {parsed.leads.length > 0 && (
              <div className="border border-white/10 rounded-xl overflow-hidden">
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-white/[0.05] sticky top-0">
                      <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-3 py-2">Business</th>
                        <th className="px-3 py-2">Contact</th>
                        <th className="px-3 py-2">Website</th>
                        <th className="px-3 py-2">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.leads.slice(0, 50).map((l, i) => (
                        <tr key={i} className="border-t border-white/[0.05] text-foreground/85">
                          <td className="px-3 py-1.5 font-medium">{l.name}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{l.email || l.phone || '—'}</td>
                          <td className="px-3 py-1.5 text-muted-foreground truncate max-w-[180px]">{l.website || '—'}</td>
                          <td className="px-3 py-1.5 text-muted-foreground">{l.vertical || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsed.leads.length > 50 && (
                  <div className="px-3 py-1.5 text-[10px] font-mono text-muted-foreground bg-white/[0.03]">
                    +{parsed.leads.length - 50} more…
                  </div>
                )}
              </div>
            )}

            {/* Options + submit */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoResearch}
                  onChange={e => setAutoResearch(e.target.checked)}
                  className="accent-[#a855f7] w-3.5 h-3.5"
                />
                <span className="text-xs text-foreground/85 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-neon-purple" />
                  Start research automatically (Daniel scores &amp; qualifies the first 10 now)
                </span>
              </label>

              <button
                onClick={runImport}
                disabled={!parsed.leads.length || importing}
                className="px-5 py-2.5 bg-neon-purple hover:bg-neon-purple/85 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer shadow-[0_0_14px_rgba(168,85,247,0.25)]"
              >
                {importing ? <Loader2 size={14} className="animate-spin" /> : <Radar size={14} />}
                <span>{importing ? (progress || 'IMPORTING…') : `PUSH ${parsed.leads.length || ''} TO PIPELINE`}</span>
              </button>
            </div>

            {error && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertTriangle size={13} /> {error}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
