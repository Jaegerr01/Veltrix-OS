'use client';

import React, { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/db';
import { Memory } from '@/lib/types';
import MemoryCard from '@/components/MemoryCard';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import { Brain, Search, Plus, Filter, Upload, CheckCircle, XCircle, X, RefreshCw } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';

// ── Obsidian Upload Panel ──────────────────────────────────────────────────────

function ObsidianUploadPanel({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ synced: number; total: number; errors: string[] } | null>(null);

  function addFiles(newFiles: FileList | null) {
    if (!newFiles) return;
    const mdFiles = Array.from(newFiles).filter(f => f.name.endsWith('.md'));
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      return [...prev, ...mdFiles.filter(f => !existing.has(f.name))];
    });
  }

  async function handleUpload() {
    if (!files.length || uploading) return;
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    files.forEach(f => formData.append('files', f));

    try {
      const res  = await authFetch('/api/obsidian/upload', { method: 'POST', body: formData });
      const data = await res.json();
      setResult({ synced: data.synced ?? 0, total: data.total ?? files.length, errors: data.errors ?? [] });
      if (data.success) onDone();
    } catch {
      setResult({ synced: 0, total: files.length, errors: ['Upload failed — please try again.'] });
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="glass-panel border border-neon-purple/20 rounded-xl bg-[#0a0a14]/80 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-neon-purple" />
          <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">Obsidian Brain — Import Notes</span>
        </div>
        <button onClick={onClose} className="text-white/30 hover:text-white transition cursor-pointer">
          <X size={16} />
        </button>
      </div>

      {/* Instructions */}
      <div className="text-[11px] text-white/40 font-mono space-y-1 border border-white/5 rounded-lg p-3 bg-white/[0.02]">
        <p className="text-white/60 font-semibold mb-1">How to do it:</p>
        <p>1. Open your Obsidian vault folder on your computer</p>
        <p>2. Select all the notes you want (<span className="text-white/70">Ctrl+A</span>)</p>
        <p>3. Drag them into the box below — or click to browse</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-neon-purple bg-neon-purple/10'
            : 'border-white/10 hover:border-neon-purple/40 hover:bg-white/[0.02]'
        }`}
      >
        <Upload size={28} className={`mx-auto mb-3 ${dragging ? 'text-neon-purple' : 'text-white/20'}`} />
        <p className="text-xs font-mono text-white/40">
          {dragging ? 'Drop your .md files here' : 'Drag & drop your Obsidian notes here'}
        </p>
        <p className="text-[10px] text-white/20 mt-1">or click to browse — only .md files are imported</p>
        <input
          ref={inputRef}
          type="file"
          accept=".md"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-white/40">{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
            <button onClick={() => setFiles([])} className="text-[10px] text-white/30 hover:text-neon-orange transition cursor-pointer font-mono">
              Clear all
            </button>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {files.map(f => (
              <div key={f.name} className="flex items-center gap-2 text-[11px] text-white/50 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-purple/50 flex-shrink-0" />
                <span className="truncate">{f.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={`flex items-start gap-2 p-3 rounded-lg text-xs font-mono border ${
          result.errors.length && result.synced === 0
            ? 'bg-red-500/10 border-red-500/20 text-red-400'
            : 'bg-neon-green/10 border-neon-green/20 text-neon-green'
        }`}>
          {result.synced > 0
            ? <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
            : <XCircle size={14} className="mt-0.5 flex-shrink-0" />}
          <span>
            {result.synced > 0
              ? `${result.synced} of ${result.total} notes imported into VELTRIX Brain.`
              : result.errors[0] ?? 'Something went wrong.'}
          </span>
        </div>
      )}

      {/* Action */}
      <button
        onClick={handleUpload}
        disabled={!files.length || uploading}
        className="w-full py-2.5 rounded-xl bg-neon-purple hover:bg-neon-purple/80 text-white text-xs font-mono font-bold uppercase tracking-wider transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Upload size={13} />
        {uploading ? `Importing ${files.length} notes…` : `Import ${files.length || ''} Notes into Brain`}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MemoryVault() {
  const [memories, setMemories]     = useState<Memory[]>([]);
  const [loading, setLoading]       = useState(true);
  const [query, setQuery]           = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showObsidian, setShowObsidian] = useState(false);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [syncing, setSyncing]           = useState(false);
  const [syncMsg, setSyncMsg]           = useState<string | null>(null);

  const [content, setContent]       = useState('');
  const [memType, setMemType]       = useState<any>('Business');
  const [tags, setTags]             = useState('');
  const [importance, setImportance] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  async function syncVault() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await authFetch('/api/obsidian/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncMsg(`Synced ${data.synced}/${data.total} notes from ${data.mode} vault`);
        await loadMemories();
      } else {
        setSyncMsg(data.error || 'Sync failed');
      }
    } catch {
      setSyncMsg('Sync failed — check console');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 5000);
    }
  }

  async function loadMemories() {
    try {
      const mems = query.trim() ? await db.searchMemories(query) : await db.getMemories();
      setMemories(mems);
    } catch (e) {
      console.warn('Failed to load memories:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMemories(); }, [query]);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await db.addMemory({
        type: memType,
        content,
        tags: tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
        importance,
        source: 'Manual',
      });
      setContent(''); setTags(''); setImportance(5); setShowAddForm(false);
      await loadMemories();
    } catch (err) {
      console.warn('Failed to add memory note:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState message="LOADING SAVED NOTES..." />;

  const filteredMemories = memories.filter(m => filterType === 'All' || m.type === filterType);

  return (
    <div className="space-y-6 font-sans">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 text-neon-purple">
          <Brain size={20} />
          <span className="font-mono text-sm font-bold uppercase tracking-wider">Saved Business Notes</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={syncVault}
            disabled={syncing}
            title="Sync notes from your Obsidian vault (GitHub or local)"
            className="px-4 py-2 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'SYNCING…' : 'SYNC VAULT'}</span>
          </button>
          {syncMsg && (
            <span className="text-[10px] font-mono text-cyan-400/80">{syncMsg}</span>
          )}
          <button
            onClick={() => { setShowObsidian(!showObsidian); setShowAddForm(false); }}
            className={`px-4 py-2 border rounded text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer ${
              showObsidian
                ? 'bg-neon-purple/20 border-neon-purple/40 text-neon-purple'
                : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-neon-purple/40 text-white/60 hover:text-neon-purple'
            }`}
          >
            <Upload size={13} />
            <span>OBSIDIAN IMPORT</span>
          </button>
          <button
            onClick={() => { setShowAddForm(!showAddForm); setShowObsidian(false); }}
            className="px-4 py-2 bg-neon-purple hover:bg-neon-purple/80 text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)]"
          >
            <Plus size={14} />
            <span>{showAddForm ? 'CLOSE FORM' : 'ADD A BUSINESS FACT'}</span>
          </button>
        </div>
      </div>

      {/* Obsidian Upload Panel */}
      {showObsidian && (
        <ObsidianUploadPanel
          onClose={() => setShowObsidian(false)}
          onDone={() => { setShowObsidian(false); loadMemories(); }}
        />
      )}

      {/* Add Memory Form */}
      {showAddForm && (
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <h4 className="text-sm font-mono font-bold text-neon-purple uppercase mb-4">Save a Business Fact</h4>
          <form onSubmit={handleAddMemory} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Category</label>
                <select value={memType} onChange={e => setMemType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-purple transition">
                  <option value="Business">Business Detail</option>
                  <option value="Client">Client Fact</option>
                  <option value="Lead">Lead Insight</option>
                  <option value="Project">Project Note</option>
                  <option value="Sales">Sales Strategy</option>
                  <option value="Strategy">Strategic Target</option>
                  <option value="Personal Preference">Founder Preference</option>
                  <option value="Lesson">Lesson Learned</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Tags</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                  placeholder="pricing, website, dentist"
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-purple transition" />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Importance (1–10)</label>
                <input type="number" min="1" max="10" value={importance} onChange={e => setImportance(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-purple transition" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1 font-bold">Content *</label>
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} required
                placeholder="e.g. 'We charge $250/month for AI voice assistants. We do not do hourly rates.'"
                className="w-full bg-white/5 border border-white/10 rounded p-3 text-foreground focus:outline-none focus:border-neon-purple transition" />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-white/10 rounded text-muted-foreground hover:bg-white/5 transition cursor-pointer">
                Cancel
              </button>
              <button type="submit" disabled={submitting || !content.trim()}
                className="px-4 py-2 bg-neon-purple hover:bg-neon-purple/80 text-white rounded font-mono font-bold transition cursor-pointer disabled:opacity-50">
                {submitting ? 'SAVING...' : 'SAVE FACT'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search + Filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative">
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search saved notes by keyword..."
            className="w-full pl-10 pr-4 py-2 rounded bg-white/5 border border-white/10 hover:border-neon-purple/30 focus:border-neon-purple text-xs text-foreground focus:outline-none transition" />
          <Search size={15} className="absolute left-3.5 top-3 text-muted-foreground" />
        </div>
        <div className="md:col-span-4 flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono cursor-pointer">
            <option value="All">All Categories</option>
            <option value="Business">Business Details</option>
            <option value="Client">Client Facts</option>
            <option value="Lead">Lead Insights</option>
            <option value="Project">Project Notes</option>
            <option value="Sales">Sales Strategy</option>
            <option value="Strategy">Strategy & Pricing</option>
            <option value="Personal Preference">Founder Preferences</option>
            <option value="Lesson">Lessons Learned</option>
          </select>
        </div>
      </div>

      {/* Cards */}
      {filteredMemories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMemories.map(mem => <MemoryCard key={mem.id} memory={mem} />)}
        </div>
      ) : (
        <EmptyState
          title="No Notes Found"
          description="Try changing your search or filters, or import your Obsidian notes using the button above."
        />
      )}
    </div>
  );
}
