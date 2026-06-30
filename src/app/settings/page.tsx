'use client';

import React, { useEffect, useState } from 'react';
import { db, isSupabaseConfigured } from '@/lib/db';
import { authFetch } from '@/lib/authFetch';
import { isGeminiConfigured } from '@/lib/gemini';
import { BusinessProfile } from '@/lib/types';
import LoadingState from '@/components/LoadingState';
import { Settings, Shield, Cpu, Key, HelpCircle, Save, Database, Trash2, Sparkles, CheckSquare, Volume2 } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [businessName, setBusinessName] = useState('');
  const [targetRevenue, setTargetRevenue] = useState('');
  const [description, setDescription] = useState('');
  const [primaryOffer, setPrimaryOffer] = useState('');
  const [secondaryOffer, setSecondaryOffer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ARIA Voice (Voicebox) status
  const [ariaStatus, setAriaStatus] = useState<{ ok: boolean; kokoro?: { downloaded: boolean; loaded: boolean }; profileId?: string | null; error?: string } | null>(null);
  const [ariaChecking, setAriaChecking] = useState(false);

  // Selected permission
  const [permission, setPermission] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('veltrix_permission') || 'level4';
    }
    return 'level4';
  });

  // Database stats
  const [leadsCount, setLeadsCount] = useState(0);
  const [revenueCount, setRevenueCount] = useState(0);
  const [tasksCount, setTasksCount] = useState(0);
  const [memoriesCount, setMemoriesCount] = useState(0);
  const [reportsCount, setReportsCount] = useState(0);
  const [outreachCount, setOutreachCount] = useState(0);
  const [resetting, setResetting] = useState(false);

  async function loadProfile() {
    try {
      const bp = await db.getBusinessProfile();
      setProfile(bp);
      setBusinessName(bp.business_name);
      setTargetRevenue(bp.target_monthly_revenue.toString());
      setDescription(bp.description);
      setPrimaryOffer(bp.primary_offer);
      setSecondaryOffer(bp.secondary_offer);

      const lds = await db.getLeads();
      setLeadsCount(lds.length);

      const rev = await db.getRevenue();
      setRevenueCount(rev.length);

      const tks = await db.getTasks();
      setTasksCount(tks.length);

      const mems = await db.getMemories();
      setMemoriesCount(mems.length);

      const rps = await db.getDailyReports();
      setReportsCount(rps.length);

      const out = await db.getOutreachMessages();
      setOutreachCount(out.length);
    } catch (e) {
      console.warn('Failed to load settings data:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // Clear stale ElevenLabs localStorage keys — ARIA now uses Voicebox/Kokoro exclusively
    if (typeof window !== 'undefined') {
      localStorage.removeItem('elevenlabs_enabled');
      localStorage.removeItem('elevenlabs_api_key');
      localStorage.removeItem('elevenlabs_voice_id');
      localStorage.removeItem('elevenlabs_agent_id');
    }
    // Check ARIA Voice status on load
    checkAriaStatus();
  }, []);

  const checkAriaStatus = async () => {
    setAriaChecking(true);
    try {
      const res = await authFetch('/api/voice/tts', { signal: AbortSignal.timeout(6000) });
      const data = await res.json();
      setAriaStatus(data);
    } catch {
      setAriaStatus({ ok: false, error: 'Could not reach Voicebox. Make sure it is running.' });
    } finally {
      setAriaChecking(false);
    }
  };

  const handlePermissionChange = (level: string) => {
    setPermission(level);
    if (typeof window !== 'undefined') {
      localStorage.setItem('veltrix_permission', level);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || submitting) return;

    setSubmitting(true);
    try {
      await db.updateBusinessProfile({
        business_name: businessName,
        target_monthly_revenue: Number(targetRevenue) || 6000,
        description,
        primary_offer: primaryOffer,
        secondary_offer: secondaryOffer
      });
      alert('Profile details updated successfully!');
      await loadProfile();
    } catch (err) {
      console.warn('Failed to update business profile:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (mode: 'clean' | 'demo') => {
    const confirmMsg = mode === 'clean'
      ? 'Are you sure you want to clear all leads, tasks, transactions, and metrics from the database? This is recommended for production deployment.'
      : 'Load demo data? This will overwrite your current workspace content with simulation leads, earnings history, and to-do lists.';
      
    if (!confirm(confirmMsg)) return;

    setResetting(true);
    try {
      await db.resetDatabase(mode);
      alert(mode === 'clean' ? 'Database reset to clean slate!' : 'Demo data loaded successfully!');
      await loadProfile();
    } catch (err) {
      console.warn('Failed to reset database:', err);
      alert('Failed to reset database.');
    } finally {
      setResetting(false);
    }
  };

  const getPermissionLabel = (lvl: string) => {
    switch (lvl) {
      case 'level1': return 'Level 1: Look & Analyze';
      case 'level2': return 'Level 2: Local Drafts';
      case 'level3': return 'Level 3: Plan & Organize';
      case 'level4': return 'Level 4: Review Before Send';
      default: return 'Level 4: Review Before Send';
    }
  };

  if (loading) {
    return <LoadingState message="LOADING SETTINGS..." />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
      {/* Left Column: Profile config */}
      <div className="lg:col-span-8 space-y-6">
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <div className="flex items-center space-x-2 text-neon-cyan mb-6">
            <Settings size={18} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              Business Goals & Profile
            </h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Company name *</label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Target Monthly Earnings (in Dollars) *</label>
                <input
                  type="number"
                  required
                  value={targetRevenue}
                  onChange={(e) => setTargetRevenue(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Primary Veltrix Service / Offer</label>
                <input
                  type="text"
                  value={primaryOffer}
                  onChange={(e) => setPrimaryOffer(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Secondary Veltrix Service / Offer</label>
                <input
                  type="text"
                  value={secondaryOffer}
                  onChange={(e) => setSecondaryOffer(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-foreground focus:outline-none focus:border-neon-cyan transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Business Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded p-3 text-foreground focus:outline-none focus:border-neon-cyan transition"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-neon-cyan hover:bg-neon-cyan/80 text-black rounded font-mono font-bold flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Save size={14} />
                <span>{submitting ? 'SAVING...' : 'SAVE PROFILE & GOALS'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Security / Permissions Gate */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30 space-y-4">
          <div className="flex items-center space-x-2 text-neon-purple">
            <Shield size={18} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              AI Safety Gate & Approvals
            </h3>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Choose how much freedom the AI has when drafting and sending emails. (Level 4 is recommended for safety, so you can review emails before they are sent).
          </p>

          <div className="space-y-3 text-xs">
            {/* Level 1 */}
            <label className="flex items-start space-x-3 p-3 rounded bg-white/2 border border-white/5 cursor-pointer">
              <input
                type="radio"
                name="perms"
                value="level1"
                checked={permission === 'level1'}
                onChange={() => handlePermissionChange('level1')}
                className="mt-0.5 accent-neon-purple"
              />
              <div>
                <span className="font-bold text-foreground block">Level 1: Look & Analyze Only (No Drafts)</span>
                <span className="text-muted-foreground text-[11px]">AI can view your checklist and leads but will not write any messages.</span>
              </div>
            </label>

            {/* Level 2 */}
            <label className="flex items-start space-x-3 p-3 rounded bg-white/2 border border-white/5 cursor-pointer">
              <input
                type="radio"
                name="perms"
                value="level2"
                checked={permission === 'level2'}
                onChange={() => handlePermissionChange('level2')}
                className="mt-0.5 accent-neon-purple"
              />
              <div>
                <span className="font-bold text-foreground block">Level 2: Local Drafts Only</span>
                <span className="text-muted-foreground text-[11px]">AI can write test messages in the browser but won't save them to the database.</span>
              </div>
            </label>

            {/* Level 3 */}
            <label className="flex items-start space-x-3 p-3 rounded bg-white/2 border border-white/5 cursor-pointer">
              <input
                type="radio"
                name="perms"
                value="level3"
                checked={permission === 'level3'}
                onChange={() => handlePermissionChange('level3')}
                className="mt-0.5 accent-neon-purple"
              />
              <div>
                <span className="font-bold text-foreground block">Level 3: Plan & Organize (Save Tasks)</span>
                <span className="text-muted-foreground text-[11px]">AI can create to-do checklists and update your client pipeline stages.</span>
              </div>
            </label>

            {/* Level 4 */}
            <label className="flex items-start space-x-3 p-3 rounded bg-neon-purple/5 border border-neon-purple/20 cursor-pointer">
              <input
                type="radio"
                name="perms"
                value="level4"
                checked={permission === 'level4'}
                onChange={() => handlePermissionChange('level4')}
                className="mt-0.5 accent-neon-purple"
              />
              <div>
                <span className="font-bold text-neon-purple block">Level 4: Review Before Sending (Default)</span>
                <span className="text-muted-foreground text-[11px]">AI writes emails and proposals but blocks them in the Outbox until you click Send.</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Right Column: Key Diagnostic Statuses */}
      <div className="lg:col-span-4 space-y-6">
        {/* Setup Checklist */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30 space-y-4">
          <div className="flex items-center space-x-2 text-neon-purple">
            <CheckSquare size={18} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              Setup & Seeding Checklist
            </h3>
          </div>

          <div className="space-y-2 text-xs font-sans">
            <div className="flex items-center space-x-2.5 p-2 rounded bg-white/2 border border-white/5">
              <input type="checkbox" readOnly checked={isGeminiConfigured} className="accent-neon-purple" />
              <span className={isGeminiConfigured ? 'line-through text-muted-foreground' : 'text-foreground'}>
                1. Add Gemini API Key
              </span>
            </div>

            <div className="flex items-center space-x-2.5 p-2 rounded bg-white/2 border border-white/5">
              <input type="checkbox" readOnly checked={isSupabaseConfigured} className="accent-neon-purple" />
              <span className={isSupabaseConfigured ? 'line-through text-muted-foreground' : 'text-foreground'}>
                2. Connect Supabase Database
              </span>
            </div>

            <div className="flex items-center space-x-2.5 p-2 rounded bg-white/2 border border-white/5">
              <input type="checkbox" readOnly checked={!!profile} className="accent-neon-purple" />
              <span className={profile ? 'line-through text-muted-foreground' : 'text-foreground'}>
                3. Create Business Profile
              </span>
            </div>

            <div className="flex items-center space-x-2.5 p-2 rounded bg-white/2 border border-white/5">
              <input type="checkbox" readOnly checked={leadsCount > 0} className="accent-neon-purple" />
              <span className={leadsCount > 0 ? 'line-through text-muted-foreground' : 'text-foreground'}>
                4. Feed your first CRM Lead
              </span>
            </div>

            <div className="flex items-center space-x-2.5 p-2 rounded bg-white/2 border border-white/5">
              <input type="checkbox" readOnly checked={reportsCount > 0} className="accent-neon-purple" />
              <span className={reportsCount > 0 ? 'line-through text-muted-foreground' : 'text-foreground'}>
                5. Generate first Daily Summary
              </span>
            </div>

            <div className="flex items-center space-x-2.5 p-2 rounded bg-white/2 border border-white/5">
              <input type="checkbox" readOnly checked={outreachCount > 0} className="accent-neon-purple" />
              <span className={outreachCount > 0 ? 'line-through text-muted-foreground' : 'text-foreground'}>
                6. Generate first Outreach Draft
              </span>
            </div>
          </div>
        </div>

        {/* ARIA Voice — Voicebox/Kokoro Status */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-neon-cyan">
              <Volume2 size={18} />
              <h3 className="font-mono text-sm font-bold uppercase tracking-wider">ARIA Voice — Voicebox / Kokoro</h3>
            </div>
            <button
              onClick={checkAriaStatus}
              disabled={ariaChecking}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-neon-cyan/40 rounded text-[10px] font-mono font-bold text-muted-foreground hover:text-neon-cyan transition cursor-pointer disabled:opacity-40"
            >
              {ariaChecking ? 'CHECKING...' : 'CHECK STATUS'}
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {ariaStatus ? (
              <>
                <div className={`flex items-center justify-between p-2.5 rounded border ${ariaStatus.ok ? 'border-neon-cyan/20 bg-neon-cyan/5' : 'border-neon-pink/20 bg-neon-pink/5'}`}>
                  <span className="font-semibold text-foreground">Voicebox Server</span>
                  <span className={`font-mono font-bold text-[10px] ${ariaStatus.ok ? 'text-neon-cyan' : 'text-neon-pink'}`}>
                    {ariaStatus.ok ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                {ariaStatus.kokoro && (
                  <div className={`flex items-center justify-between p-2.5 rounded border ${ariaStatus.kokoro.loaded ? 'border-neon-cyan/20 bg-neon-cyan/5' : 'border-yellow-500/20 bg-yellow-500/5'}`}>
                    <span className="font-semibold text-foreground">Kokoro 82M Model</span>
                    <span className={`font-mono font-bold text-[10px] ${ariaStatus.kokoro.loaded ? 'text-neon-cyan' : 'text-yellow-400'}`}>
                      {ariaStatus.kokoro.loaded ? 'LOADED' : ariaStatus.kokoro.downloaded ? 'DOWNLOADED' : 'NOT DOWNLOADED'}
                    </span>
                  </div>
                )}
                {ariaStatus.profileId && (
                  <div className="flex items-center justify-between p-2.5 rounded border border-white/5 bg-white/2">
                    <span className="text-muted-foreground">Voice Profile</span>
                    <span className="font-mono text-[9px] text-neon-purple truncate max-w-[180px]">{ariaStatus.profileId}</span>
                  </div>
                )}
                {ariaStatus.error && (
                  <p className="text-neon-pink text-[10px] font-mono">{ariaStatus.error}</p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground/60 text-[10px] font-mono">Click &quot;Check Status&quot; to verify ARIA voice is operational.</p>
            )}

            <div className="pt-2 border-t border-white/5 text-[9px] text-muted-foreground/60 leading-relaxed space-y-1 font-mono">
              <p>ARIA uses <span className="text-neon-cyan">Voicebox + Kokoro 82M</span> for natural local TTS.</p>
              <p>Local: start <span className="text-white">voicebox-server.exe</span> before using voice features.</p>
              <p>Production: set <span className="text-white">VOICEBOX_URL</span> to your Railway deployment URL in Vercel.</p>
            </div>
          </div>
        </div>

        {/* AI & Database Connections */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30 space-y-4">
          <div className="flex items-center space-x-2 text-neon-cyan">
            <Key size={18} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              Connections Status
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            {/* Gemini Status */}
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <div>
                <span className="font-semibold block text-foreground">Gemini AI Connection</span>
                <span className="text-[10px] text-muted-foreground font-mono">GEMINI_API_KEY</span>
              </div>
              <span className={`px-2 py-0.5 rounded font-mono text-[9px] ${isGeminiConfigured ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-neon-orange/10 text-neon-orange border border-neon-orange/20'}`}>
                {isGeminiConfigured ? 'CONNECTED' : 'LOCAL SIMULATION'}
              </span>
            </div>

            {/* Supabase Status */}
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <div>
                <span className="font-semibold block text-foreground">Supabase Database</span>
                <span className="text-[10px] text-muted-foreground font-mono">SUPABASE_ANON_KEY</span>
              </div>
              <span className={`px-2 py-0.5 rounded font-mono text-[9px] ${isSupabaseConfigured ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-neon-orange/10 text-neon-orange border border-neon-orange/20'}`}>
                {isSupabaseConfigured ? 'CONNECTED' : 'LOCAL STORAGE'}
              </span>
            </div>

            {/* Profile Status */}
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <div>
                <span className="font-semibold block text-foreground">Business Profile Status</span>
                <span className="text-[10px] text-muted-foreground font-mono">VELTRIX CORE DATA</span>
              </div>
              <span className={`px-2 py-0.5 rounded font-mono text-[9px] ${profile ? 'bg-neon-green/10 text-neon-green border border-neon-green/20' : 'bg-neon-orange/10 text-neon-orange border border-neon-orange/20'}`}>
                {profile ? 'INITIALIZED' : 'MISSING'}
              </span>
            </div>

            {/* Current permission level */}
            <div className="flex justify-between items-center py-2">
              <div>
                <span className="font-semibold block text-foreground">Auth Safety Level</span>
                <span className="text-[10px] text-muted-foreground font-mono">VELTRIX_GATE</span>
              </div>
              <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded font-mono text-[9px] text-foreground uppercase">
                {getPermissionLabel(permission).replace('Level ', 'LVL ')}
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Data Management */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30 space-y-4">
          <div className="flex items-center space-x-2 text-neon-cyan">
            <Database size={18} />
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
              Workspace Data Management
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-white/2 rounded border border-white/5 space-y-2">
              <span className="font-mono text-[10px] text-muted-foreground uppercase block font-bold tracking-wider">
                Current Data Slate
              </span>
              <div className="flex justify-between text-foreground">
                <span>Leads Count:</span>
                <span className="font-mono font-bold text-neon-cyan">{leadsCount}</span>
              </div>
              <div className="flex justify-between text-foreground">
                <span>Invoiced Receipts:</span>
                <span className="font-mono font-bold text-neon-green">{revenueCount}</span>
              </div>
              <div className="flex justify-between text-foreground">
                <span>Task Items:</span>
                <span className="font-mono font-bold text-neon-purple">{tasksCount}</span>
              </div>
              <div className="flex justify-between text-foreground">
                <span>Saved Notes:</span>
                <span className="font-mono font-bold text-foreground">{memoriesCount}</span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-normal">
              Prepare this workspace for deployment by clearing all test data, or reload demo details to experiment with the interface.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleReset('clean')}
                disabled={resetting}
                className="py-2 bg-neon-pink/10 hover:bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:border-neon-pink/60 rounded font-mono font-bold text-[10px] uppercase flex items-center justify-center space-x-1 transition cursor-pointer"
              >
                <Trash2 size={12} />
                <span>{resetting ? 'CLEARING...' : 'CLEAN SLATE'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleReset('demo')}
                disabled={resetting}
                className="py-2 bg-neon-cyan/15 hover:bg-neon-cyan/25 text-neon-cyan border border-neon-cyan/30 hover:border-neon-cyan/60 rounded font-mono font-bold text-[10px] uppercase flex items-center justify-center space-x-1 transition cursor-pointer"
              >
                <Sparkles size={12} />
                <span>{resetting ? 'LOADING...' : 'LOAD DEMO'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
