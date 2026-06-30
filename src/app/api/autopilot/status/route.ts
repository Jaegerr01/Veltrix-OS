import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/requireUser';

// GET /api/autopilot/status
// Returns live pipeline status for the dashboard
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  try {
    const [leads, activities, tasks, proposals] = await Promise.all([
      db.getLeads(),
      db.getAgentLogs(),
      db.getTasks(),
      db.getProposals()
    ]);

    // Pipeline breakdown
    const pipeline = {
      new: leads.filter(l => l.status === 'New').length,
      researched: leads.filter(l => l.status === 'Researched').length,
      qualified: leads.filter(l => l.status === 'Qualified').length,
      contacted: leads.filter(l => l.status === 'Contacted').length,
      replied: leads.filter(l => l.status === 'Replied').length,
      proposalSent: leads.filter(l => l.status === 'Proposal Sent').length,
      callBooked: leads.filter(l => l.status === 'Call Booked').length,
      won: leads.filter(l => l.status === 'Won').length,
      total: leads.length
    };

    // Last 10 agent activities
    const recentActivity = activities.slice(0, 10).map((a: any) => ({
      id: a.id,
      actor: a.agent_name || a.actor,
      action: a.action,
      status: a.status,
      createdAt: a.created_at
    }));

    // Last pipeline run
    const lastPipelineRun = (activities as any[]).find(a => a.action?.includes('Pipeline Completed'));

    // Active agents (activity in last hour)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const activeAgents = [...new Set(
      (activities as any[])
        .filter(a => a.created_at > oneHourAgo && a.agent_name !== 'Pipeline')
        .map(a => a.agent_name)
    )].slice(0, 5);

    // Pending tasks
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;

    return NextResponse.json({
      success: true,
      pipeline,
      recentActivity,
      lastPipelineRun: lastPipelineRun?.created_at || null,
      activeAgents,
      pendingTasks,
      completedTasks,
      totalProposals: proposals.length
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
