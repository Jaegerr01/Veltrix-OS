'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { DailyReport, Lead, Client, Project, BusinessProfile } from '@/lib/types';
import AIChatBox from '@/components/AIChatBox';
import DailyReportCard from '@/components/DailyReportCard';
import LoadingState from '@/components/LoadingState';
import { ClipboardList, Sparkles, Cpu, Play, Terminal, Zap } from 'lucide-react';
import { AGENTS } from '@/lib/agents/agents';

export default function CommandCenter() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  // Lists for agent execution dropdowns
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'chat' | 'agents'>('chat');

  // Agent execution controls
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [agentParams, setAgentParams] = useState<Record<string, any>>({});
  const [executingAgent, setExecutingAgent] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [autonomous, setAutonomous] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  async function loadData() {
    try {
      const rps = await db.getDailyReports();
      setReports(rps);

      const lds = await db.getLeads();
      setLeads(lds);

      const clts = await db.getClients();
      setClients(clts);

      const projs = await db.getProjects();
      setProjects(projs);

      const prof = await db.getBusinessProfile();
      setProfile(prof);
    } catch (e) {
      console.warn('Failed to load command center data:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'agents') {
        setActiveTab('agents');
      }
      const runAgent = params.get('run');
      if (runAgent && AGENTS[runAgent]) {
        setActiveTab('agents');
        setExpandedAgent(runAgent);
      }
      const askAgent = params.get('ask');
      if (askAgent && AGENTS[askAgent]) {
        setActiveTab('chat');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('veltrix-ask-agent', {
            detail: `To ${AGENTS[askAgent].name}: `
          }));
        }, 100);
      }
    }
  }, []);

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    try {
      const res = await fetch('/api/ai/report', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await loadData();
      } else {
        alert(data.error || 'Failed to generate report');
      }
    } catch (e) {
      console.warn('Failed to generate daily report via AI:', e);
      alert('Network error generating report');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleAskAgent = (agentName: string) => {
    setActiveTab('chat');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('veltrix-ask-agent', {
        detail: `To ${agentName}: `
      }));
    }, 100);
  };

  const handleRunAgentConfig = (agentKey: string) => {
    setExpandedAgent(expandedAgent === agentKey ? null : agentKey);
    setAgentParams({});
    setExecutionResult(null);
  };

  const handleExecuteAgent = async (agentKey: string) => {
    setExecutingAgent(agentKey);
    setExecutionResult(null);
    setTerminalLogs([]);

    // 1. Determine logs to print based on agent key
    const logs: string[] = [];
    const leadId = agentParams.leadId;
    const selectedLead = leads.find(l => l.id === leadId);
    const leadName = selectedLead ? selectedLead.business_name : 'Selected Lead';
    const offerName = agentParams.offerName || 'Primary Offer';
    const price = agentParams.price || 1200;
    const sequenceDay = agentParams.sequenceDay || 3;
    const channel = agentParams.channel || 'Email';

    if (agentKey === 'ceo') {
      logs.push(
        '⚙️ Booting CEO Executive Agent...',
        '📊 Fetching latest business KPIs & metrics...',
        '🔍 Scanning active client projects and daily reports...',
        '🧠 Processing corporate memory bank...',
        '🤖 Generating daily command report via Gemini...',
        '💾 Writing daily report to Supabase DB...',
        `✨ Autonomous mode: ${autonomous ? 'ON (Creating completed tasks)' : 'OFF (Creating draft tasks)'}`,
        '✅ CEO Daily Command compilation complete.'
      );
    } else if (agentKey === 'leadResearch') {
      logs.push(
        '⚙️ Booting Lead Research Agent...',
        `🔍 Extracting profile for: ${leadName}...`,
        '🌐 Initializing semantic scrapper...',
        '🧠 Scoring website structure and brand assets...',
        '🤖 Analyzing automation opportunities via Gemini...',
        '💾 Committing lead score & qualification data to database...',
        `✨ Autonomous mode: ${autonomous ? 'ON (Marking completed)' : 'OFF'}`,
        '✅ Lead research completed.'
      );
    } else if (agentKey === 'outreach') {
      logs.push(
        '⚙️ Booting Outreach Copywriter Agent...',
        `📥 Extracting contact details for: ${leadName}...`,
        `🎯 Matching with offer: ${offerName}...`,
        '🧠 Aligning tone of voice with memory bank...',
        '🤖 Generating personalized copy via Gemini...',
        `💾 Writing message to Outbox (${channel})...`,
        `⚡ Autonomous mode: ${autonomous ? 'Auto-approving & marking SENT' : 'Saving draft for approval'}`,
        '✅ Outreach generated successfully.'
      );
    } else if (agentKey === 'followup') {
      logs.push(
        '⚙️ Booting Sequence Follow-up Agent...',
        `🔍 Fetching communications for: ${leadName}...`,
        `📅 Target timeline: Day ${sequenceDay} sequence...`,
        '🤖 Writing contextual follow-up sequence...',
        '💾 Saving follow-up log to Supabase...',
        `⚡ Autonomous mode: ${autonomous ? 'Auto-sending message & completing task' : 'Saving draft'}`,
        '✅ Follow-up sequence established.'
      );
    } else if (agentKey === 'proposal') {
      logs.push(
        '⚙️ Booting Sales Proposal Agent...',
        `🔍 Retrieving pain points for: ${leadName}...`,
        '📄 Compiling professional pitch deck markdown...',
        `🤖 Estimating cost framework at $${price}...`,
        '💾 Saving proposal quote to Supabase...',
        `⚡ Autonomous mode: ${autonomous ? 'Auto-marking proposal SENT & updating lead status' : 'Saving draft'}`,
        '✅ Proposal compiled successfully.'
      );
    } else {
      logs.push(
        '⚙️ Booting Agent Core...',
        '📥 Loading parameters...',
        '🧠 Aligning agent directives...',
        '🤖 Contacting Gemini Neural Engine...',
        '💾 Writing records to Supabase...',
        '✅ Execution complete.'
      );
    }

    // 2. Print logs one by one with a delay
    for (let i = 0; i < logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
      setTerminalLogs(prev => [...prev, logs[i]]);
    }

    // 3. Make the actual API call
    try {
      const res = await fetch('/api/ai/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentKey, params: agentParams, autonomous })
      });
      const data = await res.json();
      if (data.success) {
        setExecutionResult(data.result);
        await loadData();
      } else {
        alert(data.error || 'Agent execution failed');
      }
    } catch (e: any) {
      console.warn('Failed to execute AI agent:', e);
      alert(`Error: ${e.message}`);
    } finally {
      setExecutingAgent(null);
    }
  };

  if (loading) {
    return <LoadingState message="LOADING YOUR AI ASSISTANT..." />;
  }

  const latestReport = reports[0];

  const renderAgentInputs = (agentKey: string) => {
    switch (agentKey) {
      case 'ceo':
      case 'revenue':
        return <p className="text-[11px] text-muted-foreground font-mono">Autonomous Execution: This agent runs on all database records.</p>;
      
      case 'sales':
      case 'leadResearch':
        return (
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Select Lead *</label>
            <select
              value={agentParams.leadId || ''}
              onChange={(e) => setAgentParams({ ...agentParams, leadId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono"
            >
              <option value="">-- Select Lead --</option>
              {leads.map(l => (
                <option key={l.id} value={l.id} className="bg-cyber-bg">{l.business_name}</option>
              ))}
            </select>
          </div>
        );

      case 'outreach':
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Select Lead *</label>
              <select
                value={agentParams.leadId || ''}
                onChange={(e) => setAgentParams({ ...agentParams, leadId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono"
              >
                <option value="">-- Select Lead --</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id} className="bg-cyber-bg">{l.business_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Target Service / Offer *</label>
              <select
                value={agentParams.offerName || ''}
                onChange={(e) => setAgentParams({ ...agentParams, offerName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono"
              >
                <option value="">-- Select Offer --</option>
                <option value="AI Website + Brand System">AI Website + Brand System</option>
                <option value="AI Receptionist / Lead Booking Agent">AI Receptionist / Booking widget</option>
                <option value="Creative Tech Growth Package">Creative Tech Growth Package</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Outreach Channel</label>
              <select
                value={agentParams.channel || 'Email'}
                onChange={(e) => setAgentParams({ ...agentParams, channel: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono"
              >
                <option value="Email" className="bg-cyber-bg">Email</option>
                <option value="LinkedIn" className="bg-cyber-bg">LinkedIn</option>
                <option value="Instagram" className="bg-cyber-bg">Instagram</option>
              </select>
            </div>
          </div>
        );

      case 'followup':
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Select Lead *</label>
              <select
                value={agentParams.leadId || ''}
                onChange={(e) => setAgentParams({ ...agentParams, leadId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono"
              >
                <option value="">-- Select Lead --</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id} className="bg-cyber-bg">{l.business_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Interval Days</label>
              <select
                value={agentParams.sequenceDay || '3'}
                onChange={(e) => setAgentParams({ ...agentParams, sequenceDay: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono"
              >
                <option value="3" className="bg-cyber-bg">Day 3 Follow-up</option>
                <option value="7" className="bg-cyber-bg">Day 7 Follow-up</option>
                <option value="14" className="bg-cyber-bg">Day 14 Follow-up</option>
                <option value="30" className="bg-cyber-bg">Day 30 Follow-up</option>
              </select>
            </div>
          </div>
        );

      case 'proposal':
        return (
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Select Lead *</label>
              <select
                value={agentParams.leadId || ''}
                onChange={(e) => setAgentParams({ ...agentParams, leadId: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono"
              >
                <option value="">-- Select Lead --</option>
                {leads.map(l => (
                  <option key={l.id} value={l.id} className="bg-cyber-bg">{l.business_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Select Offer *</label>
              <select
                value={agentParams.offerName || ''}
                onChange={(e) => setAgentParams({ ...agentParams, offerName: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono"
              >
                <option value="">-- Select Offer --</option>
                <option value="AI Website + Brand System">AI Website + Brand System</option>
                <option value="AI Receptionist / Lead Booking Agent">AI Receptionist / Booking widget</option>
                <option value="Creative Tech Growth Package">Creative Tech Growth Package</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Pricing (in Dollars)</label>
              <input
                type="number"
                placeholder="e.g. 1200"
                value={agentParams.price || ''}
                onChange={(e) => setAgentParams({ ...agentParams, price: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono"
              />
            </div>
          </div>
        );

      case 'content':
        return (
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Topic / Theme *</label>
            <input
              type="text"
              placeholder="e.g. AI booking ROI"
              value={agentParams.topic || ''}
              onChange={(e) => setAgentParams({ ...agentParams, topic: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono"
            />
          </div>
        );

      case 'delivery':
        return (
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Select Project *</label>
            <select
              value={agentParams.projectId || ''}
              onChange={(e) => setAgentParams({ ...agentParams, projectId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono"
            >
              <option value="">-- Select Project --</option>
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-cyber-bg">{p.project_name}</option>
              ))}
            </select>
          </div>
        );

      case 'memory':
        return (
          <div>
            <label className="block text-[10px] font-mono text-muted-foreground uppercase mb-1">Search Keywords *</label>
            <input
              type="text"
              placeholder="e.g. dental"
              value={agentParams.query || ''}
              onChange={(e) => setAgentParams({ ...agentParams, query: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-neon-purple font-mono"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher — centered, animated pill */}
      <div className="flex justify-center mb-4">
      <div className="flex space-x-1 p-1 bg-[rgba(12,12,20,0.6)] backdrop-blur-xl border border-white/[0.08] rounded-xl font-mono text-[10px] sm:text-xs relative"
        style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.35)' }}
      >
        {(['chat', 'agents'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="relative flex-1 py-2 px-3 rounded-lg text-center cursor-pointer font-bold z-10 transition-colors duration-200"
            style={{ color: activeTab === tab ? '#fff' : 'rgba(148,163,184,0.75)' }}
          >
            {activeTab === tab && (
              <motion.div
                layoutId="tabActiveBg"
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.9) 0%, rgba(139,92,246,0.85) 100%)',
                  boxShadow: '0 0 16px rgba(168,85,247,0.45), 0 2px 8px rgba(0,0,0,0.3)',
                }}
                transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              />
            )}
            <span className="relative z-10">
              {tab === 'chat' ? 'CHAT & ACTION PLAN' : 'AI BUSINESS AGENTS'}
            </span>
          </button>
        ))}
      </div>
      </div>

      {activeTab === 'chat' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
          {/* Left Column: Interactive Chat Loop */}
          <div className="lg:col-span-7 space-y-5">
            <AIChatBox
              onReportGenerated={loadData}
              onLeadScored={() => {}}
            />

          </div>

          {/* Right Column: Reports only */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {latestReport ? (
              <>
                <p className="font-mono text-[9px] text-white/25 uppercase tracking-[0.22em] px-1">
                  LATEST REPORT
                </p>
                <DailyReportCard report={latestReport} />
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-10 text-center relative overflow-hidden flex-1 flex flex-col items-center justify-center"
              >
                <div className="absolute top-0 left-[12%] right-[12%] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.45), transparent)' }} />
                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/[0.04] to-transparent pointer-events-none rounded-2xl" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center">
                    <ClipboardList size={20} className="text-neon-purple/50" />
                  </div>
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-widest text-white/30 mb-1">
                      No summaries created today
                    </p>
                    <p className="font-mono text-[10px] text-white/18">
                      Click the button above to generate
                    </p>
                  </div>
                  <motion.button
                    onClick={handleGenerateReport}
                    disabled={loadingReport}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="shimmer-hover mt-2 px-6 py-2.5 bg-gradient-to-r from-neon-purple to-violet-600 text-white rounded-xl font-mono font-bold text-[10px] tracking-widest uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_32px_rgba(168,85,247,0.5)]"
                  >
                    {loadingReport ? <Zap size={13} className="animate-pulse" /> : <ClipboardList size={13} />}
                    <span>{loadingReport ? 'GENERATING...' : 'CREATE DAILY ACTION PLAN'}</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      ) : (
        /* AI Business Agents Hub */
        <div className="space-y-8 font-sans">
          {/* Futuristic Visualizer Telemetry Core */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Pulsing Concentric Visual Core */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="lg:col-span-7 glass-card p-6 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6"
            >
              {/* Cyan top accent line */}
              <div className="absolute top-0 left-[12%] right-[12%] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.65), transparent)' }} />
              {/* Rotating Concentric Rings */}
              <div className="relative w-48 h-48 flex items-center justify-center shrink-0">
                {/* Ring 1: Slow Rotate */}
                <div className="absolute rounded-full border border-dashed border-neon-purple/40 animate-spin-slow w-44 h-44"></div>
                {/* Ring 2: Fast Reverse */}
                <div className="absolute rounded-full border border-double border-neon-cyan/35 animate-spin-reverse w-36 h-36"></div>
                {/* Ring 3: Core border */}
                <div className="absolute rounded-full border border-dashed border-neon-pink/30 animate-spin-slow w-28 h-28"></div>
                {/* Core Sphere */}
                <div className="absolute rounded-full bg-gradient-to-tr from-neon-purple/20 to-neon-cyan/20 w-20 h-20 animate-orb-pulse flex items-center justify-center border border-neon-purple/45">
                  <Cpu className="text-neon-cyan animate-pulse" size={24} />
                </div>
              </div>

              {/* Telemetry Metrics Dashboard */}
              <div className="flex-1 space-y-4 w-full">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="font-mono text-xs font-bold text-neon-cyan uppercase tracking-wider">Neural Core Telemetry</span>
                  <span className="flex items-center space-x-1.5 font-mono text-[10px] text-neon-green">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>
                    <span>ONLINE</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 font-mono text-[10px] text-muted-foreground uppercase">
                  <div className="space-y-1">
                    <span>Active CRM Leads</span>
                    <span className="block text-sm font-bold text-foreground">{leads.length}</span>
                  </div>
                  <div className="space-y-1">
                    <span>Scored / Qualified</span>
                    <span className="block text-sm font-bold text-foreground">
                      {leads.filter(l => l.lead_score > 0).length} / {leads.filter(l => l.status === 'Qualified').length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span>Daily Reports</span>
                    <span className="block text-sm font-bold text-foreground">{reports.length}</span>
                  </div>
                  <div className="space-y-1">
                    <span>Closed Clients</span>
                    <span className="block text-sm font-bold text-foreground">{clients.length}</span>
                  </div>
                  <div className="space-y-1">
                    <span>Target Goal</span>
                    <span className="block text-sm font-bold text-neon-purple">
                      ${profile?.target_monthly_revenue?.toLocaleString() || '10,000'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span>Current Revenue</span>
                    <span className="block text-sm font-bold text-neon-cyan">
                      ${profile?.current_monthly_revenue?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Neural Autonomy Control Panel */}
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              className="lg:col-span-5 glass-card p-6 relative overflow-hidden flex flex-col justify-between gap-4"
            >
              <div className="absolute top-0 left-[12%] right-[12%] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), transparent)' }} />
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-neon-purple">
                  <Sparkles size={16} />
                  <h4 className="font-mono text-sm font-bold uppercase tracking-wider">FRIDAY OS Autonomous Core</h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When enabled, Veltrix AI Agents commit actions directly to the Supabase database. Cold outreach will bypass reviews, proposals will auto-dispatch, and client status updates will commit automatically.
                </p>
              </div>

              {/* Custom Cyber Toggle Switch */}
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl relative overflow-hidden">
                <div className="space-y-1">
                  <span className="font-mono text-xs font-bold text-foreground block uppercase tracking-wider">
                    {autonomous ? '⚡ ACTIVE AUTONOMY' : '🔒 STAGED APPROVALS'}
                  </span>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    {autonomous ? 'Agents write direct to DB' : 'Agents create draft tasks'}
                  </span>
                </div>
                <button
                  onClick={() => setAutonomous(!autonomous)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none cursor-pointer ${
                    autonomous ? 'bg-neon-purple shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autonomous ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </motion.div>
          </div>

          {/* AI Business Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 font-sans">
            {Object.keys(AGENTS).map(key => {
              const agent = AGENTS[key];
              const isExpanded = expandedAgent === key;
              const isRunning = executingAgent === key;

              return (
                <motion.div
                  key={key}
                  whileHover={!isExpanded ? { y: -4 } : {}}
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
                  className={`relative glass-card p-6 flex flex-col justify-between overflow-hidden transition-all duration-300 ${
                    isExpanded
                      ? 'col-span-1 md:col-span-2 lg:col-span-3 border-neon-purple/35 shadow-[0_0_32px_rgba(168,85,247,0.18),0_0_0_1px_rgba(168,85,247,0.2)]'
                      : 'hover:border-neon-purple/20 hover:shadow-[0_16px_48px_rgba(0,0,0,0.5),0_0_24px_rgba(168,85,247,0.1)]'
                  }`}
                  style={isExpanded ? { borderColor: 'rgba(168,85,247,0.35)' } : {}}
                >
                  {/* Top accent line on each agent card */}
                  <div className="absolute top-0 left-[15%] right-[15%] h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.45), transparent)' }} />
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 text-neon-purple">
                        <Cpu size={16} />
                        <h4 className="font-mono text-sm font-bold uppercase tracking-wider">{agent.name}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-mono text-muted-foreground uppercase">
                        {agent.role}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">{agent.systemPrompt.replace(/You are/i, 'Acts as')}</p>

                    <div className="mb-4">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase block mb-1">Actions Capable:</span>
                      <div className="flex flex-wrap gap-1">
                        {agent.actions.map(act => (
                          <span key={act} className="px-2 py-0.5 rounded bg-neon-purple/10 border border-neon-purple/15 text-neon-purple font-mono text-[9px]">
                            {act}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-white/5">
                    {isExpanded ? (
                      <div className="space-y-4 bg-white/2 p-4 rounded border border-white/5">
                        <h5 className="font-mono text-xs font-bold text-neon-purple uppercase">Execute Parameters</h5>
                        
                        {renderAgentInputs(key)}

                        {isRunning && (
                          <div className="space-y-2 mt-4">
                            <label className="block text-[10px] font-mono text-neon-purple uppercase animate-pulse">
                              ⚡ System Executing Sequence...
                            </label>
                            <div className="p-4 bg-[#030305] border border-neon-purple/20 rounded font-mono text-[11px] text-foreground h-44 overflow-y-auto space-y-1 select-none">
                              {terminalLogs.map((log, index) => (
                                <div key={index} className="flex items-start space-x-1.5">
                                  <span className="text-neon-cyan select-none">{'>'}</span>
                                  <span className="text-slate-300 leading-normal">{log}</span>
                                </div>
                              ))}
                              {/* Blinking cursor */}
                              <div className="flex items-center space-x-1.5 animate-pulse">
                                <span className="text-neon-purple select-none">{'>'}</span>
                                <span className="w-1.5 h-3 bg-neon-purple inline-block"></span>
                              </div>
                            </div>
                          </div>
                        )}

                        {executionResult && !isRunning && (
                          <div className="space-y-2 mt-4">
                            <label className="block text-[10px] font-mono text-neon-cyan uppercase">Execution Output</label>
                            <pre className="p-3 bg-cyber-bg border border-white/10 rounded font-mono text-xs text-foreground overflow-x-auto whitespace-pre-wrap select-text leading-relaxed max-h-60 overflow-y-auto">
                              {executionResult}
                            </pre>
                          </div>
                        )}

                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setExpandedAgent(null)}
                            className="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 font-mono text-[10px] text-muted-foreground transition cursor-pointer"
                          >
                            CLOSE
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExecuteAgent(key)}
                            disabled={isRunning}
                            className="px-4 py-1.5 bg-neon-purple hover:bg-neon-purple/80 text-white rounded font-mono font-bold text-[10px] flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                          >
                            <Play size={10} className={isRunning ? 'animate-spin' : ''} />
                            <span>{isRunning ? 'RUNNING AGENT...' : 'EXECUTE RUN'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleAskAgent(agent.name)}
                          className="py-1.5 border border-white/10 hover:bg-white/5 hover:border-white/20 rounded font-mono font-bold text-[10px] text-foreground flex items-center justify-center space-x-1 transition cursor-pointer"
                        >
                          <Terminal size={11} />
                          <span>ASK AGENT</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRunAgentConfig(key)}
                          className="py-1.5 bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/20 hover:border-neon-purple/35 rounded font-mono font-bold text-[10px] text-neon-purple flex items-center justify-center space-x-1 transition cursor-pointer"
                        >
                          <Play size={10} />
                          <span>RUN AGENT</span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
