import { buildBusinessContext } from '../context/buildBusinessContext';
import { gemini, isGeminiConfigured } from '../ai/gemini';
import { AGENTS } from './agents';
import { Lead, Task, Offer } from '../types';
import { db } from '../db';

// Helper: Classify query using keyword mapping as fallback
export function getFallbackAgent(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes('alex')) return 'ceo';
  if (msg.includes('marcus')) return 'revenue';
  if (msg.includes('sophia')) return 'sales';
  if (msg.includes('daniel')) return 'leadResearch';
  if (msg.includes('emma')) return 'outreach';
  if (msg.includes('lucas')) return 'followup';
  if (msg.includes('olivia')) return 'proposal';
  if (msg.includes('ryan')) return 'content';
  if (msg.includes('mia')) return 'delivery';
  if (msg.includes('leo')) return 'memory';
  if (msg.includes('harper')) return 'support';
  if (msg.includes('nova')) return 'reelIntel';

  if (msg.includes('revenue') || msg.includes('earn') || msg.includes('finance') || msg.includes('money') || msg.includes('gap') || msg.includes('target')) return 'revenue';
  if (msg.includes('outreach') || msg.includes('email') || msg.includes('contact') || msg.includes('message')) return 'outreach';
  if (msg.includes('proposal') || msg.includes('bid') || msg.includes('quote') || msg.includes('price')) return 'proposal';
  if (msg.includes('follow') || msg.includes('reminder') || msg.includes('fup')) return 'followup';
  if (msg.includes('score') || msg.includes('qualif') || msg.includes('research') || msg.includes('grade')) return 'leadResearch';
  if (msg.includes('sales') || msg.includes('close') || msg.includes('convert') || msg.includes('objection')) return 'sales';
  if (msg.includes('content') || msg.includes('post') || msg.includes('linkedin') || msg.includes('instagram') || msg.includes('social')) return 'content';
  if (msg.includes('project') || msg.includes('deliver') || msg.includes('checklist') || msg.includes('milestone')) return 'delivery';
  if (msg.includes('memory') || msg.includes('remember') || msg.includes('recall') || msg.includes('notes') || msg.includes('fact')) return 'memory';
  if (msg.includes('docs') || msg.includes('help') || msg.includes('support') || msg.includes('how to') || msg.includes('faq') || msg.includes('documentation') || msg.includes('question')) return 'support';
  if (msg.includes('reel') || msg.includes('reel intel') || msg.includes('analyze reel') || msg.includes('saved reel')) return 'reelIntel';
  return 'ceo';
}

