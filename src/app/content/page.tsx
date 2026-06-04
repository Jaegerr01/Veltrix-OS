'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { ContentIdea } from '@/lib/types';
import ContentIdeaCard from '@/components/ContentIdeaCard';
import LoadingState from '@/components/LoadingState';
import EmptyState from '@/components/EmptyState';
import { FileCode, Plus, Sparkles } from 'lucide-react';

export default function ContentStudio() {
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [topic, setTopic] = useState('AI Receptionist ROI math for dental practices');
  const [generating, setGenerating] = useState(false);

  async function loadIdeas() {
    try {
      const ids = await db.getContentIdeas();
      setIdeas(ids);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIdeas();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: ContentIdea['status']) => {
    try {
      await db.updateContentIdea(id, { status: newStatus });
      await loadIdeas();
      alert(`Content item status updated to ${newStatus}`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateIdeas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || generating) return;

    setGenerating(true);
    try {
      const res = await fetch('/api/ai/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic })
      });
      const data = await res.json();
      if (data.success) {
        setTopic('');
        await loadIdeas();
        alert('AI successfully wrote 3 new social media post ideas!');
      } else {
        alert(data.error || 'Failed to generate content');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingState message="LOADING SOCIAL WRITER..." />;
  }

  const activeIdeas = ideas.filter(i => i.status !== 'Posted');
  const postedIdeas = ideas.filter(i => i.status === 'Posted');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Left Column: Ideas Dashboard */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center space-x-2 text-neon-cyan">
          <FileCode size={20} />
          <span className="font-mono text-sm font-bold uppercase tracking-wider">Social Media Writer</span>
        </div>

        {/* Pending list */}
        <div>
          <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
            My Saved Post Drafts
          </h3>
          {activeIdeas.length === 0 ? (
            <EmptyState
              title="No Post Drafts Found"
              description="Type a topic on the right and click Generate to create social media posts using AI."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeIdeas.map((idea) => (
                <ContentIdeaCard
                  key={idea.id}
                  idea={idea}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          )}
        </div>

        {/* Posted log */}
        <div>
          <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
            Published Posts History
          </h3>
          {postedIdeas.length === 0 ? (
            <div className="p-8 border border-dashed border-white/5 rounded-xl text-center text-muted-foreground text-xs font-mono">
              NO PUBLISHED POSTS RECORDED YET.
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {postedIdeas.map((idea) => (
                <div key={idea.id} className="p-3 bg-white/1 border border-white/3 rounded flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold block text-foreground">{idea.title}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Platform: {idea.platform} | Format: {idea.content_type || 'Text'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20 text-[9px] font-mono uppercase font-bold">
                    POSTED
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: AI Writer Form */}
      <div className="lg:col-span-4">
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <div className="flex items-center space-x-2 text-neon-cyan mb-4">
            <Sparkles size={18} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              Create Social Posts with AI
            </h3>
          </div>

          <form onSubmit={handleGenerateIdeas} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">
                What topic do you want to write about?
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={4}
                required
                placeholder="e.g. Why slow websites lose customers, how AI receptionists save dental clinics time..."
                className="w-full bg-white/5 border border-white/10 rounded p-3 text-foreground focus:outline-none focus:border-neon-cyan transition"
              />
            </div>
            
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              💡 The AI will write a complete post with hook lines and post text customized for your potential clients.
            </p>

            <button
              type="submit"
              disabled={generating || !topic.trim()}
              className="w-full py-2 bg-neon-cyan hover:bg-neon-cyan/85 text-black rounded font-mono font-bold text-xs tracking-wider transition uppercase cursor-pointer disabled:opacity-50 animate-pulse-glow"
            >
              {generating ? 'WRITING POSTS...' : 'WRITE POSTS WITH AI'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
