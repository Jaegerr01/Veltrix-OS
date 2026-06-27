import { buildBusinessContext } from '../context/buildBusinessContext';
import { gemini, isGeminiConfigured } from '../ai/gemini';
import { AGENTS } from './agents';
import { Lead, Task, Offer } from '../types';
import { db } from '../db';

// Helper: Classify query using keyword mapping as fallback
export function getFallbackAgent(message: string): string {
  const msg = message.toLowerCase();
  
  // First match by agent first names
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

  if (msg.includes('revenue') || msg.includes('earn') || msg.includes('finance') || msg.includes('money') || msg.includes('gap') || msg.includes('target')) {
    return 'revenue';
  }
  if (msg.includes('outreach') || msg.includes('email') || msg.includes('contact') || msg.includes('message')) {
    return 'outreach';
  }
  if (msg.includes('proposal') || msg.includes('bid') || msg.includes('quote') || msg.includes('price')) {
    return 'proposal';
  }
  if (msg.includes('follow') || msg.includes('reminder') || msg.includes('fup')) {
    return 'followup';
  }
  if (msg.includes('score') || msg.includes('qualif') || msg.includes('research') || msg.includes('grade')) {
    return 'leadResearch';
  }
  if (msg.includes('sales') || msg.includes('close') || msg.includes('convert') || msg.includes('objection')) {
    return 'sales';
  }
  if (msg.includes('content') || msg.includes('post') || msg.includes('linkedin') || msg.includes('instagram') || msg.includes('social')) {
    return 'content';
  }
  if (msg.includes('project') || msg.includes('deliver') || msg.includes('checklist') || msg.includes('milestone')) {
    return 'delivery';
  }
  if (msg.includes('memory') || msg.includes('remember') || msg.includes('recall') || msg.includes('notes') || msg.includes('fact')) {
    return 'memory';
  }
  return 'ceo';
}

