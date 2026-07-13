'use client';

// Victor (Lead Scout Agent) — dashboard control for Barry's local Google Maps
// scraper. Runs are local-dev only; the panel says so when unavailable.

import { useEffect, useState } from 'react';
import { Radar, Play, Loader2 } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { useToast } from '@/components/Toast';

const NICHES = ['Dental clinic', 'Real estate agency', 'Law firm', 'Chiropractor', 'Plumber', 'HVAC contractor'];

export default function ScraperControl() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [reason, setReason] = useState('');
  const [niche, setNiche] = useState(NICHES[0]);
  const [location, setLocation] = useState('');
  const [limit, setLimit] = useState(20);
  const [research, setResearch] = useState(true);
  const [sheets, setSheets] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState('');
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch('/api/scraper/run');
        const data = await res.json();
        setConfigured(!!data.configured);
        setReason(data.reason || '');
      } catch {
        setConfigured(false);
        setReason('Could not reach the scraper endpoint.');
      }
    })();
  }, []);

  const run = async () => {
    if (!location.trim()) { toast.warning('Location required', 'e.g. "Austin, TX"'); return; }
    setRunning(true);
    setLastRun('');
    try {
      const res = await authFetch('/api/scraper/run', {
        method: 'POST',
        body: JSON.stringify({ niche, location: location.trim(), limit, research, sheets }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = `Scraped ${data.scraped} · imported ${data.imported} new · skipped ${data.skipped} dupes${data.research ? ' · Daniel researching' : ''}`;
        setLastRun(msg);
        toast.success('Victor: scrape complete', msg);
      } else {
        toast.error('Scrape failed', data.error);
        setLastRun(`Failed: ${data.error}`);
      }
    } catch (e: any) {
      toast.error('Scrape failed', e?.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[rgba(13,13,22,0.55)] backdrop-blur-xl border border-white/[0.07] p-5 flex flex-col gap-4">
      <div>
        <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">Victor · Lead Scout</p>
        <h3 className="text-[15px] font-bold text-white mt-1 flex items-center gap-2">
          <Radar size={15} className="text-neon-cyan" />
          Lead Scraper Control
        </h3>
      </div>

      {configured === false && (
        <div className="rounded-lg bg-amber-400/5 border border-amber-400/20 p-3 text-[11px] text-amber-200/70 font-sans">
          {reason || 'Scraper not available.'}
          {reason.includes('SCRAPER_SCRIPT') && (
            <span className="block mt-1 text-white/40">Add to .env.local: <code className="text-neon-cyan">SCRAPER_SCRIPT=E:\path\to\scraper.py</code></span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <div className="col-span-1">
          <label className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Niche</label>
          <select
            value={niche}
            onChange={e => setNiche(e.target.value)}
            className="w-full mt-1 rounded-lg bg-black/40 border border-white/[0.1] px-2.5 py-2 text-[12px] text-white/80 focus:outline-none focus:border-neon-cyan/50 cursor-pointer"
          >
            {NICHES.map(n => <option key={n} value={n} className="bg-[#0e0e1a]">{n}</option>)}
          </select>
        </div>
        <div className="col-span-1">
          <label className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Location</label>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Austin, TX"
            className="w-full mt-1 rounded-lg bg-black/40 border border-white/[0.1] px-2.5 py-2 text-[12px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-neon-cyan/50"
          />
        </div>
        <div className="col-span-1">
          <label className="text-[9px] font-mono text-white/30 uppercase tracking-wider">Max leads</label>
          <input
            type="number" min={1} max={100}
            value={limit}
            onChange={e => setLimit(Math.min(100, Math.max(1, Number(e.target.value) || 20)))}
            className="w-full mt-1 rounded-lg bg-black/40 border border-white/[0.1] px-2.5 py-2 text-[12px] text-white/80 focus:outline-none focus:border-neon-cyan/50"
          />
        </div>
        <div className="col-span-1 flex flex-col justify-end gap-1.5 pb-1">
          <label className="flex items-center gap-2 text-[11px] font-mono text-white/45 cursor-pointer select-none">
            <input type="checkbox" checked={research} onChange={e => setResearch(e.target.checked)} className="accent-[#a855f7]" />
            Auto-research (Daniel)
          </label>
          <label className="flex items-center gap-2 text-[11px] font-mono text-white/45 cursor-pointer select-none">
            <input type="checkbox" checked={sheets} onChange={e => setSheets(e.target.checked)} className="accent-[#06b6d4]" />
            Write to Google Sheets
          </label>
        </div>
      </div>

      <button
        onClick={run}
        disabled={running || configured === false}
        className="flex items-center justify-center gap-2 text-[12px] font-mono font-bold text-black bg-neon-cyan hover:bg-neon-cyan/80 px-4 py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
        {running ? 'SCOUTING… (can take minutes)' : 'RUN SCRAPE'}
      </button>

      {lastRun && (
        <p className="text-[11px] font-mono text-white/40">{lastRun}</p>
      )}
      <p className="text-[10px] font-mono text-white/20">
        Local dev only · results import as &quot;New&quot; leads · dedup on · outreach still requires your approval
      </p>
    </div>
  );
}
