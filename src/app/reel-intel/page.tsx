'use client';

import React, { useEffect, useState } from 'react';
import { authFetch } from '@/lib/authFetch';
import {
  Radar, Sparkles, Link2, Send, Loader2, Copy, Check, ChevronDown, ChevronUp,
  ExternalLink, Clock, Tag, Target, Lightbulb, BookOpen, ArrowRight, Zap,
  Instagram, Brain
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface ImplSuggestion {
  area: string;
  action: string;
  priority: string;
}

interface ReelIntelResult {
  summary: string;
  creator: string;
  topic: string;
  keyTakeaways: string[];
  veltrixRelevance: string;
  implementationSuggestions: ImplSuggestion[];
  tags: string[];
}

interface HistoryEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  source: string;
  created_at: string;
}

// ── Priority Badge Component ─────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    High: 'bg-neon-orange/10 text-neon-orange border-neon-orange/20',
    Medium: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20',
    Low: 'bg-white/5 text-white/40 border-white/10',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  );
}

// ── Area Badge Component ─────────────────────────────────────────────────────

function AreaBadge({ area }: { area: string }) {
  const colors: Record<string, string> = {
    Sales: 'text-neon-green',
    Content: 'text-neon-cyan',
    Outreach: 'text-neon-purple',
    Pricing: 'text-neon-orange',
    Delivery: 'text-neon-green',
    Strategy: 'text-neon-pink',
  };
  return (
    <span className={`text-[10px] font-mono font-bold uppercase ${colors[area] || 'text-white/50'}`}>
      [{area}]
    </span>
  );
}

