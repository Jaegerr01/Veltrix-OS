import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { executeAgent } from '@/lib/agents/router';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';

const DECK_PROMPTS: Record<string, string> = {
  'am-report':
    'Generate my morning AM Report: open with a sharp daily briefing on revenue status, top 3 priority actions, active leads to contact today, and the one move that will have the biggest impact on closing this week.',
  'inbox-brief':
    'Generate my Inbox Brief: summarize all leads that have replied or need a response, proposals awaiting feedback, follow-ups due today, and any client updates that need attention. Be concise and action-oriented.',
  'trend-scan':
    'Run a Trend Scan for VELTRIX this week: identify the top 3 emerging trends in AI automation, web design, and digital agency services, plus 2 content angle opportunities I can post about to position VELTRIX as the authority.',
  'plan-today':
    'Build my Plan for Today: given the current revenue gap, active leads, and pending tasks, lay out a prioritized daily schedule with 5 high-leverage actions in execution order. Include time estimates.',
  'wk-review':
    'Generate my Weekly Review: summarize this week\'s wins, revenue progress vs target, pipeline movement, tasks completed vs pending, biggest lesson learned, and the top goal for next week. Be direct and data-driven.',
};

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = checkRateLimit(auth.user.id);
  if (!rl.allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });

  try {
    const { command } = await req.json();
    const prompt = DECK_PROMPTS[command];
    if (!prompt) {
      return NextResponse.json({ success: false, error: `Unknown command: ${command}` }, { status: 400 });
    }

    const response = await executeAgent('ceo', prompt, []);

    await db.logAgentAction(
      'CEO Agent',
      `Command Deck: ${command}`,
      command,
      response.text,
      'Success'
    );

    await db.addChatMessage({ sender: 'ai', agentName: response.agentName, message: response.text });

    return NextResponse.json({ success: true, command, result: response.text, agentName: response.agentName });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