// Function to classify request using Gemini (if online) or fallback keywords
export async function classifyRequest(message: string): Promise<string> {
  const cleanMsg = message.trim();
  
  // Check for explicit routing (e.g. "To CEO Agent: ..." or "CEO Agent: ..." or "Alex: ...")
  const match = cleanMsg.match(/^(?:to\s+)?(?:the\s+)?([^:]+?)(?:\s+agent)?\s*:/i);
  if (match) {
    const targetName = match[1].trim().toLowerCase();
    const foundKey = Object.keys(AGENTS).find(key => {
      const agentName = AGENTS[key].name.toLowerCase(); // e.g. "alex (ceo agent)"
      const firstWord = agentName.split(' ')[0].toLowerCase(); // e.g. "alex"
      return (
        agentName === targetName ||
        agentName.includes(targetName) ||
        firstWord === targetName ||
        key.toLowerCase() === targetName ||
        AGENTS[key].role.toLowerCase() === targetName ||
        AGENTS[key].role.toLowerCase().includes(targetName)
      );
    });
    if (foundKey) {
      return foundKey;
    }
  }

  if (!isGeminiConfigured) {
    return getFallbackAgent(cleanMsg);
  }

  const prompt = `
Classify the following user message to determine which business agent should handle it.
Your choices are:
- "ceo" (Alex): Questions about overall strategy, what to do today, priority checklists, daily reports, and team delegation coordination.
- "revenue" (Marcus): Financial calculations, goals, monthly targets, closed earnings, revenue gap.
- "sales" (Sophia): Closing clients, pitch angles, pricing options, objections.
- "leadResearch" (Daniel): Qualifying leads, lead scoring, researching website/brand problems.
- "outreach" (Emma): Drafting first-contact messages (emails, DMs).
- "followup" (Lucas): Scheduling/drafting sequential check-ins.
- "proposal" (Olivia): Creating pricing quotes, contracts, scope of work.
- "content" (Ryan): Ideas for social media, LinkedIn carousels, video hooks.
- "delivery" (Mia): Client project checklists, milestone plans, progress updates.
- "memory" (Leo): Saving, searching, recalling business facts.

User Message: "${cleanMsg}"

Output ONLY the exact category string (e.g. "revenue" or "ceo"), with no punctuation or additional text.
`;

  try {
    const classification = await gemini.callRawLLM(prompt, "You are a classification assistant. Output ONLY the lowercase category key.");
    const cleanKey = classification.trim().toLowerCase().replace(/['"]/g, '');
    if (AGENTS[cleanKey]) {
      return cleanKey;
    }
  } catch (e) {
    console.error("Agent classification failed, using fallback:", e);
  }
  return getFallbackAgent(cleanMsg);
}

// Generate simulated response for offline/fallback mode
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
    cleanError = 'Gemini API is temporarily overloaded (503 Service Unavailable). Please try chat again in a few seconds.';
  } else if (errorMessage.includes('429') || errorMessage.includes('Quota exceeded') || errorMessage.includes('rate limit')) {
    cleanError = 'Gemini API Rate Limit exceeded (429 Too Many Requests). Please wait a moment.';
  } else if (errorMessage.includes('not found') || errorMessage.includes('not supported')) {
    cleanError = 'Model not supported or Generative Language API is disabled for this key';
  }

  let text = `⚠️ **Offline Simulator Mode** (${cleanError})\n\n`;

  if (agentKey === 'revenue') {
    text += `**Marcus (Revenue Agent)**: Hey Alex and team! Let's look at our revenue metrics. Here is where we stand:\n\n`;
    text += `- **Monthly Revenue Target**: $${targetRevenue.toLocaleString()}\n`;
    text += `- **Current Closed Revenue**: $${closedRevenue.toLocaleString()}\n`;
    text += `- **Revenue Gap**: $${revenueGap.toLocaleString()}\n`;
    text += `- **Est. Pipeline Value**: $${pipelineValue.toLocaleString()}\n`;
    text += `- **Active Clients**: ${activeClientsCount}\n\n`;

    if (revenueGap > 0) {
      text += `We have a remaining gap of **$${revenueGap.toLocaleString()}** to hit our monthly target. `;
      if (offersList.length > 0) {
        const primary = offersList[0];
        const minPrice = primary.price_min || 800;
        const dealsNeeded = Math.ceil(revenueGap / minPrice);
        text += `To cover this, we would need approximately **${dealsNeeded}** deal(s) of our "${primary.name}" package (starting at $${minPrice.toLocaleString()}).`;
      } else {
        text += `To cover this, we should focus on securing 2-3 custom website or automation design projects ($800 - $1,500 each).`;
      }
    } else {
      text += `Fantastic work team! We have fully hit and exceeded our target monthly revenue of $${targetRevenue.toLocaleString()}!`;
    }

    text += `\n\n**Actionable Next Steps:**\n`;
    text += `1. Review pricing models and retainer terms to maximize margins.\n`;
    text += `2. Sophia, let's align on closing the warm leads in our pipeline (valued at $${pipelineValue.toLocaleString()}).`;
  } else if (agentKey === 'leadResearch' || lowercaseMsg.includes('score') || lowercaseMsg.includes('qualif')) {
    let targetLeadName = 'Radiant Smiles Dental Clinic';
    let matchedLead = leadList.find(l => lowercaseMsg.includes(l.business_name.toLowerCase()));
    if (!matchedLead && leadList.length > 0) {
      matchedLead = leadList[0];
    }

    if (matchedLead) {
      targetLeadName = matchedLead.business_name;
    }

    text += `**Daniel (Lead Research Agent)**: Hey Alex, I completed the qualification and research on **${targetLeadName}**:\n\n`;
    const webScore = matchedLead?.website ? 6 : 9;
    const brandingScore = 8;
    const autoNeed = matchedLead?.pain_point?.toLowerCase().includes('booking') || matchedLead?.pain_point?.toLowerCase().includes('chat') ? 9 : 7;
    const payAbility = 8;
    const urgency = 7;
    const totalScore = ((webScore + brandingScore + autoNeed + payAbility + urgency) / 5).toFixed(1);

    text += `- **Website Weakness Score**: ${webScore}/10 ${matchedLead?.website ? `(${matchedLead.website})` : '(No website listed - High opportunity!)'}\n`;
    text += `- **Brand Weakness Score**: ${brandingScore}/10 (Lacks modern design details)\n`;
    text += `- **Automation Need Score**: ${autoNeed}/10 (High potential for AI receptionists/booking bots)\n`;
    text += `- **Ability to Pay Score**: ${payAbility}/10 (Local service business with healthy margins)\n`;
    text += `- **Urgency Score**: ${urgency}/10 (No automated system to capture night/weekend leads)\n`;
    text += `- **Overall Qualified Score**: **${totalScore}/10**\n\n`;

    text += `**Analysis**: ${matchedLead?.pain_point || 'The prospect exhibits typical service industry pain points: no live appointment booking, slow follow-ups, and a lack of responsive mobile design. A custom AI receptionist or modern website upgrade would yield high ROI.'}\n\n`;
    text += `**Actionable Next Steps:**\n`;
    text += `1. Emma, let's draft a personalized cold outreach sequence for this lead.\n`;
    text += `2. Alex, I recommend offering a risk-free 2-minute video mockup of their new booking system.`;
  } else if (agentKey === 'outreach' || lowercaseMsg.includes('outreach') || lowercaseMsg.includes('email') || lowercaseMsg.includes('message')) {
    let leadName = 'Radiant Smiles Dental Clinic';
    let leadWebsite = 'radiantsmiles.com';
    let matchedLead = leadList.find(l => lowercaseMsg.includes(l.business_name.toLowerCase()));
    if (!matchedLead && leadList.length > 0) {
      matchedLead = leadList[0];
    }
    if (matchedLead) {
      leadName = matchedLead.business_name;
      leadWebsite = matchedLead.website || 'their site';
    }

    text += `**Emma (Outreach Agent)**: Hey team! Here is the custom outreach sequence I drafted for ${leadName}:\n\n`;
    text += `> "Hi ${matchedLead?.contact_name || 'there'},\n`;
    text += `> \n`;
    text += `> I was looking at ${leadName} and noticed that patients trying to book appointments after hours don't have an automated way to schedule. This typically leads to about 20% of web visitors bouncing to competitors.\n`;
    text += `> \n`;
    text += `> We build lightweight AI booking assistants for clinics that handle FAQs and schedule patients 24/7 directly into your calendar. Would it be okay if I sent over a short 90-second demo video of how it looks?"\n\n`;
    text += `**Actionable Next Steps:**\n`;
    text += `1. Alex, let's load this message into the Outbox and customize contact details.\n`;
    text += `2. Lucas, please schedule a Day 3 follow-up sequence in case we don't get a reply.`;
  } else if (agentKey === 'proposal' || lowercaseMsg.includes('proposal') || lowercaseMsg.includes('quote') || lowercaseMsg.includes('price')) {
    let leadName = 'Radiant Smiles Dental Clinic';
    let matchedLead = leadList.find(l => lowercaseMsg.includes(l.business_name.toLowerCase()));
    if (!matchedLead && leadList.length > 0) {
      matchedLead = leadList[0];
    }
    if (matchedLead) {
      leadName = matchedLead.business_name;
    }

    text += `**Olivia (Proposal Agent)**: Hi Alex, I have prepared a business proposal outline for **${leadName}**:\n\n`;
    text += `**Recommended Package**: AI Website + Brand System & AI Booking Integration\n`;
    text += `**Estimated Investment**: $1,500 Setup + $150/mo Retainer\n\n`;
    text += `#### Proposed Deliverables:\n`;
    text += `1. **Premium 5-Page Site**: Clean typography, SEO optimized, fully responsive mobile interface.\n`;
    text += `2. **Brand Identity System**: High-end color palette, custom graphics/illustrations, and brand style guide.\n`;
    text += `3. **AI Booking Assistant**: Chat widget configured to ingest clinic FAQs and schedule appointments.\n\n`;
    text += `**Actionable Next Steps:**\n`;
    text += `1. Alex, I'll log the full proposal details in the "Price Quotes" page.\n`;
    text += `2. Sophia, let's plan the post-proposal call script to walk them through the ROI.`;
  } else if (agentKey === 'sales' || lowercaseMsg.includes('sales') || lowercaseMsg.includes('close') || lowercaseMsg.includes('convert')) {
    text += `**Sophia (Sales Agent)**: Hey everyone! I've laid out the sales and conversion playbook for our current prospects:\n\n`;
    text += `1. **Focus Angle**: Frame the AI Receptionist not as a cost, but as an extra receptionist who works 24/7 without taking breaks or asking for salary.\n`;
    text += `2. **Objection Buster**: When they say "It's too expensive," point out that saving just 2 bounced leads per month fully pays for the retainer and setup fees.\n\n`;
    text += `**Actionable Next Steps:**\n`;
    text += `1. Emma, let's use the 'receptionist math' hook in our DMs.\n`;
    text += `2. Alex, let's set up a calendar event to call the warm leads on Friday.`;
  } else if (agentKey === 'followup' || lowercaseMsg.includes('follow') || lowercaseMsg.includes('reminder')) {
    text += `**Lucas (Follow-up Agent)**: Lucas here. I'm keeping a close eye on the pipeline. Here's my plan:\n\n`;
    text += `- **Follow-up Sequence**: We'll deploy a soft Day 3 check-in, a Day 7 value injection (sending them a stats report), and a Day 14 break-up message.\n`;
    text += `- **Current Action**: Preparing follow-up drafts for contacted prospects who haven't replied yet.\n\n`;
    text += `**Actionable Next Steps:**\n`;
    text += `1. Emma, let's align on who has replied so I can take over the sequence.\n`;
    text += `2. Leo, please log the response status updates in the system notes.`;
  } else if (agentKey === 'content' || lowercaseMsg.includes('content') || lowercaseMsg.includes('post') || lowercaseMsg.includes('linkedin')) {
    text += `**Ryan (Content Agent)**: What's up team! Ryan here. I've got some high-performing content ideas to build authority on LinkedIn and Instagram:\n\n`;
    text += `- **Idea 1**: "How a local clinic lost $3,200 in 1 weekend by not answering their phone" (Hook + Case study).\n`;
    text += `- **Idea 2**: Carousel detailing the difference between standard form builders and interactive AI booking widgets.\n\n`;
    text += `**Actionable Next Steps:**\n`;
    text += `1. Mia, please review the graphics workflow checkmarks.\n`;
    text += `2. Alex, I'll save these drafts to the Social Writer page.`;
  } else if (agentKey === 'delivery' || lowercaseMsg.includes('project') || lowercaseMsg.includes('deliver') || lowercaseMsg.includes('checklist')) {
    text += `**Mia (Delivery Manager Agent)**: Mia here. Standard onboarding and project delivery are running smoothly. Here's our baseline roadmap:\n\n`;
    text += `1. Onboarding & Assets Collection (Day 1-2)\n`;
    text += `2. Layout & Wireframes Review (Day 3-5)\n`;
    text += `3. AI Custom Training & FAQs Ingestion (Day 6-8)\n`;
    text += `4. Mobile testing & launch checklist (Day 9-12)\n\n`;
    text += `**Actionable Next Steps:**\n`;
    text += `1. Marcus, let's ensure the upfront invoice is paid before kickoff.\n`;
    text += `2. Leo, please tag client preferences in our central memory database.`;
  } else if (agentKey === 'memory' || lowercaseMsg.includes('memory') || lowercaseMsg.includes('remember') || lowercaseMsg.includes('notes')) {
    text += `**Leo (Memory Manager Agent)**: Leo reporting in. I've archived our business memories and preferences:\n\n`;
    text += `- Central preference updated: We prioritize local service clinics, dental offices, and health spas.\n`;
    text += `- Tech stack tag: Next.js + Supabase + Gemini API.\n\n`;
    text += `**Actionable Next Steps:**\n`;
    text += `1. Alex, let's keep details updated on the Memories tab to refine context.\n`;
    text += `2. Daniel, I've linked the new lead files to our historical target tags.`;
  } else {
    text += `**Alex (CEO Agent)**: Hey team, Alex here. Let's work together to reach our $6,000/month milestone. Here is the current status of the dashboard:\n\n`;
    text += `- **Closed Earnings**: $${closedRevenue.toLocaleString()} / $${targetRevenue.toLocaleString()} (Gap: $${revenueGap.toLocaleString()})\n`;
    text += `- **Active Leads in CRM**: ${leadCount}\n`;
    text += `- **Ongoing Projects**: ${taskList.filter(t => t.status !== 'Completed').length} tasks pending\n\n`;

    text += `**Priority Actions to Close the Revenue Gap:**\n`;
    if (leadList.length > 0) {
      const topLead = leadList[0];
      text += `- **Daniel & Emma**: Let's qualify and reach out to **${topLead.business_name}** (${topLead.industry || 'Local Business'}) with a personalized AI booking assistant pitch.\n`;
    } else {
      text += `- **Lead Generation**: Add local service businesses (dentists, medical clinics, home services) to the Potential Clients CRM list.\n`;
    }

    const pendingTasks = taskList.filter(t => t.status !== 'Completed').slice(0, 2);
    if (pendingTasks.length > 0) {
      text += `- **Mia**: Please check on the progress of these tasks: ${pendingTasks.map(t => `"${t.title}"`).join(', ')}.\n`;
    }

    text += `\n**Actionable Next Steps:**\n`;
    text += `1. Daniel, let's qualification score our active leads.\n`;
    text += `2. Ensure your Supabase and Gemini environment variables are correctly configured for live mode.`;
  }

  return {
    agentName: agent.name,
    text: text
  };
}

