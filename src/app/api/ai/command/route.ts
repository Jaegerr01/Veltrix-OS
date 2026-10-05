import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { classifyRequest, executeAgent } from '@/lib/agents/router';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rateLimit';
import { aiErrorResponse } from '@/lib/api/aiErrors';

const bodySchema = z.object({ message: z.string().trim().min(1, 'Message is required.').max(4000) });

/** Ask ONE advisor agent (no task execution). Real AI answer or an explicit error. */
export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = await checkRateLimit(auth.user.id, { limit: 20, windowMs: 60_000, failClosed: true });
  if (!rl.allowed) return rateLimitResponse(rl);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
  const message = parsed.data.message;

  try {
    await db.addChatMessage({ sender: 'user', message });
    const recent = (await db.getChatMessages()).slice(-10).map(m => ({ sender: m.sender, message: m.message }));
    const agentKey = await classifyRequest(message);
    const aiResponse = await executeAgent(agentKey, message, recent);
    const newMsg = await db.addChatMessage({ sender: 'ai', agentName: aiResponse.agentName, message: aiResponse.text });
    await db.logAgentAction(aiResponse.agentName, 'Command Center Direct Routing', `message=${message.substring(0, 100)}`, aiResponse.text, 'Success');
    return NextResponse.json({ success: true, message: newMsg });
  } catch (error) {
    return aiErrorResponse(error);
  }
}
