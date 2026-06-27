'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Mail, TrendingUp, CalendarCheck, BarChart2,
  X, Loader2, ChevronRight, BookOpen, RefreshCw,
} from 'lucide-react';

interface DeckButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
  border: string;
}

const DECK: DeckButton[] = [
  { id: 'am-report',   label: 'AM Report',   icon: <Sun size={16} />,          color: 'text-neon-orange',  glow: 'bg-neon-orange/10',  border: 'border-neon-orange/20'  },
  { id: 'inbox-brief', label: 'Inbox Brief', icon: <Mail size={16} />,         color: 'text-neon-cyan',    glow: 'bg-neon-cyan/10',    border: 'border-neon-cyan/20'    },
  { id: 'trend-scan',  label: 'Trend Scan',  icon: <TrendingUp size={16} />,   color: 'text-neon-purple',  glow: 'bg-neon-purple/10',  border: 'border-neon-purple/20'  },
  { id: 'plan-today',  label: 'Plan Today',  icon: <CalendarCheck size={16} />,color: 'text-neon-green',   glow: 'bg-neon-green/10',   border: 'border-neon-green/20'   },
  { id: 'wk-review',  label: 'WK Review',   icon: <BarChart2 size={16} />,    color: 'text-neon-pink',    glow: 'bg-neon-pink/10',    border: 'border-neon-pink/20'    },
];

interface ObsidianState {
  syncing: boolean;
  result: string | null;
}

export default function CommandDeck() {
  const [active,   setActive]   = useState<string | null>(null);
  const [loading,  setLoading]  = useState<string | null>(null);
  const [result,   setResult]   = useState<string | null>(null);
  const [obsidian, setObsidian] = useState<ObsidianState>({ syncing: false, result: null });

  async function runCommand(id: string) {
    setActive(id);
    setLoading(id);
    setResult(null);
    try {
      const res = await fetch('/api/ai/command-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: id }),
      });
      const data = await res.json();
      setResult(data.success ? data.result : `Error: ${data.error}`);
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(null);
    }
  }

  async function syncObsidian() {
    setObsidian({ syncing: true, result: null });
    try {
      const res = await fetch('/api/obsidian/sync', { method: 'POST' });
      const data = await res.json();
      setObsidian({
        syncing: false,
        result: data.success
          ? `Brain synced — ${data.synced}/${data.total} notes loaded into memory.`
          : `Sync failed: ${data.error}`,
      });
    } catch (e: any) {
      setObsidian({ syncing: false, result: `Error: ${e.message}` });
    }
  }

  function close() {
    setActive(null);
    setResult(null);
  }

  const activeBtn = DECK.find(d => d.id === active);

  return (
    <div className="rounded-2xl bg-[rgba(13,13,22,0.55)] backdrop-blur-xl border border-white/[0.07] p-5 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.18em]">Operator</p>
          <h3 className="text-[15px] font-bold text-white mt-1">Command Deck</h3>
        </div>
        <button
          onClick={syncObsidian}
          disabled={obsidian.syncing}
          className="flex items-center gap-1.5 text-[10px] font-mono text-neon-purple border border-neon-purple/25 bg-neon-purple/8 hover:bg-neon-purple/16 px-3 py-1.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
        >
          {obsidian.syncing
            ? <><Loader2 size={11} className="animate-spin" /> Syncing Brain…</>
            : <><BookOpen size={11} /> Sync Obsidian Brain</>}
        </button>
      </div>

      {/* Obsidian sync feedback */}
      <AnimatePresence>
        {obsidian.result && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between text-[11px] font-mono text-neon-purple bg-neon-purple/8 border border-neon-purple/20 rounded-xl px-4 py-2.5"
          >
            <span>{obsidian.result}</span>
            <button onClick={() => setObsidian(s => ({ ...s, result: null }))} className="ml-3 text-white/30 hover:text-white cursor-pointer">
              <X size={11} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5 Command buttons */}
      <div className="grid grid-cols-5 gap-2.5">
        {DECK.map(btn => (
          <motion.button
            key={btn.id}
            whileTap={{ scale: 0.96 }}
            whileHover={{ y: -2 }}
            onClick={() => runCommand(btn.id)}
            disabled={!!loading}
            className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer disabled:opacity-60 ${
              active === btn.id
                ? `${btn.glow} ${btn.border}`
                : 'bg-white/[0.025] border-white/[0.07] hover:border-white/[0.15]'
            }`}
          >
            {loading === btn.id
              ? <Loader2 size={16} className={`${btn.color} animate-spin`} />
              : <span className={btn.color}>{btn.icon}</span>}
            <span className={`text-[10px] font-mono font-semibold whitespace-nowrap ${active === btn.id ? btn.color : 'text-white/50'}`}>
              {btn.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Result panel */}
      <AnimatePresence>
        {result && activeBtn && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`rounded-2xl border ${activeBtn.border} ${activeBtn.glow} p-4 space-y-3`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={activeBtn.color}>{activeBtn.icon}</span>
                  <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${activeBtn.color}`}>
                    {activeBtn.label}
                  </span>
                  <ChevronRight size={10} className="text-white/20" />
                  <span className="text-[10px] font-mono text-white/30">Alex (CEO Agent)</span>
                </div>
                <button onClick={close} className="p-1 rounded-lg hover:bg-white/5 text-white/25 hover:text-white transition-colors cursor-pointer">
                  <X size={13} />
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto pr-1 text-[12px] text-white/75 leading-relaxed font-sans whitespace-pre-wrap scrollbar-thin">
                {result}
              </div>
              <div className="flex gap-2 pt-1 border-t border-white/[0.05]">
                <button
                  onClick={() => runCommand(active!)}
                  className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw size={10} /> Regenerate
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
