import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generatePreCallBrief } from '@/lib/agents/pipeline';
import { requireUser } from '@/lib/auth/requireUser';

// POST /api/leads/[id]/book-call
// Marks a lead as "Call Booked" and immediately generates + emails a pre-call brief to Barry
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  const { id: leadId } = await params;

  try {
    // Update lead status
    await db.updateLead(leadId, { status: 'Call Booked' });

    // Fire brief generation (non-blocking)
    generatePreCallBrief(leadId).catch(err =>
      console.error('[BookCall] Brief generation failed:', err)
    );

    await db.logAgentAction(
      'CEO Agent',
      'Call Booked — Brief Generation Triggered',
      `leadId=${leadId}`,
      'Pre-call brief generation started',
      'Success'
    );

    return NextResponse.json({
      success: true,
      message: 'Lead marked as Call Booked. Pre-call brief is being generated and will be emailed to you.',
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
