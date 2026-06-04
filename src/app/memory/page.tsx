'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Memory } from '@/lib/types';
import MemoryCard from '@/components/MemoryCard';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import { Brain, Search, Plus, Filter } from 'lucide-react';

export default function MemoryVault() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/filter states
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [content, setContent] = useState('');
  const [memType, setMemType] = useState<any>('Business');
  const [tags, setTags] = useState('');
  const [importance, setImportance] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  async function loadMemories() {
    try {
      let mems = [];
      if (query.trim()) {
        mems = await db.searchMemories(query);
      } else {
        mems = await db.getMemories();
      }
      setMemories(mems);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMemories();
  }, [query]);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      const parsedTags = tags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => !!t);

      await db.addMemory({
        type: memType,
        content,
        tags: parsedTags,
        importance,
        source: 'Manual'
      });

      setContent('');
      setTags('');
      setImportance(5);
      setShowAddForm(false);
      await loadMemories();
      alert('Fact saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="LOADING SAVED NOTES..." />;
  }

  // Client-side filter by type (if not search querying)
  const filteredMemories = memories.filter(m => {
    return filterType === 'All' || m.type === filterType;
  });

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 text-neon-purple">
          <Brain size={20} />
          <span className="font-mono text-sm font-bold uppercase tracking-wider">Saved Business Notes</span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-neon-purple hover:bg-neon-purple/80 text-white rounded text-xs font-mono font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)]"
        >
          <Plus size={14} />
          <span>{showAddForm ? 'CLOSE FORM' : 'ADD A BUSINESS FACT'}</span>
        </button>
      </div>

      {/* Add Memory Form Panel */}
      {showAddForm && (
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <h4 className="text-sm font-mono font-bold text-neon-purple uppercase mb-4">
            Save a Business Fact
          </h4>
          <form onSubmit={handleAddMemory} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Category</label>
                <select
                  value={memType}
                  onChange={(e) => setMemType(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-purple transition"
                >
                  <option value="Business">Business Detail (Services, Offers)</option>
                  <option value="Client">Client Specific Fact</option>
                  <option value="Lead">Lead Profile Insight</option>
                  <option value="Project">Project Requirement note</option>
                  <option value="Sales">Sales objection handling</option>
                  <option value="Strategy">Strategic Target or Positioning</option>
                  <option value="Personal Preference">Founder Style Preference</option>
                  <option value="Lesson">Lesson Learnt / Experiment Results</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. pricing, website, dentist"
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-purple transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Importance (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={importance}
                  onChange={(e) => setImportance(Number(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-purple transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1 font-bold">Fact / Details *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                required
                placeholder="Type details here (e.g. 'We charge $250/month maintenance fees for AI voice assistants. We do not do hourly rates.')"
                className="w-full bg-white/5 border border-white/10 rounded p-3 text-foreground focus:outline-none focus:border-neon-purple transition"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-white/10 rounded text-muted-foreground hover:bg-white/5 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="px-4 py-2 bg-neon-purple hover:bg-neon-purple/80 text-white rounded font-mono font-bold transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'SAVING...' : 'SAVE FACT'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="md:col-span-8 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved notes by keyword..."
            className="w-full pl-10 pr-4 py-2 rounded bg-white/5 border border-white/10 hover:border-neon-purple/30 focus:border-neon-purple text-xs text-foreground focus:outline-none transition duration-200"
          />
          <Search size={15} className="absolute left-3.5 top-3 text-muted-foreground" />
        </div>

        {/* Category Filter */}
        <div className="md:col-span-4 flex items-center space-x-2">
          <Filter size={14} className="text-muted-foreground" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Business">Business Details</option>
            <option value="Client">Client Specific Facts</option>
            <option value="Lead">Lead Profile Insights</option>
            <option value="Project">Project Deliverables</option>
            <option value="Sales">Sales Strategy</option>
            <option value="Strategy">Strategy & Pricing</option>
            <option value="Personal Preference">Founder Preferences</option>
            <option value="Lesson">Lessons Learned</option>
          </select>
        </div>
      </div>

      {/* Memory cards grid */}
      {filteredMemories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredMemories.map((mem) => (
            <MemoryCard key={mem.id} memory={mem} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Notes Found"
          description="Try changing your search keywords or category filters, or add a new business fact above."
        />
      )}
    </div>
  );
}
