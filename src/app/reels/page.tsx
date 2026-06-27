'use client';

import React, { useState } from 'react';
import { Video, Sparkles, Copy, Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const VERTICALS = [
  { value: 'dental', label: 'Dental clinic' },
  { value: 'chiropractic', label: 'Chiropractic / physio' },
  { value: 'medical', label: 'Medical clinic' },
  { value: 'real_estate', label: 'Real estate agency' },
  { value: 'law', label: 'Law firm' },
  { value: 'local_service', label: 'Local service business' },
  { value: 'ecommerce', label: 'E-commerce brand' },
];

const HOOK_STYLES = [
  { value: 'pain_callout', label: 'Pain callout' },
  { value: 'dollar_loss', label: 'Dollar loss' },
  { value: 'before_after', label: 'Before / after' },
  { value: 'myth_bust', label: 'Myth bust' },
  { value: 'social_proof', label: 'Social proof' },
  { value: 'bold_claim', label: 'Bold claim' },
];

const OFFERS = [
  { value: 'ai_receptionist', label: 'AI receptionist' },
  { value: 'ai_chatbot', label: 'AI chatbot' },
  { value: 'website', label: 'Custom website' },
  { value: 'ai_automation', label: 'AI automation' },
  { value: 'full_system', label: 'Full AI system' },
  { value: 'branding', label: 'Branding system' },
];

const CTA_TYPES = [
  { value: 'dm_keyword', label: 'Comment a keyword' },
  { value: 'link_bio', label: 'Link in bio' },
  { value: 'free_audit', label: 'Free audit offer' },
  { value: 'dm_me', label: 'DM me directly' },
];

const SECTIONS = [
  { key: 'hook', label: 'Hook', timing: '0–2s', color: 'text-neon-purple' },
  { key: 'agitate', label: 'Agitate', timing: '2–8s', color: 'text-neon-orange' },
  { key: 'mechanism', label: 'Mechanism', timing: '8–18s', color: 'text-neon-cyan' },
  { key: 'proof', label: 'Proof', timing: '18–25s', color: 'text-neon-blue' },
  { key: 'cta', label: 'CTA', timing: '25–30s', color: 'text-neon-green' },
  { key: 'caption', label: 'Caption', timing: '', color: 'text-white/60' },
  { key: 'hashtags', label: 'Hashtags', timing: '', color: 'text-neon-pink' },
  { key: 'onscreen_text', label: 'On-screen overlays', timing: '', color: 'text-neon-purple' },
];

const BATCH_POOL: Record<string, Array<{ vertical: string; offer: string; hook: string }>> = {
  mixed: [
    { vertical: 'dental clinic', offer: 'AI receptionist', hook: 'pain callout' },
    { vertical: 'real estate agency', offer: 'AI chatbot', hook: 'dollar loss' },
    { vertical: 'law firm', offer: 'full AI system', hook: 'myth bust' },
    { vertical: 'chiropractic clinic', offer: 'AI receptionist', hook: 'social proof' },
    { vertical: 'local service business', offer: 'AI automation', hook: 'bold claim' },
    { vertical: 'medical clinic', offer: 'AI chatbot', hook: 'before/after' },
    { vertical: 'e-commerce brand', offer: 'custom website + AI chatbot', hook: 'pain callout' },
  ],
  healthcare: [
    { vertical: 'dental clinic', offer: 'AI receptionist', hook: 'pain callout' },
    { vertical: 'chiropractic clinic', offer: 'AI receptionist', hook: 'dollar loss' },
    { vertical: 'medical clinic', offer: 'AI chatbot', hook: 'social proof' },
    { vertical: 'dental clinic', offer: 'full AI system', hook: 'myth bust' },
    { vertical: 'physiotherapy clinic', offer: 'AI automation', hook: 'bold claim' },
    { vertical: 'medical clinic', offer: 'AI receptionist', hook: 'before/after' },
    { vertical: 'chiropractic clinic', offer: 'full AI system', hook: 'pain callout' },
  ],
};

const SYSTEM_PROMPT = `You are a direct-response copywriter for VELTRIX — a premium AI systems and web development studio targeting post-revenue SMBs. Write Instagram Reels scripts in Alex Hormozi's style: zero fluff, no welcome lines, speaks directly to business owners, uses real numbers and dollar amounts, confident and educational not salesy.

CRITICAL: Respond ONLY with a valid JSON object. No markdown fences, no preamble, no extra text. Just raw JSON.

Required keys: hook, agitate, mechanism, proof, cta, caption, hashtags, onscreen_text

Rules:
- hook: 1–2 punchy sentences. Callout exact person + painful situation. Stop-scroll energy.
- agitate: 2–3 sentences. Real dollar/time cost. Urgency not fear.
- mechanism: 3–4 sentences. Specific VELTRIX solution. Name the tech. Be concrete.
- proof: 2–3 sentences. Use stat if given or create specific believable result.
- cta: 1 sentence. One specific action only.
- caption: 3–4 sentences. Hook + value + soft CTA. No hashtags here.
- hashtags: array of exactly 10 strings without # symbol
- onscreen_text: array of 5 overlays, max 6 words each`;

interface Script {
  hook: string;
  agitate: string;
  mechanism: string;
  proof: string;
  cta: string;
  caption: string;
  hashtags: string[];
  onscreen_text: string[];
}

function ScriptSection({ section, value }: { section: typeof SECTIONS[0]; value: string | string[] }) {
  const [copied, setCopied] = useState(false);
  const display = Array.isArray(value)
    ? value.map((x, i) => (section.key === 'hashtags' ? '#' + x : `${i + 1}. ${x}`)).join('\n')
    : value;

  const copy = () => {
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-mono font-semibold ${section.color}`}>{section.label}</span>
          {section.timing && (
            <span className="text-[10px] text-white/20 font-mono">{section.timing}</span>
          )}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white/70 transition-colors px-2 py-1 rounded cursor-pointer"
        >
          {copied ? <Check size={12} className="text-neon-green" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <div className="px-4 py-3 text-[13px] text-white/75 leading-relaxed whitespace-pre-wrap font-sans">
        {display}
      </div>
    </div>
  );
}

export default function ReelsEngine() {
  const [vertical, setVertical] = useState('dental');
  const [hookStyle, setHookStyle] = useState('pain_callout');
  const [offer, setOffer] = useState('ai_receptionist');
  const [ctaType, setCtaType] = useState('dm_keyword');
  const [proofStat, setProofStat] = useState('');
  const [generating, setGenerating] = useState(false);
  const [script, setScript] = useState<Script | null>(null);
  const [error, setError] = useState('');

  // Batch
  const [batchCount, setBatchCount] = useState(7);
  const [batchFocus, setBatchFocus] = useState('mixed');
  const [batchProof, setBatchProof] = useState('');
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchScripts, setBatchScripts] = useState<Array<{ item: { vertical: string; offer: string; hook: string }; script: Script | null }>>([]);
  const [expandedBatch, setExpandedBatch] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [copiedAll, setCopiedAll] = useState(false);

  async function callClaude(userMsg: string): Promise<Script> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMsg }],
      }),
    });
    const data = await res.json();
    const raw = data.content?.find((b: { type: string }) => b.type === 'text')?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  }

  async function generateSingle() {
    setGenerating(true);
    setError('');
    setScript(null);
    const vLabel = VERTICALS.find(v => v.value === vertical)?.label || vertical;
    const hLabel = HOOK_STYLES.find(h => h.value === hookStyle)?.label || hookStyle;
    const oLabel = OFFERS.find(o => o.value === offer)?.label || offer;
    const cLabel = CTA_TYPES.find(c => c.value === ctaType)?.label || ctaType;

    const msg = `Write a 30-second Instagram Reels script for VELTRIX.
Vertical: ${vLabel}
Hook style: ${hLabel}
Offer: ${oLabel}
CTA: ${cLabel}
Proof stat: ${proofStat || 'Create a specific believable result for this vertical'}
Return only the JSON object.`;

    try {
      const result = await callClaude(msg);
      setScript(result);
    } catch (e) {
      setError('Generation failed. Check your connection and try again.');
    }
    setGenerating(false);
  }

  async function generateBatch() {
    setBatchGenerating(true);
    setBatchProgress(0);
    setBatchScripts([]);
    setExpandedBatch(null);
    const pool = (BATCH_POOL[batchFocus] || BATCH_POOL.mixed).slice(0, batchCount);
    const results: typeof batchScripts = [];

    for (let i = 0; i < pool.length; i++) {
      const item = pool[i];
      const msg = `Write a 30-second Instagram Reels script for VELTRIX.
Vertical: ${item.vertical}
Hook style: ${item.hook}
Offer: ${item.offer}
CTA: comment a keyword or DM
Proof stat: ${batchProof || 'Create a specific believable result for this vertical'}
Return only the JSON object.`;

      try {
        const s = await callClaude(msg);
        results.push({ item, script: s });
      } catch {
        results.push({ item, script: null });
      }
      setBatchProgress(i + 1);
      setBatchScripts([...results]);
    }
    setBatchGenerating(false);
  }

  function copyAllScripts() {
    const lines: string[] = ['VELTRIX — WEEKLY REELS SCRIPT BATCH', `Generated: ${new Date().toLocaleDateString()}`, '='.repeat(50), ''];
    batchScripts.forEach(({ item, script }, i) => {
      if (!script) return;
      lines.push(`DAY ${i + 1} — ${item.vertical.toUpperCase()} | ${item.offer.toUpperCase()}`);
      lines.push('-'.repeat(40));
      SECTIONS.forEach(sec => {
        const v = script[sec.key as keyof Script];
        const txt = Array.isArray(v) ? (v as string[]).map((x, j) => sec.key === 'hashtags' ? '#' + x : `${j + 1}. ${x}`).join('\n') : v;
        lines.push(`[${sec.label.toUpperCase()}]${sec.timing ? ` (${sec.timing})` : ''}`);
        lines.push(txt || '');
        lines.push('');
      });
      lines.push('='.repeat(50));
      lines.push('');
    });
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  function copySingleFull() {
    if (!script) return;
    const lines = SECTIONS.map(sec => {
      const v = script[sec.key as keyof Script];
      const txt = Array.isArray(v) ? (v as string[]).map((x, i) => sec.key === 'hashtags' ? '#' + x : `${i + 1}. ${x}`).join('\n') : v;
      return `[${sec.label.toUpperCase()}]\n${txt}`;
    }).join('\n\n');
    navigator.clipboard.writeText(lines);
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Video size={20} className="text-neon-purple" />
        <span className="font-mono text-sm font-bold uppercase tracking-wider text-neon-purple">Reels Engine</span>
        <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Hormozi Framework</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.05] w-fit">
        {(['single', 'batch'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-[12px] font-mono uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-white/[0.08] text-white border border-white/[0.08]'
                : 'text-white/30 hover:text-white/60'
            }`}
          >
            {tab === 'single' ? 'Single script' : 'Batch generator'}
          </button>
        ))}
      </div>

      {/* Single Script Tab */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-4">
            <div className="glass-panel p-5 border border-white/[0.06] rounded-xl bg-cyber-bg/30 space-y-4">
              <div className="flex items-center gap-2 text-neon-cyan mb-2">
                <Sparkles size={16} />
                <span className="font-mono text-[11px] uppercase tracking-wider font-bold">Script Settings</span>
              </div>

              {[
                { label: 'Vertical', options: VERTICALS, value: vertical, setter: setVertical },
                { label: 'Hook style', options: HOOK_STYLES, value: hookStyle, setter: setHookStyle },
                { label: 'Offer to highlight', options: OFFERS, value: offer, setter: setOffer },
                { label: 'CTA type', options: CTA_TYPES, value: ctaType, setter: setCtaType },
              ].map(({ label, options, value: val, setter }) => (
                <div key={label}>
                  <label className="block text-[10px] font-mono text-white/30 uppercase tracking-wider mb-1">{label}</label>
                  <select
                    value={val}
                    onChange={e => setter(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 focus:outline-none focus:border-neon-purple/50 transition cursor-pointer"
                  >
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}

              <div>
                <label className="block text-[10px] font-mono text-white/30 uppercase tracking-wider mb-1">
                  Real proof stat (optional)
                </label>
                <textarea
                  value={proofStat}
                  onChange={e => setProofStat(e.target.value)}
                  rows={3}
                  placeholder="e.g. Dental client recovered 11 missed bookings in week one"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-neon-purple/50 transition resize-none"
                />
              </div>

              <button
                onClick={generateSingle}
                disabled={generating}
                className="w-full py-2.5 bg-neon-purple hover:bg-neon-purple/85 disabled:opacity-40 text-white rounded-lg font-mono font-bold text-[12px] tracking-wider transition uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                {generating ? <><Loader2 size={14} className="animate-spin" /> Generating…</> : 'Generate script ↗'}
              </button>

              {error && <p className="text-[12px] text-neon-orange/80">{error}</p>}
            </div>
          </div>

          {/* Output */}
          <div className="lg:col-span-8">
            {!script && !generating && (
              <div className="h-full min-h-[300px] flex items-center justify-center border border-dashed border-white/[0.06] rounded-xl text-white/20 text-[13px] font-mono">
                Configure settings and generate your script
              </div>
            )}
            {generating && (
              <div className="h-full min-h-[300px] flex items-center justify-center border border-white/[0.06] rounded-xl">
                <div className="text-center space-y-3">
                  <Loader2 size={24} className="animate-spin text-neon-purple mx-auto" />
                  <p className="text-[12px] font-mono text-white/40">Writing your Reels script…</p>
                </div>
              </div>
            )}
            {script && !generating && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-white/30 uppercase tracking-wider">Script output</span>
                  <button
                    onClick={copySingleFull}
                    className="text-[11px] font-mono text-white/30 hover:text-white/70 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={11} /> Copy all
                  </button>
                </div>
                {SECTIONS.map(sec => (
                  <ScriptSection
                    key={sec.key}
                    section={sec}
                    value={script[sec.key as keyof Script]}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Tab */}
      {activeTab === 'batch' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls */}
          <div className="lg:col-span-4">
            <div className="glass-panel p-5 border border-white/[0.06] rounded-xl bg-cyber-bg/30 space-y-4">
              <div className="flex items-center gap-2 text-neon-cyan mb-2">
                <Sparkles size={16} />
                <span className="font-mono text-[11px] uppercase tracking-wider font-bold">Batch Settings</span>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-white/30 uppercase tracking-wider mb-1">Scripts to generate</label>
                <select
                  value={batchCount}
                  onChange={e => setBatchCount(Number(e.target.value))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 focus:outline-none focus:border-neon-purple/50 transition cursor-pointer"
                >
                  <option value={3}>3 scripts (3 days)</option>
                  <option value={5}>5 scripts (5 days)</option>
                  <option value={7}>7 scripts (full week)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-white/30 uppercase tracking-wider mb-1">Vertical focus</label>
                <select
                  value={batchFocus}
                  onChange={e => setBatchFocus(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 focus:outline-none focus:border-neon-purple/50 transition cursor-pointer"
                >
                  <option value="mixed">Mixed verticals</option>
                  <option value="healthcare">Healthcare only</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-white/30 uppercase tracking-wider mb-1">Proof stat (optional)</label>
                <textarea
                  value={batchProof}
                  onChange={e => setBatchProof(e.target.value)}
                  rows={3}
                  placeholder="e.g. Dental client recovered 11 missed bookings in week one"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-white/80 placeholder:text-white/20 focus:outline-none focus:border-neon-purple/50 transition resize-none"
                />
              </div>

              <button
                onClick={generateBatch}
                disabled={batchGenerating}
                className="w-full py-2.5 bg-neon-purple hover:bg-neon-purple/85 disabled:opacity-40 text-white rounded-lg font-mono font-bold text-[12px] tracking-wider transition uppercase cursor-pointer flex items-center justify-center gap-2"
              >
                {batchGenerating ? <><Loader2 size={14} className="animate-spin" /> Generating {batchProgress}/{batchCount}…</> : 'Generate full week ↗'}
              </button>

              {batchGenerating && (
                <div>
                  <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-neon-purple rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((batchProgress / batchCount) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] font-mono text-white/30 mt-1">{batchProgress} of {batchCount} complete</p>
                </div>
              )}

              {batchScripts.length > 0 && !batchGenerating && (
                <button
                  onClick={copyAllScripts}
                  className="w-full py-2 border border-white/[0.08] hover:border-white/20 text-white/50 hover:text-white rounded-lg font-mono text-[11px] tracking-wider transition uppercase cursor-pointer flex items-center justify-center gap-2"
                >
                  {copiedAll ? <><Check size={12} className="text-neon-green" /> Copied!</> : <><Copy size={12} /> Copy all scripts</>}
                </button>
              )}
            </div>
          </div>

          {/* Batch Output */}
          <div className="lg:col-span-8">
            {batchScripts.length === 0 && !batchGenerating && (
              <div className="h-full min-h-[300px] flex items-center justify-center border border-dashed border-white/[0.06] rounded-xl text-white/20 text-[13px] font-mono">
                Configure and generate your weekly batch
              </div>
            )}
            <div className="space-y-3">
              {batchScripts.map(({ item, script: s }, i) => (
                <div key={i} className="border border-white/[0.06] rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedBatch(expandedBatch === i ? null : i)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-neon-purple font-bold">Day {i + 1}</span>
                      <span className="text-[12px] text-white/60">{item.vertical} · {item.offer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!s && batchGenerating && <Loader2 size={12} className="animate-spin text-white/30" />}
                      {s && <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />}
                      {expandedBatch === i ? <ChevronUp size={14} className="text-white/30" /> : <ChevronDown size={14} className="text-white/30" />}
                    </div>
                  </button>
                  {expandedBatch === i && s && (
                    <div className="p-4 space-y-3 border-t border-white/[0.06]">
                      {SECTIONS.map(sec => (
                        <ScriptSection key={sec.key} section={sec} value={s[sec.key as keyof Script]} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
