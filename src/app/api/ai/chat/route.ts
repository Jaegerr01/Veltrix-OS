import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { classifyRequest, executeAgent } from '@/lib/agents/router';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
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

    // Call dynamic agent execution
    const aiResponse = await executeAgent(agentKey, message, recentMessages);

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
          executionLogs.push(`Coordinating with **${subAgentName}**...`);
          
          const runRes = await runAgentLogic(m.key, parsedParams, true);
          if (runRes.success) {
            executionLogs.push(`**${subAgentName} Run Complete**:\n${runRes.result}`);
          } else {
            executionLogs.push(`**${subAgentName} Run Failed**: ${runRes.error}`);
          }
        } catch (err: any) {
          executionLogs.push(`**Failed to execute agent ${m.key}**: ${err.message}`);
        }
      }

      updatedText += `\n\n---\n\n### ⚡ FRIDAY Autonomous Coordination Logs\n` + executionLogs.map(log => `- ${log}`).join('\n\n');
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
