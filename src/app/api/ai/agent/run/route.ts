import { NextResponse } from 'next/server';
import { runAgentLogic } from '@/lib/agents/executor';

export async function POST(req: Request) {
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