// ── Copiable Section ─────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/60 transition-colors cursor-pointer">
      {copied ? <Check size={10} className="text-neon-green" /> : <Copy size={10} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Intel Brief Display ──────────────────────────────────────────────────────

function IntelBrief({ result, metadata }: { result: ReelIntelResult; metadata?: { author?: string; caption?: string; shortcode?: string } }) {
  const fullText = [
    `SUMMARY: ${result.summary}`,
    '',
    `CREATOR: ${result.creator}`,
    `TOPIC: ${result.topic}`,
    '',
    'KEY TAKEAWAYS:',
    ...result.keyTakeaways.map((t, i) => `${i + 1}. ${t}`),
    '',
    `VELTRIX RELEVANCE: ${result.veltrixRelevance}`,
    '',
    'IMPLEMENTATION SUGGESTIONS:',
    ...result.implementationSuggestions.map(s => `[${s.area}] ${s.action} (${s.priority})`),
  ].join('\n');

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <div className="glass-panel p-5 border border-neon-purple/15 rounded-xl bg-neon-purple/[0.03]">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-neon-purple" />
            <span className="text-[10px] font-mono font-bold text-neon-purple uppercase tracking-wider">Summary</span>
          </div>
          <CopyButton text={result.summary} />
        </div>
        <p className="text-[13px] text-white/80 leading-relaxed">{result.summary}</p>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-1.5 text-[10px] text-white/35 font-mono">
            <Instagram size={11} />
            <span>{result.creator}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-white/35 font-mono">
            <Tag size={11} />
            <span>{result.topic}</span>
          </div>
        </div>
      </div>

      {/* Key Takeaways */}
      <div className="glass-panel p-5 border border-white/[0.06] rounded-xl">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-neon-cyan" />
            <span className="text-[10px] font-mono font-bold text-neon-cyan uppercase tracking-wider">Key Takeaways</span>
          </div>
          <CopyButton text={result.keyTakeaways.join('\n')} />
        </div>
        <div className="space-y-2.5">
          {result.keyTakeaways.map((takeaway, i) => (
            <div key={i} className="flex items-start gap-3 group">
              <span className="flex-shrink-0 w-5 h-5 rounded-md bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center text-[10px] font-mono font-bold text-neon-cyan mt-0.5">
                {i + 1}
              </span>
              <p className="text-[13px] text-white/70 leading-relaxed">{takeaway}</p>
            </div>
          ))}
        </div>
      </div>

      {/* VELTRIX Relevance */}
      <div className="glass-panel p-5 border border-neon-green/15 rounded-xl bg-neon-green/[0.02]">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target size={14} className="text-neon-green" />
            <span className="text-[10px] font-mono font-bold text-neon-green uppercase tracking-wider">VELTRIX Relevance</span>
          </div>
          <CopyButton text={result.veltrixRelevance} />
        </div>
        <p className="text-[13px] text-white/75 leading-relaxed">{result.veltrixRelevance}</p>
      </div>

      {/* Implementation Suggestions */}
      <div className="glass-panel p-5 border border-white/[0.06] rounded-xl">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-neon-orange" />
            <span className="text-[10px] font-mono font-bold text-neon-orange uppercase tracking-wider">Implementation Suggestions</span>
          </div>
          <CopyButton text={result.implementationSuggestions.map(s => `[${s.area}] ${s.action} (${s.priority})`).join('\n')} />
        </div>
        <div className="space-y-3">
          {result.implementationSuggestions.map((sugg, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
              <ArrowRight size={12} className="text-neon-orange mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <AreaBadge area={sugg.area} />
                  <PriorityBadge priority={sugg.priority} />
                </div>
                <p className="text-[12px] text-white/65 leading-relaxed">{sugg.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-center gap-2 flex-wrap">
        {result.tags.map((tag, i) => (
          <span key={i} className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono text-white/40">
            #{tag}
          </span>
        ))}
      </div>

      {/* Copy All */}
      <div className="flex justify-end">
        <button
          onClick={() => { navigator.clipboard.writeText(fullText); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] hover:border-white/20 text-[11px] font-mono text-white/40 hover:text-white/70 transition-all cursor-pointer"
        >
          <Copy size={11} />
          Copy Full Brief
        </button>
      </div>
    </div>
  );
}

// ── History Sidebar Item ─────────────────────────────────────────────────────

function HistoryItem({ entry, isExpanded, onToggle }: { entry: HistoryEntry; isExpanded: boolean; onToggle: () => void }) {
  const shortcode = entry.source.replace('reel-intel::', '');
  const date = new Date(entry.created_at);
  const ago = getTimeAgo(date);

  return (
    <div className="border border-white/[0.05] rounded-xl overflow-hidden transition-colors hover:border-white/[0.08]">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3.5 py-3 bg-white/[0.01] hover:bg-white/[0.03] transition cursor-pointer"
      >
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[12px] text-white/70 truncate">{entry.title || 'Reel Intel'}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-mono text-white/25">{ago}</span>
            {entry.tags?.slice(0, 2).map((tag, i) => (
              <span key={i} className="text-[9px] font-mono text-neon-purple/50">#{tag}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          <a
            href={`https://www.instagram.com/reel/${shortcode}/`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="p-1 rounded hover:bg-white/10 text-white/20 hover:text-white/60 transition"
          >
            <ExternalLink size={11} />
          </a>
          {isExpanded ? <ChevronUp size={12} className="text-white/25" /> : <ChevronDown size={12} className="text-white/25" />}
        </div>
      </button>
      {isExpanded && (
        <div className="px-3.5 py-3 border-t border-white/[0.04] text-[11px] text-white/50 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto scrollbar-thin">
          {entry.content}
        </div>
      )}
    </div>
  );
}

// ── Time Ago Helper ──────────────────────────────────────────────────────────

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── URL Validation ───────────────────────────────────────────────────────────

function isValidInstagramUrl(url: string): boolean {
  return /instagram\.com\/(?:reel|p|reels)\/[A-Za-z0-9_-]+/.test(url);
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ReelIntelPage() {
  const [url, setUrl] = useState('');
  const [context, setContext] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ReelIntelResult | null>(null);
  const [metadata, setMetadata] = useState<{ author?: string; caption?: string; shortcode?: string } | null>(null);
  const [error, setError] = useState('');
  const [savedToObsidian, setSavedToObsidian] = useState(false);

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);


  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const res = await authFetch('/api/reel-intel/history');
      const data = await res.json();
      if (data.success) setHistory(data.data || []);
    } catch {
      console.warn('Failed to load reel intel history');
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || analyzing) return;

    if (!isValidInstagramUrl(url)) {
      setError('Invalid URL. Paste an Instagram reel link like: https://www.instagram.com/reel/...');
      return;
    }

    setAnalyzing(true);
    setError('');
    setResult(null);
    setMetadata(null);
    setSavedToObsidian(false);

    try {
      const res = await authFetch('/api/reel-intel', {
        method: 'POST',
        body: JSON.stringify({ url: url.trim(), context: context.trim() || undefined }),
      });
      const data = await res.json();

      if (data.success) {
        setResult(data.data);
        setMetadata(data.metadata || null);
        setSavedToObsidian(data.savedToObsidian || false);
        setUrl('');
        setContext('');
        await loadHistory();
      } else {
        setError(data.error || 'Analysis failed. Try again.');
      }
    } catch (err: any) {
      setError('Network error. Check your connection and try again.');
    } finally {
      setAnalyzing(false);
    }
  }


  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Radar size={20} className="text-neon-purple" />
          <span className="font-mono text-sm font-bold uppercase tracking-wider text-neon-purple">Reel Intel</span>
          <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Content Intelligence Agent</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Brain size={12} className="text-neon-cyan/50" />
          <span className="text-[9px] font-mono text-neon-cyan/50 uppercase tracking-wider">Nova Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left: Input + Results ────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-6">

          {/* Input Panel */}
          <form onSubmit={handleAnalyze} className="glass-panel p-5 border border-white/[0.06] rounded-xl bg-cyber-bg/30">
            <div className="flex items-center gap-2 text-neon-cyan mb-4">
              <Sparkles size={16} />
              <span className="font-mono text-[11px] uppercase tracking-wider font-bold">Analyze Instagram Reel</span>
            </div>

            {/* URL Input */}
            <div className="mb-3">
              <label className="block text-[10px] font-mono text-white/30 uppercase tracking-wider mb-1.5">
                Reel URL *
              </label>
              <div className="relative">
                <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                  required
                  className="w-full pl-9 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-neon-purple/50 transition"
                />
                {url && isValidInstagramUrl(url) && (
                  <Check size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neon-green" />
                )}
              </div>
            </div>

            {/* Context Input */}
            <div className="mb-4">
              <label className="block text-[10px] font-mono text-white/30 uppercase tracking-wider mb-1.5">
                Context Note <span className="text-white/15">(optional — helps the AI understand the reel better)</span>
              </label>
              <textarea
                value={context}
                onChange={e => setContext(e.target.value)}
                rows={2}
                placeholder="e.g. Guy explains how to close $5k deals using loom videos instead of proposals"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2.5 text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-neon-purple/50 transition resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={analyzing || !url.trim()}
              className="w-full py-3 bg-neon-purple hover:bg-neon-purple/85 disabled:opacity-40 text-white rounded-xl font-mono font-bold text-[12px] tracking-wider transition uppercase cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
            >
              {analyzing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Nova is analyzing…
                </>
              ) : (
                <>
                  <Send size={13} />
                  Analyze Reel
                </>
              )}
            </button>

            {/* Error */}
            {error && (
              <p className="mt-3 text-[12px] text-neon-orange/80 font-mono">{error}</p>
            )}
          </form>

          {/* Loading State */}
          {analyzing && (
            <div className="glass-panel p-8 border border-neon-purple/10 rounded-xl">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-neon-purple/20 border-t-neon-purple animate-spin" />
                  <Radar size={18} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-neon-purple" />
                </div>
                <div className="text-center">
                  <p className="text-[13px] text-white/60 mb-1">Nova is deep-diving into this reel…</p>
                  <p className="text-[10px] font-mono text-white/25">Extracting metadata → Analyzing content → Mapping to VELTRIX → Building brief</p>
                </div>
              </div>
            </div>
          )}

          {/* Success indicators */}
          {result && !analyzing && (
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-neon-green">
                <Check size={12} />
                <span>Saved to Supabase Memory</span>
              </div>
              {savedToObsidian && (
                <div className="flex items-center gap-1.5 text-neon-cyan">
                  <Check size={12} />
                  <span>Written to Obsidian Vault</span>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          {result && !analyzing && (
            <IntelBrief result={result} metadata={metadata || undefined} />
          )}

          {/* Empty State */}
          {!result && !analyzing && (
            <div className="h-64 flex items-center justify-center border border-dashed border-white/[0.06] rounded-xl">
              <div className="text-center space-y-2">
                <Radar size={28} className="mx-auto text-white/10" />
                <p className="text-[13px] text-white/25 font-mono">Paste a reel URL and hit Analyze</p>
                <p className="text-[10px] text-white/15">Nova will extract actionable intel and save it to your brain</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: History ───────────────────────────────────────────── */}
        <div className="lg:col-span-4">
          <div className="glass-panel p-4 border border-white/[0.06] rounded-xl bg-cyber-bg/30">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={14} className="text-white/30" />
              <span className="font-mono text-[11px] uppercase tracking-wider font-bold text-white/50">Intel History</span>
              <span className="ml-auto text-[10px] font-mono text-white/20">{history.length}</span>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={16} className="animate-spin text-white/20" />
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center">
                <Radar size={24} className="mx-auto text-white/10 mb-2" />
                <p className="text-[11px] text-white/20 font-mono">No reels analyzed yet</p>
                <p className="text-[9px] text-white/12 mt-1">Analyzed reels will appear here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto scrollbar-thin pr-1">
                {history.map(entry => (
                  <HistoryItem
                    key={entry.id}
                    entry={entry}
                    isExpanded={expandedHistory === entry.id}
                    onToggle={() => setExpandedHistory(expandedHistory === entry.id ? null : entry.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
