'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { Lead, Task, BusinessProfile, DailyReport, Revenue, Proposal, Followup } from '@/lib/types';
import { AGENTS } from '@/lib/agents/agents';
import DashboardCard from '@/components/DashboardCard';
import RevenueProgress from '@/components/RevenueProgress';
import StatusBadge from '@/components/StatusBadge';
import LeadScoreBadge from '@/components/LeadScoreBadge';
import { 
  TrendingUp, 
  Users, 
  Trophy, 
  Clock, 
  Sparkles, 
  CheckSquare,
  ArrowRight,
  Plus,
  Cpu,
  DollarSign,
  Briefcase,
  FolderGit2,
  BrainCircuit,
  FileCode,
  Search,
  Target,
  Terminal,
  Play,
  FileText,
  RefreshCw,
  Send
} from 'lucide-react';
import Link from 'next/link';

const agentIcons: Record<string, React.ReactNode> = {
  ceo: <Sparkles size={16} />,
  revenue: <DollarSign size={16} />,
  sales: <Target size={16} />,
  leadResearch: <Search size={16} />,
  outreach: <Send size={16} />,
  followup: <RefreshCw size={16} />,
  proposal: <FileText size={16} />,
  content: <FileCode size={16} />,
  delivery: <Briefcase size={16} />,
  memory: <BrainCircuit size={16} />
};

