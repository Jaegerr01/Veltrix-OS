import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gemini } from '@/lib/gemini';

export async function POST() {
  try {
    const profile = await db.getBusinessProfile();
    const leads = await db.getLeads();
    const goals = await db.getGoals();
    const memories = await db.getMemories();
    const reports = await db.getDailyReports();

    // Check if report already exists for today to avoid duplication
    const todayStr = new Date().toISOString().split('T')[0];
    const existing = reports.find(r => r.report_date === todayStr);

    if (existing) {
      return NextResponse.json({ success: true, report: existing, cached: true });
    }

    // Filter leads that are active in the CRM
    const activeLeads = leads.slice(0, 10);
    // Pipeline value is sum of qualified/proposal leads estimated deal value
    // (Website refresh is $1200, AI receptionist is $1000, growth is $2000)
    let pipelineValue = 0;
    leads.forEach(l => {
      if (['Qualified', 'Contacted', 'Replied', 'Call Booked', 'Proposal Sent'].includes(l.status)) {
        if (l.notes?.toLowerCase().includes('website') || l.notes?.toLowerCase().includes('brand')) {
          pipelineValue += 1200;
        } else if (l.notes?.toLowerCase().includes('receptionist') || l.notes?.toLowerCase().includes('bot')) {
          pipelineValue += 1000;
        } else {
          pipelineValue += 1500;
        }
      }
    });

    // Call Gemini
    const reportText = await gemini.generateDailyReport(
      profile.target_monthly_revenue,
      profile.current_monthly_revenue,
      pipelineValue,
      activeLeads,
      memories
    );

    // Parse the report text to extract fields for database insertion
    const lines = reportText.split('\n');
    let topPriority = 'Review qualified leads and outline sales scripts.';
    let leadsToContact: string[] = [];
    let followupsDue: string[] = [];
    let contentToPost = 'Draft LinkedIn hook for business AI.';
    let recommendedAction = 'Contact dentist leads.';

    // Very simple parsing helper
    let section = '';
    lines.forEach(line => {
      const trimLine = line.trim();
      if (trimLine.startsWith('Today’s Top Priority:')) {
        section = 'priority';
      } else if (trimLine.startsWith('Leads to Contact:')) {
        section = 'leads';
      } else if (trimLine.startsWith('Follow-ups Due:')) {
        section = 'followups';
      } else if (trimLine.startsWith('Content to Post:')) {
        section = 'content';
      } else if (trimLine.startsWith('Recommended Action:')) {
        section = 'action';
      } else if (trimLine.startsWith('Risk / Blocker:') || trimLine.startsWith('Next Step:') || trimLine.startsWith('Revenue Target:') || trimLine.startsWith('Closed Revenue:') || trimLine.startsWith('Pipeline Value:') || trimLine.startsWith('Revenue Gap:')) {
        section = '';
      } else {
        if (section === 'priority' && trimLine) {
          topPriority = trimLine;
        } else if (section === 'leads' && trimLine.match(/^\d+\./)) {
          leadsToContact.push(trimLine.replace(/^\d+\.\s*/, ''));
        } else if (section === 'followups' && trimLine.match(/^\d+\./)) {
          followupsDue.push(trimLine.replace(/^\d+\.\s*/, ''));
        } else if (section === 'content' && trimLine) {
          contentToPost = trimLine;
        } else if (section === 'action' && trimLine) {
          recommendedAction = trimLine;
        }
      }
    });

    const newReport = await db.addDailyReport({
      report_date: todayStr,
      revenue_target: profile.target_monthly_revenue,
      closed_revenue: profile.current_monthly_revenue,
      pipeline_value: pipelineValue,
      revenue_gap: profile.target_monthly_revenue - profile.current_monthly_revenue,
      top_priority: topPriority,
      leads_to_contact: leadsToContact.slice(0, 3),
      followups_due: followupsDue.slice(0, 2),
      content_to_post: contentToPost,
      recommended_action: recommendedAction
    });

    // Save report copy as a business memory
    await db.addMemory({
      type: 'Decision',
      content: `Veltrix Daily Command Report generated for ${todayStr}. Recommended action: ${recommendedAction}`,
      tags: ['daily-report', 'automated'],
      importance: 6,
      source: 'AI CEO'
    });

    // Log the agent action
    await db.logAgentAction(
      'CEO Agent',
      'Generate Daily Command Report',
      `date=${todayStr}`,
      reportText,
      'Success'
    );

    // Automatically create tasks recommended in the report
    await db.addTask({
      agent_name: 'Outreach Agent',
      title: `Perform recommended action: ${recommendedAction.substring(0, 70)}...`,
      description: `Recommended in Daily Report: ${recommendedAction}. Address leads: ${leadsToContact.join(', ')}`,
      priority: 'High',
      status: 'Pending',
      due_date: todayStr
    });

    return NextResponse.json({ success: true, report: newReport, rawText: reportText });
  } catch (error: any) {
    console.error('Error generating daily report API:', error);
    try {
      const profile = await db.getBusinessProfile();
      const leads = await db.getLeads();
      const todayStr = new Date().toISOString().split('T')[0];

      let pipelineValue = 0;
      leads.forEach(l => {
        if (['Qualified', 'Contacted', 'Replied', 'Call Booked', 'Proposal Sent'].includes(l.status)) {
          if (l.notes?.toLowerCase().includes('website') || l.notes?.toLowerCase().includes('brand')) {
            pipelineValue += 1200;
          } else if (l.notes?.toLowerCase().includes('receptionist') || l.notes?.toLowerCase().includes('bot')) {
            pipelineValue += 1000;
          } else {
            pipelineValue += 1500;
          }
        }
      });

      const reportText = `
VELTRIX Daily Command Report

Revenue Target:
$${profile?.target_monthly_revenue || 6000}

Closed Revenue:
$${profile?.current_monthly_revenue || 0}

Pipeline Value:
$${pipelineValue}

Revenue Gap:
$${Math.max(0, (profile?.target_monthly_revenue || 6000) - (profile?.current_monthly_revenue || 0))}

Today’s Top Priority:
Qualify and follow up with all active leads in CRM to close the gap.

Leads to Contact:
${leads.length > 0 ? leads.slice(0, 3).map((l, idx) => `${idx + 1}. ${l.business_name} (Reason: CRM active deal)`).join('\n') : '1. Add local service leads (e.g. Dentists)'}

Follow-ups Due:
${leads.length > 0 ? leads.slice(0, 2).map((l, idx) => `${idx + 1}. ${l.business_name} (Action: Day 3 follow-up)`).join('\n') : '1. Check calendar reminders'}

Content to Post:
Stop losing 20% of your appointments to after-hours missed calls. Deploy an AI booking agent.

Recommended Action:
${leads.length > 0 ? `Review the qualification parameters for ${leads[0].business_name} and customize outreach.` : 'Add fresh local leads to potential clients list.'}

Risk / Blocker:
Gemini API connection error (${error.message}). Running in fallback simulation mode.

Next Step:
Access CRM potential clients page.
`;

      const lines = reportText.split('\n');
      let topPriority = 'Qualify and follow up with all active leads in CRM to close the gap.';
      let leadsToContact: string[] = [];
      let followupsDue: string[] = [];
      let contentToPost = 'Leverage AI receptionists to prevent after-hour appointment leaks.';
      let recommendedAction = 'Review qualification parameters and customize outreach.';

      let section = '';
      lines.forEach(line => {
        const trimLine = line.trim();
        if (trimLine.startsWith('Today’s Top Priority:')) {
          section = 'priority';
        } else if (trimLine.startsWith('Leads to Contact:')) {
          section = 'leads';
        } else if (trimLine.startsWith('Follow-ups Due:')) {
          section = 'followups';
        } else if (trimLine.startsWith('Content to Post:')) {
          section = 'content';
        } else if (trimLine.startsWith('Recommended Action:')) {
          section = 'action';
        } else if (trimLine.startsWith('Risk / Blocker:') || trimLine.startsWith('Next Step:') || trimLine.startsWith('Revenue Target:') || trimLine.startsWith('Closed Revenue:') || trimLine.startsWith('Pipeline Value:') || trimLine.startsWith('Revenue Gap:')) {
          section = '';
        } else {
          if (section === 'priority' && trimLine) {
            topPriority = trimLine;
          } else if (section === 'leads' && trimLine.match(/^\d+\./)) {
            leadsToContact.push(trimLine.replace(/^\d+\.\s*/, ''));
          } else if (section === 'followups' && trimLine.match(/^\d+\./)) {
            followupsDue.push(trimLine.replace(/^\d+\.\s*/, ''));
          } else if (section === 'content' && trimLine) {
            contentToPost = trimLine;
          } else if (section === 'action' && trimLine) {
            recommendedAction = trimLine;
          }
        }
      });

      const newReport = await db.addDailyReport({
        report_date: todayStr,
        revenue_target: profile?.target_monthly_revenue || 6000,
        closed_revenue: profile?.current_monthly_revenue || 0,
        pipeline_value: pipelineValue,
        revenue_gap: Math.max(0, (profile?.target_monthly_revenue || 6000) - (profile?.current_monthly_revenue || 0)),
        top_priority: topPriority,
        leads_to_contact: leadsToContact.slice(0, 3),
        followups_due: followupsDue.slice(0, 2),
        content_to_post: contentToPost,
        recommended_action: recommendedAction
      });

      await db.addMemory({
        type: 'Decision',
        content: `Veltrix Daily Report simulated for ${todayStr}. Recommended: ${recommendedAction}`,
        tags: ['daily-report', 'automated', 'offline-fallback'],
        importance: 5,
        source: 'AI CEO Simulator'
      });

      await db.logAgentAction(
        'CEO Agent',
        'Generate Daily Command Report Fallback',
        `date=${todayStr}, error=${error.message}`,
        reportText,
        'Success'
      );

      await db.addTask({
        agent_name: 'Outreach Agent',
        title: `Perform action: ${recommendedAction.substring(0, 70)}...`,
        description: `Simulated Daily Report suggestion: ${recommendedAction}. Leads: ${leadsToContact.join(', ')}`,
        priority: 'High',
        status: 'Pending',
        due_date: todayStr
      });

      return NextResponse.json({ success: true, report: newReport, rawText: reportText, simulated: true });
    } catch (fallbackError) {
      console.error('Offline report compilation failed:', fallbackError);
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
