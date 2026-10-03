import { z } from 'zod';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gemini } from '@/lib/ai/gemini';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';
import { sendEmail as deliverEmail } from '@/lib/email/send';

function estimateMonthlySaving(servicePurchased: string): number {
  const s = (servicePurchased || '').toLowerCase();
  if (s.includes('receptionist') || s.includes('booking')) return 1000;
  if (s.includes('growth') || s.includes('package')) return 750;
  return 500; // website / brand default. ASSUMPTION, not a measurement - labelled as such in the report.
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  const rl = await checkRateLimit(`roi:${auth.user.id}`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded.' }, { status: 429 });
  }

  let clientId = '';
  let sendEmail = false;

  try {
    const parsedBody = z.object({ clientId: z.string().min(1).max(100), sendEmail: z.boolean().optional() }).safeParse(await req.json().catch(() => null));
    clientId = parsedBody.success ? parsedBody.data.clientId : '';
    sendEmail = parsedBody.success && parsedBody.data.sendEmail === true;

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'clientId is required.' }, { status: 400 });
    }

    // Load client
    const clients = await db.getClients();
    const client = clients.find(c => c.id === clientId);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found.' }, { status: 404 });
    }

    // Load linked projects
    const allProjects = await db.getProjects();
    const projects = allProjects.filter(p => p.client_id === clientId);
    const latestProject = projects[0] ?? null;

    // Load linked tasks
    const allTasks = await db.getTasks();
    const tasks = allTasks.filter(t => t.related_client_id === clientId);
    const tasksTotal = tasks.length;
    const tasksCompleted = tasks.filter(t => t.status === 'Completed').length;

    // Load revenue records for this client
    const allRevenue = await db.getRevenue();
    const revenues = allRevenue.filter(r => r.client_id === clientId);
    const paidRevenue = revenues
      .filter(r => r.status === 'Paid')
      .reduce((acc, r) => acc + Number(r.amount), 0);

    // Compute metrics
    const monthsActive = Math.max(
      1,
      Math.ceil((Date.now() - new Date(client.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))
    );
    const retainerTotal = client.monthly_retainer * monthsActive;
    const lifetimeValue = Math.max(paidRevenue || client.total_value + retainerTotal, 1);
    const estimatedMonthlySaving = estimateMonthlySaving(client.service_purchased || '');
    const estimatedTotalValue = estimatedMonthlySaving * monthsActive;
    const estimatedRoiPct = Math.round(((estimatedTotalValue - lifetimeValue) / lifetimeValue) * 100);
    const completionRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 100;
    const projectStatus = latestProject?.status ?? 'Completed';

    const metrics = {
      setup_paid: client.total_value,
      monthly_retainer: client.monthly_retainer,
      months_active: monthsActive,
      retainer_total: retainerTotal,
      lifetime_value: lifetimeValue,
      tasks_total: tasksTotal,
      tasks_completed: tasksCompleted,
      completion_rate: completionRate,
      project_status: projectStatus,
      estimated_monthly_saving: estimatedMonthlySaving,
      estimated_roi_pct: estimatedRoiPct,
    };

    // Generate AI narrative
    let narrative = '';
    try {
      narrative = await gemini.generateRoiReport({
        clientName: client.business_name,
        servicePurchased: client.service_purchased || 'AI Solution',
        setupFee: client.total_value,
        monthlyRetainer: client.monthly_retainer,
        monthsActive,
        projectStatus,
        tasksCompleted,
        tasksTotal,
        estimatedMonthlySaving,
        estimatedRoiPct,
      });
    } catch (aiErr) {
      console.warn('Gemini unavailable for ROI report — using fallback:', aiErr);
      narrative = `${client.business_name} has been an active PostelOS client for ${monthsActive} month${monthsActive !== 1 ? 's' : ''}, with ${client.service_purchased || 'an AI solution'} deployed and ${completionRate}% of project milestones completed. The investment of $${lifetimeValue.toLocaleString()} has been put to work across ${tasksTotal} delivery tasks, with an ASSUMED (not measured) value of ~$${estimatedMonthlySaving.toLocaleString()}/month in operational value — representing a projected ${estimatedRoiPct > 0 ? '+' : ''}${estimatedRoiPct}% ROI on the engagement. To maximise results further, we recommend scheduling a performance review call to identify the next high-impact automation opportunity.`;
    }

    const report = {
      client,
      metrics,
      narrative,
      generated_at: new Date().toISOString(),
    };

    // Log agent action
    await db.logAgentAction(
      'Value Analyst',
      'Generate Client ROI Report',
      `clientId=${clientId}, name=${client.business_name}`,
      `ROI: ${estimatedRoiPct}%, months active: ${monthsActive}`,
      'Success'
    );

    // Optional: send report email to client
    let emailDelivered = false;
    let emailError: string | undefined;
    let emailMessageId: string | undefined;
    if (sendEmail && !client.email) emailError = 'This client has no email address on file.';
    if (sendEmail && client.email) {
      {
        try {
          const emailBody = [
            `Hi ${client.contact_name || client.business_name},`,
            '',
            narrative,
            '',
            '── Key Numbers ──',
            `Service:               ${client.service_purchased || 'AI Solution'}`,
            `Months Active:         ${monthsActive}`,
            `Milestones Complete:   ${tasksCompleted}/${tasksTotal} (${completionRate}%)`,
            `Assumed Monthly Value (not measured): ~$${estimatedMonthlySaving.toLocaleString()}`,
            `Projected ROI:         ${estimatedRoiPct > 0 ? '+' : ''}${estimatedRoiPct}%`,
            '',
            'Powered by PostelOS',
          ].join('\n');

          const sent = await deliverEmail({
            to: client.email,
            kind: 'transactional',
            unsubscribe: false,
            subject: `Your PostelOS ROI Summary — ${client.business_name}`,
            text: emailBody,
          });

          if (sent.delivered) {
            emailDelivered = true;
            emailMessageId = sent.messageId;
          } else {
            emailError = sent.reason || 'The email provider rejected the message.';
          }
        } catch (sendErr: any) {
          console.warn('Failed to send ROI report email:', sendErr);
          emailError = sendErr?.message || 'Email send failed.';
        }
      }
    }

    return NextResponse.json({ success: true, report, emailDelivered, emailError, emailMessageId });
  } catch (error: any) {
    console.error('Error generating ROI report:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
