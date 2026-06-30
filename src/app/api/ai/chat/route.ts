import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classifyRequest, executeAgent } from '@/lib/agents/router';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = checkRateLimit(auth.user.id);
  if (!rl.allowed) return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });

  try {
    const { message, voiceMode } = await req.json();
    if (!message) {
      return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
    }

    // Save user message to database
    await db.addChatMessage({
      sender: 'user',
      message
    });

    // Fetch conversation history
    const allMessages = await db.getChatMessages();
    // Format history for Gemini API (keep recent 10 messages for token efficiency)
    const recentMessages = allMessages.slice(-10).map(m => ({
      sender: m.sender,
      message: m.message
    }));

    // Classify user message to determine target agent
    const agentKey = await classifyRequest(message);

    const voiceHint = voiceMode
      ? `VOICE MODE — ARIA IDENTITY: You are ARIA, the sharp and quietly witty personal AI for VELTRIX. Your voice output rules are absolute:
1. Respond in exactly 1-2 short spoken sentences — never more.
2. Write the way a sharp professional actually speaks: contractions (I've, it's, we're, that's), natural rhythm, no jargon dumps.
3. Zero markdown. No asterisks, no bullet points, no headers, no dashes, no numbered lists. Plain spoken English only.
4. Lead with the answer — don't start with filler like "Sure!" or "Great question!" or "Of course."
5. Numbers spoken out: "$6,000" becomes "six thousand dollars", "429" becomes "four twenty nine".
6. Keep it under 25 words if you can. Punchy. Confident. Human.`
      : undefined;

    // Call dynamic agent execution
    const aiResponse = await executeAgent(agentKey, message, recentMessages, voiceHint);

    let updatedText = aiResponse.text;
    const runAgentRegex = /\[RUN_AGENT:\s*(\w+),\s*({[^\]]+})\]/g;
    const matches: { full: string; key: string; paramsStr: string }[] = [];
    let match;

    while ((match = runAgentRegex.exec(aiResponse.text)) !== null) {
      matches.push({
        full: match[0],
        key: match[1],
        paramsStr: match[2]
      });
    }

    if (matches.length > 0) {
      const { runAgentLogic } = await import('@/lib/agents/executor');
      const { AGENTS } = await import('@/lib/agents/agents');
      const executionLogs: string[] = [];

      for (const m of matches) {
        try {
          const parsedParams = JSON.parse(m.paramsStr);
          const subAgentName = AGENTS[m.key]?.name || m.key;

          const runRes = await runAgentLogic(m.key, parsedParams, true);
          if (runRes.success) {
            executionLogs.push(`💬 ${runRes.result}`);
          } else {
            executionLogs.push(`⚠️ **${subAgentName}** encountered an issue: ${runRes.error}`);
          }
        } catch (err: any) {
          executionLogs.push(`⚠️ **Failed to coordinate with agent ${m.key}**: ${err.message}`);
        }
      }

      updatedText += `\n\n---\n\n### 👥 VELTRIX TEAM COLLABORATIVE WORKSPACE\n` + executionLogs.join('\n\n');
    }

    // Save AI response to database
    const newMsg = await db.addChatMessage({
      sender: 'ai',
      agentName: aiResponse.agentName,
      message: updatedText
    });

    // Log action in agent_logs
    await db.logAgentAction(
      aiResponse.agentName,
      'Chat Response Routed',
      `message=${message.substring(0, 100)}`,
      updatedText,
      'Success'
    );

    return NextResponse.json({ success: true, message: newMsg });
  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