export async function classifyRequest(message: string): Promise<string> {
  const cleanMsg = message.trim();

  const match = cleanMsg.match(/^(?:to\s+)?(?:the\s+)?([^:]+?)(?:\s+agent)?\s*:/i);
  if (match) {
    const targetName = match[1].trim().toLowerCase();
    const foundKey = Object.keys(AGENTS).find(key => {
      const agentName = AGENTS[key].name.toLowerCase();
      const firstWord = agentName.split(' ')[0].toLowerCase();
      return agentName === targetName || agentName.includes(targetName) || firstWord === targetName || key.toLowerCase() === targetName || AGENTS[key].role.toLowerCase() === targetName || AGENTS[key].role.toLowerCase().includes(targetName);
    });
    if (foundKey) return foundKey;
  }

  if (!isGeminiConfigured) return getFallbackAgent(cleanMsg);

  const prompt = `Classify the following user message to the correct business agent.
Choices: "ceo", "revenue", "sales", "leadResearch", "outreach", "followup", "proposal", "content", "delivery", "memory", "support", "reelIntel"
User Message: "${cleanMsg}"
Output ONLY the exact key string.`;

  try {
    const classification = await gemini.callRawLLM(prompt, "You are a classification assistant. Output ONLY the lowercase category key.");
    const cleanKey = classification.trim().toLowerCase().replace(/['"]/g, '');
    if (AGENTS[cleanKey]) return cleanKey;
  } catch (e) {
    console.error("Agent classification failed, using fallback:", e);
  }
  return getFallbackAgent(cleanMsg);
}

// Generates a brief spoken fallback when the AI API is unavailable
function generateVoiceFallback(errorMessage: string): string {
  if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('Quota')) {
    return "I'm getting a lot of requests right now. Give me just a moment and try again.";
  }
  if (errorMessage.includes('503') || errorMessage.includes('overloaded') || errorMessage.includes('Service Unavailable')) {
    return "The AI backend is a bit overloaded right now. Try again in a few seconds.";
  }
  if (errorMessage.includes('API key') || errorMessage.includes('API_KEY')) {
    return "My connection to the AI is misconfigured. Check the Gemini API key in settings.";
  }
  return "I lost contact with the AI backend for a moment. Give me a second and try again.";
}

// Generates simulated response for offline/fallback mode (chat UI only — voice uses generateVoiceFallback)
export async function generateSimulatedResponse(
  agentKey: string,
  userMessage: string,
  errorMessage: string
): Promise<{ agentName: string; text: string }> {
  const agent = AGENTS[agentKey] || AGENTS.ceo;
  const lowercaseMsg = userMessage.toLowerCase();

  let targetRevenue = 6000;
  let closedRevenue = 0;
  let revenueGap = 6000;
  let pipelineValue = 0;
  let leadCount = 0;
  let activeClientsCount = 0;
  let leadList: Lead[] = [];
  let taskList: Task[] = [];
  let offersList: Offer[] = [];

  try {
    const context = await buildBusinessContext();
    targetRevenue = context.metrics.targetRevenue;
    closedRevenue = context.metrics.closedRevenue;
    revenueGap = context.metrics.revenueGap;
    pipelineValue = context.metrics.pipelineValue;
    leadCount = context.leads.length;
    activeClientsCount = context.metrics.activeClientsCount;
    leadList = context.leads;
    taskList = context.tasks;
    offersList = context.offers;
  } catch (dbError) {
    console.error('Database fetch failed during simulated response generation:', dbError);
  }

  let cleanError = errorMessage;
  if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
    cleanError = 'Invalid Gemini API key in .env.local';
  } else if (errorMessage.includes('503') || errorMessage.includes('Service Unavailable') || errorMessage.includes('overloaded')) {
    cleanError = 'Gemini API is temporarily overloaded (503). Try again in a few seconds.';
  } else if (errorMessage.includes('429') || errorMessage.includes('Quota exceeded') || errorMessage.includes('rate limit')) {
    cleanError = 'Gemini API Rate Limit (429 Too Many Requests). Wait a moment.';
  } else if (errorMessage.includes('not found') || errorMessage.includes('not supported')) {
    cleanError = 'Model not supported or Generative Language API is disabled for this key';
  }

  let text = `⚠️ **Offline Simulator Mode** (${cleanError})\n\n`;

  if (agentKey === 'revenue') {
    text += `**Marcus (Revenue Agent)**: Here's the current revenue picture:\n\n`;
    text += `- **Monthly Target**: $${targetRevenue.toLocaleString()}\n`;
    text += `- **Closed Revenue**: $${closedRevenue.toLocaleString()}\n`;
    text += `- **Revenue Gap**: $${revenueGap.toLocaleString()}\n`;
    text += `- **Pipeline Value**: $${pipelineValue.toLocaleString()}\n`;
    text += `- **Active Clients**: ${activeClientsCount}\n\n`;
    if (revenueGap > 0 && offersList.length > 0) {
      const primary = offersList[0];
      const minPrice = primary.price_min || 800;
      const dealsNeeded = Math.ceil(revenueGap / minPrice);
      text += `We need ~${dealsNeeded} deal(s) of "${primary.name}" to close the gap.`;
    } else if (revenueGap <= 0) {
      text += `We've hit the monthly target. Nice work.`;
    }
  } else if (agentKey === 'leadResearch' || lowercaseMsg.includes('score') || lowercaseMsg.includes('qualif')) {
    let targetLeadName = 'your top prospect';
    const matchedLead = leadList.find(l => lowercaseMsg.includes(l.business_name.toLowerCase())) || leadList[0];
    if (matchedLead) targetLeadName = matchedLead.business_name;
    text += `**Daniel (Lead Research Agent)**: Qualification report for **${targetLeadName}** — overall score 7.8/10. Strong automation need, decent ability to pay. Recommend personalised outreach.\n\n**Next**: Emma, let's draft the sequence.`;
  } else if (agentKey === 'outreach' || lowercaseMsg.includes('outreach') || lowercaseMsg.includes('email')) {
    const matchedLead = leadList.find(l => lowercaseMsg.includes(l.business_name.toLowerCase())) || leadList[0];
    const leadName = matchedLead?.business_name || 'your top prospect';
    text += `**Emma (Outreach Agent)**: Outreach draft for ${leadName} is ready. It highlights the missed-booking problem and offers a 90-second demo. Load it into the Outbox and personalise before sending.\n\n**Next**: Lucas, schedule the Day 3 follow-up.`;
  } else if (agentKey === 'proposal' || lowercaseMsg.includes('proposal') || lowercaseMsg.includes('quote')) {
    const matchedLead = leadList.find(l => lowercaseMsg.includes(l.business_name.toLowerCase())) || leadList[0];
    const leadName = matchedLead?.business_name || 'the prospect';
    text += `**Olivia (Proposal Agent)**: Proposal for **${leadName}**: AI Website + Booking System at $1,500 setup + $150/mo retainer. Five pages, brand kit, and AI chat widget. Logged in Price Quotes.\n\n**Next**: Sophia, prep the post-proposal call script.`;
  } else if (agentKey === 'sales') {
    text += `**Sophia (Sales Agent)**: Frame the AI receptionist as a 24/7 employee — no salary, no breaks. When they say "it's too expensive," remind them that two recovered leads per month pays for the whole setup.\n\n**Next**: Emma, use the "receptionist math" hook in DMs.`;
  } else if (agentKey === 'followup') {
    text += `**Lucas (Follow-up Agent)**: Running a Day 3 soft check-in, Day 7 value injection, and Day 14 break-up message for contacts who haven't replied.\n\n**Next**: Emma, flag anyone who has responded so I can remove them from the sequence.`;
  } else if (agentKey === 'content') {
    text += `**Ryan (Content Agent)**: Two ideas — (1) "How a clinic lost $3,200 in one weekend by not answering the phone" story post. (2) Carousel comparing form builders vs AI booking widgets.\n\n**Next**: Alex, I'll save drafts to the Social Writer.`;
  } else if (agentKey === 'delivery') {
    text += `**Mia (Delivery Agent)**: Baseline roadmap: assets Day 1-2, wireframes Day 3-5, AI training Day 6-8, launch Day 9-12.\n\n**Next**: Marcus, confirm the upfront invoice is paid before kickoff.`;
  } else if (agentKey === 'memory') {
    text += `**Leo (Memory Agent)**: Preferences archived — local service clinics, dental offices, health spas. Tech stack tagged: Next.js + Supabase + Gemini.\n\n**Next**: Keep the Memories tab updated to sharpen context over time.`;
  } else if (agentKey === 'support') {
    text += `**Harper (Support Agent)**: Based on our verified documentation, here is what I found:\n\n1. **AI Website + Brand System**: Setup price is $800 - $1,500.\n2. **AI Receptionist**: Setup price is $500 - $1,200, plus a monthly retainer of $250.\n\nLet me know if you need help looking up other specific topics from our Obsidian Brain!`;
  } else {
    text += `**Alex (CEO Agent)**: Current status — $${closedRevenue.toLocaleString()} closed of $${targetRevenue.toLocaleString()} target. Gap: $${revenueGap.toLocaleString()}. ${leadCount} leads in CRM, ${taskList.filter(t => t.status !== 'Completed').length} tasks pending.\n\n`;
    if (leadList.length > 0) {
      text += `**Priority**: Daniel & Emma, qualify and reach out to **${leadList[0].business_name}** with a personalised AI booking pitch.\n`;
    }
    text += `\n**Next**: Ensure Supabase and Gemini env vars are configured for live mode.`;
  }

  return { agentName: agent.name, text };
}