// Executes a prompt on behalf of a specific agent with database context
export async function executeAgent(
  agentKey: string,
  userMessage: string,
  history: { sender: 'user' | 'ai'; message: string }[]
): Promise<{ agentName: string; text: string }> {
  const agent = AGENTS[agentKey] || AGENTS.ceo;

  if (!isGeminiConfigured) {
    return generateSimulatedResponse(agentKey, userMessage, 'Gemini API key is missing. Add GEMINI_API_KEY to your env variables.');
  }

  try {
    // Build dynamic Supabase business context
    const { contextString } = await buildBusinessContext();
    const historyStr = history.map(h => `${h.sender === 'user' ? 'User' : 'Agent'}: ${h.message}`).join('\n');

    // Strip prefix like "To Sales Agent: " or "CEO: " from prompt to make it cleaner for the agent
    let cleanUserMessage = userMessage;
    const prefixMatch = userMessage.trim().match(/^(?:to\s+)?(?:the\s+)?(?:[^:]+?)(?:\s+agent)?\s*:\s*(.*)$/i);
    if (prefixMatch) {
      cleanUserMessage = prefixMatch[1];
    }

    // Retrieve semantically matching memories using pgvector
    let memorySnippet = '';
    try {
      const memories = await db.searchMemories(cleanUserMessage, 6);
      if (memories && memories.length > 0) {
        memorySnippet = `\n=== RETRIEVED BUSINESS MEMORIES (VECTOR SEARCH) ===\n` + 
          memories.map(m => `- [${m.source || 'Memory'}] ${m.content}`).join('\n') + `\n`;
      }
    } catch (memErr) {
      console.warn('Failed to retrieve vector memories for agent:', memErr);
    }

    const systemInstruction = `
${agent.systemPrompt}
${memorySnippet}
Below is the real-time business workspace data compiled from Supabase:
${contextString}

Use this data to provide concrete, grounded answers. If metrics, goals, or lists are empty, guide the user on how to add them. Never invent fake leads, transactions, or stats if they are not in the context above.
`;

    const finalPrompt = `
Conversation History:
${historyStr}

User Input Message: "${cleanUserMessage}"

Provide your professional guidance. Address the user directly, keep your formatting clean with clear markdown, and end with 1-2 actionable next bullet steps.
`;

    const responseText = await gemini.callRawLLM(finalPrompt, systemInstruction);
    return {
      agentName: agent.name,
      text: responseText
    };
  } catch (error: any) {
    console.error(`Error executing agent ${agentKey}:`, error);
    return generateSimulatedResponse(agentKey, userMessage, error.message || 'AI request failed');
  }
}