export default function Dashboard() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const bp = await db.getBusinessProfile();
      const lds = await db.getLeads();
      const tks = await db.getTasks();
      const rps = await db.getDailyReports();
      const revs = await db.getRevenue();
      const props = await db.getProposals();
      const fups = await db.getFollowups();
      
      setProfile(bp);
      setLeads(lds);
      setTasks(tks);
      setReports(rps);
      setRevenues(revs);
      setProposals(props);
      setFollowups(fups);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full border-4 border-t-neon-purple border-white/5 w-12 h-12 mb-4" />
        <span className="font-mono text-xs text-neon-purple animate-pulse-glow">GETTING YOUR DASHBOARD READY...</span>
      </div>
    );
  }

  // Calculate statistics dynamically from Supabase/LocalStorage
  const targetRevenue = profile?.target_monthly_revenue || 6000;
  
  // Closed Revenue is calculated fromPaid revenues
  const closedRevenue = revenues
    .filter(r => r.status === 'Paid')
    .reduce((acc, r) => acc + Number(r.amount), 0);

  const revenueGap = Math.max(0, targetRevenue - closedRevenue);

  // Pipeline Value is calculated from pricing of Draft/Sent/Accepted proposals
  const pipelineValue = proposals
    .filter(p => ['Draft', 'Sent', 'Accepted'].includes(p.status))
    .reduce((acc, p) => acc + Number(p.price), 0);

  const bookedCalls = leads.filter(l => l.status === 'Call Booked').length;
  const proposalsSent = leads.filter(l => l.status === 'Proposal Sent').length;
  const dealsWon = leads.filter(l => l.status === 'Won').length;
  
  // Tasks due today
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingTasks = tasks.filter(t => t.status !== 'Completed');
  const tasksDueToday = pendingTasks.filter(t => t.due_date === todayStr);
  const todayTasksList = tasksDueToday.length > 0 ? tasksDueToday.slice(0, 3) : pendingTasks.slice(0, 3);
  
  // Followups due today
  const followupsDueToday = followups.filter(f => f.status === 'Pending' && f.followup_date === todayStr).length;

  // Latest report
  const latestReport = reports[0];

  const percentage = targetRevenue > 0 ? Math.round((closedRevenue / targetRevenue) * 100) : 0;

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome banner & Quick AI recommendation */}
      <div className="glass-panel p-6 border border-white/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neon-purple/5 to-neon-cyan/5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Welcome to <span className="font-mono text-neon-purple tracking-widest">VELTRIX OS</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tracking your progress toward your monthly earnings target.
          </p>
        </div>

        {/* Highlight action card */}
        <div className="flex items-center space-x-3 p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-lg max-w-md">
          <div className="p-2 bg-neon-purple/20 text-neon-purple rounded">
            <Sparkles size={18} className="animate-pulse-glow" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-neon-purple uppercase font-bold tracking-widest block">AI Tip for Today</span>
            <span className="text-xs text-foreground font-medium block leading-tight">
              {latestReport?.recommended_action 
                ? latestReport.recommended_action 
                : 'Review new interested leads and generate custom proposals to close the gap.'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Earnings Goal" 
          value={`$${targetRevenue.toLocaleString()}`}
          icon={<TrendingUp size={20} />} 
          description={`Left to go: $${revenueGap.toLocaleString()}`}
          borderAccent="purple"
        />
        <DashboardCard 
          title="Money Earned" 
          value={`$${closedRevenue.toLocaleString()}`}
          icon={<Trophy size={20} />} 
          description="Paid client contracts"
          trend={`${percentage}% of goal`}
          borderAccent="green"
        />
        <DashboardCard 
          title="Potential Sales Value" 
          value={`$${pipelineValue.toLocaleString()}`}
          icon={<TrendingUp size={20} />} 
          description="Active proposals & quotes"
          trend={`$${(pipelineValue + closedRevenue).toLocaleString()} estimated total`}
          borderAccent="cyan"
        />
        <DashboardCard 
          title="Potential Clients" 
          value={leads.length}
          icon={<Users size={20} />} 
          description={`Calls booked: ${bookedCalls} | Quotes sent: ${proposalsSent} | Won: ${dealsWon}`}
          trend={`${leads.filter(l => l.lead_score >= 8).length} Top Fits`}
          borderAccent="orange"
        />
      </div>

      {/* Dynamic Status Pipeline Overview */}
      <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30 space-y-4">
        <div>
          <h3 className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Live Lead Pipeline Status Counts
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Grounded in the real Supabase leads database table.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 text-center font-mono">
          <div className="p-3 bg-white/5 rounded border border-white/5">
            <span className="text-[10px] text-muted-foreground block">TOTAL</span>
            <span className="text-lg font-bold text-foreground">{leads.length}</span>
          </div>
          <div className="p-3 bg-white/5 rounded border border-white/5">
            <span className="text-[10px] text-muted-foreground block text-neon-cyan">NEW</span>
            <span className="text-lg font-bold text-neon-cyan">{leads.filter(l => l.status === 'New').length}</span>
          </div>
          <div className="p-3 bg-white/5 rounded border border-white/5">
            <span className="text-[10px] text-muted-foreground block text-neon-purple">CONTACTED</span>
            <span className="text-lg font-bold text-neon-purple">{leads.filter(l => l.status === 'Contacted').length}</span>
          </div>
          <div className="p-3 bg-white/5 rounded border border-white/5">
            <span className="text-[10px] text-muted-foreground block text-neon-purple">REPLIED</span>
            <span className="text-lg font-bold text-neon-purple">{leads.filter(l => l.status === 'Replied').length}</span>
          </div>
          <div className="p-3 bg-white/5 rounded border border-white/5">
            <span className="text-[10px] text-muted-foreground block text-neon-pink">BOOKED</span>
            <span className="text-lg font-bold text-neon-pink">{bookedCalls}</span>
          </div>
          <div className="p-3 bg-white/5 rounded border border-white/5">
            <span className="text-[10px] text-muted-foreground block text-neon-pink">PROPOSAL</span>
            <span className="text-lg font-bold text-neon-pink">{proposalsSent}</span>
          </div>
          <div className="p-3 bg-white/5 rounded border border-white/5">
            <span className="text-[10px] text-muted-foreground block text-neon-green">WON</span>
            <span className="text-lg font-bold text-neon-green">{dealsWon}</span>
          </div>
          <div className="p-3 bg-white/5 rounded border border-white/5">
            <span className="text-[10px] text-muted-foreground block text-red-400">LOST</span>
            <span className="text-lg font-bold text-red-400">{leads.filter(l => l.status === 'Lost').length}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-center">
          <div className="p-3 bg-neon-purple/5 rounded border border-neon-purple/20 flex flex-col justify-center">
            <span className="text-[10px] text-muted-foreground block uppercase">Tasks Due Today</span>
            <span className="text-lg font-bold text-neon-purple">{tasksDueToday.length}</span>
          </div>
          <div className="p-3 bg-neon-pink/5 rounded border border-neon-pink/20 flex flex-col justify-center">
            <span className="text-[10px] text-muted-foreground block uppercase">Follow-ups Due Today</span>
            <span className="text-lg font-bold text-neon-pink">{followupsDueToday}</span>
          </div>
        </div>
      </div>

      {/* Revenue progress graphs & formula models */}
      <RevenueProgress closedRevenue={closedRevenue} targetRevenue={targetRevenue} />

      {/* AI Business Agent Command Center */}
      <div className="space-y-4 my-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-neon-purple flex items-center gap-2">
              <Cpu size={16} className="animate-pulse-glow" />
              <span>AI Business Agent Command Center</span>
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Deploy specialized autonomous agents to drive your business funnel tasks.
            </p>
          </div>
          <Link 
            href="/command-center?tab=agents" 
            className="text-xs font-mono text-neon-purple hover:underline flex items-center space-x-1 cursor-pointer bg-neon-purple/10 border border-neon-purple/20 px-3 py-1.5 rounded-lg hover:bg-neon-purple/20 transition-all duration-200"
          >
            <span>Deploy Custom Run</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.keys(AGENTS).map((key) => {
            const agent = AGENTS[key];
            return (
              <div 
                key={key} 
                className="p-5 glass-panel border border-white/5 rounded-xl flex flex-col justify-between h-48 bg-cyber-bg/30 hover:border-neon-purple/40 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all duration-300 group"
              >
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="p-2 rounded bg-neon-purple/10 text-neon-purple group-hover:bg-neon-purple/25 transition-all duration-300">
                      {agentIcons[key] || <Cpu size={16} />}
                    </div>
                    <span className="flex items-center space-x-1 text-[9px] font-mono text-neon-green bg-neon-green/5 border border-neon-green/10 px-2 py-0.5 rounded-full">
                      <span className="w-1 h-1 rounded-full bg-neon-green animate-pulse-glow" />
                      <span>ONLINE</span>
                    </span>
                  </div>
                  <h4 className="font-mono text-xs font-bold text-foreground group-hover:text-neon-purple transition-colors duration-200">
                    {agent.name}
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-mono block mb-2">
                    {agent.role}
                  </span>
                  <p className="text-[11px] text-muted-foreground/80 leading-normal line-clamp-2">
                    {agent.systemPrompt.replace(/You are the /i, '').replace(/You are /i, '').split('.')[0]}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
                  <Link
                    href={`/command-center?ask=${key}`}
                    className="py-1.5 border border-white/10 hover:bg-white/5 rounded font-mono font-bold text-[9px] text-foreground flex items-center justify-center space-x-1 transition cursor-pointer"
                  >
                    <Terminal size={9} />
                    <span>CHAT</span>
                  </Link>
                  <Link
                    href={`/command-center?tab=agents&run=${key}`}
                    className="py-1.5 bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/25 rounded font-mono font-bold text-[9px] text-neon-purple flex items-center justify-center space-x-1 transition cursor-pointer"
                  >
                    <Play size={8} />
                    <span>RUN</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid for Quick Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
        {/* Hot Leads */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-neon-cyan flex items-center gap-2">
              <Users size={16} />
              <span>Best Matches (Potential Clients)</span>
            </h3>
            <Link 
              href="/leads" 
              className="text-xs font-mono text-neon-cyan hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>See All Leads</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-white/5 space-y-3">
            {leads.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground font-mono">
                No leads added yet.<br />
                <Link href="/leads" className="text-neon-cyan hover:underline mt-2 inline-block">
                  Add your first lead to start building your pipeline.
                </Link>
              </div>
            ) : (
              leads.filter(l => l.status !== 'Won' && l.status !== 'Lost').slice(0, 4).map((lead) => (
                <div key={lead.id} className="flex justify-between items-center pt-3 first:pt-0">
                  <div>
                    <span className="font-semibold text-xs block text-foreground">{lead.business_name}</span>
                    <span className="text-[10px] text-muted-foreground block font-mono">{lead.industry || 'Local service'} | {lead.location}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={lead.status} />
                    <LeadScoreBadge score={lead.lead_score} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Due Tasks */}
        <div className="glass-panel p-6 border border-white/5 rounded-xl bg-cyber-bg/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-neon-purple flex items-center gap-2">
              <CheckSquare size={16} />
              <span>Main To-Do Checklist</span>
            </h3>
            <Link 
              href="/tasks" 
              className="text-xs font-mono text-neon-purple hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>See To-Do List</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {todayTasksList.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground font-mono">
                No pending tasks found.<br />
                <Link href="/tasks" className="text-neon-purple hover:underline mt-2 inline-block">
                  Create a task checklist to get started!
                </Link>
              </div>
            ) : (
              todayTasksList.map((task) => (
                <div key={task.id} className="p-3 bg-white/2 rounded border border-white/5 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-xs text-foreground block">{task.title}</span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      Agent: {task.agent_name} | Priority: {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[10px] font-mono text-muted-foreground">
                    <Clock size={11} />
                    <span>{task.due_date || 'No Date'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