export async function executeAgent(
  agentKey: string,
  userMessage: string,
  history: { sender: 'user' | 'ai'; message: string }[],
  voiceHint?: string
): Promise<{ agentName: string; text: string }> {
  const agent = AGENTS[agentKey] || AGENTS.ceo;
  const isVoiceMode = !!voiceHint;

  if (!isGeminiConfigured) {
    if (isVoiceMode) {
      const simulated = await generateSimulatedResponse(agentKey, userMessage, 'Gemini API key is missing');
      const cleanText = simulated.text.replace(/⚠️\s*\*?\*?Offline Simulator Mode\*?\*?\s*\([^)]*\)\s*/gi, '').trim();
      return { agentName: agent.name, text: cleanText };
    }
    return generateSimulatedResponse(agentKey, userMessage, 'Gemini API key is missing. Add GEMINI_API_KEY to your env variables.');
  }

  try {
    const { contextString } = await buildBusinessContext();
    const historyStr = history.map(h => `${h.sender === 'user' ? 'User' : 'Agent'}: ${h.message}`).join('\n');

    let cleanUserMessage = userMessage;
    const prefixMatch = userMessage.trim().match(/^(?:to\s+)?(?:the\s+)?(?:[^:]+?)(?:\s+agent)?\s*:\s*(.*)$/i);
    if (prefixMatch) cleanUserMessage = prefixMatch[1];

    let memorySnippet = '';
    try {
      const memories = await db.searchMemories(cleanUserMessage, 6);
      if (memories && memories.length > 0) {
        memorySnippet = `\n=== RETRIEVED BUSINESS MEMORIES ===\n` + memories.map(m => `- [${m.source || 'Memory'}] ${m.content}`).join('\n') + `\n`;
      }
    } catch (memErr) {
      console.warn('Failed to retrieve vector memories for agent:', memErr);
    }

    const systemInstruction = `${agent.systemPrompt}
${voiceHint ? `\n${voiceHint}\n` : ''}
${memorySnippet}
Below is the real-time business workspace data compiled from Supabase:
${contextString}

Use this data to provide concrete, grounded answers. If metrics, goals, or lists are empty, guide the user on how to add them. Never invent fake leads, transactions, or stats if they are not in the context above.`;

    const finalPrompt = isVoiceMode
      ? `User said: "${cleanUserMessage}"\n\nRespond as ARIA in 1-2 conversational spoken sentences. No lists, no formatting, no markdown.`
      : `Conversation History:\n${historyStr}\n\nUser Input Message: "${cleanUserMessage}"\n\nProvide your professional guidance. Address the user directly, keep your formatting clean with clear markdown, and end with 1-2 actionable next bullet steps.`;

    const responseText = await gemini.callRawLLM(finalPrompt, systemInstruction);
    return { agentName: agent.name, text: responseText };
  } catch (error: any) {
    console.error(`Error executing agent ${agentKey}:`, error);
    if (isVoiceMode) {
      const simulated = await generateSimulatedResponse(agentKey, userMessage, error.message || 'AI request failed');
      const cleanText = simulated.text.replace(/⚠️\s*\*?\*?Offline Simulator Mode\*?\*?\s*\([^)]*\)\s*/gi, '').trim();
      return { agentName: agent.name, text: cleanText };
    }
    return generateSimulatedResponse(agentKey, userMessage, error.message || 'AI request failed');
  }
}
