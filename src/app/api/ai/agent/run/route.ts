import { NextResponse } from 'next/server';
import { runAgentLogic } from '@/lib/agents/executor';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = checkRateLimit(auth.user.id);
  if (!rl.allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });
  try {
    const body = await req.json().catch(() => ({}));
    const agentKey = body.agentKey || '';
    const params = body.params || {};
    const autonomous = body.autonomous || false;

    const res = await runAgentLogic(agentKey, params, autonomous);
    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, result: res.result, simulated: res.simulated });
  } catch (error: any) {
    console.error('Error running agent in route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
