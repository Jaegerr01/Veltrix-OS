import { NextResponse } from 'next/server';
import { generatePreCallBrief } from '@/lib/agents/pipeline';
import { requireUser } from '@/lib/auth/requireUser';

// POST /api/autopilot/client-brief
// Body: { leadId: string }
// Generates and emails a pre-call brief to Barry before a client call
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  try {
    const { leadId } = await req.json();
    if (!leadId) {
      return NextResponse.json({ success: false, error: 'leadId is required' }, { status: 400 });
    }

    const brief = await generatePreCallBrief(leadId);

    return NextResponse.json({
      success: true,
      brief,
      generatedAt: new Date().toISOString(),
      note: 'Brief saved to memory and emailed to Barry'
    });
  } catch (err: any) {
    console.error('[Client Brief] Failed:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
