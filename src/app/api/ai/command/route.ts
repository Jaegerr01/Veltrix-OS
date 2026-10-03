import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classifyRequest, executeAgent } from '@/lib/agents/router';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';
import { validateText, badRequest, LIMITS } from '@/lib/validation';

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = await checkRateLimit(auth.user.id);
  if (!rl.allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });

  try {
    const body = await req.json().catch(() => ({}));
    const check = validateText(body.message, 'Message', { max: LIMITS.prompt });
    if (!check.ok) return badRequest(check.error);
    const message = check.value;

    // Save user message to database
    await db.addChatMessage({
      sender: 'user',
      message
    });

    // Fetch conversation history
    const allMessages = await db.getChatMessages();
    // Format history (keep recent 10 messages for token efficiency)
    const recentMessages = allMessages.slice(-10).map(m => ({
      sender: m.sender,
      message: m.message
    }));

    // Classify user command to determine target agent
    const agentKey = await classifyRequest(message);

    // Execute designated agent
    const aiResponse = await executeAgent(agentKey, message, recentMessages);

    // Save AI response to database
    const newMsg = await db.addChatMessage({
      sender: 'ai',
      agentName: aiResponse.agentName,
      message: aiResponse.text
    });

    // Log action in agent_logs
    await db.logAgentAction(
      aiResponse.agentName,
      'Command Center Direct Routing',
      `message=${message.substring(0, 100)}`,
      aiResponse.text,
      'Success'
    );

    return NextResponse.json({ success: true, message: newMsg });
  } catch (error: any) {
    console.error('Error in command API route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
