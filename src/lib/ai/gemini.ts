import { GoogleGenerativeAI } from '@google/generative-ai';
import { Lead, LeadScore, Proposal, ContentIdea, Memory } from '../types';

const apiKey = process.env.GEMINI_API_KEY || '';
export const isGeminiConfigured = !!apiKey && apiKey !== 'undefined';

let genAI: GoogleGenerativeAI | null = null;
if (isGeminiConfigured) {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.error('Failed to initialize GoogleGenerativeAI in lib/ai/gemini:', e);
  }
}

const SYSTEM_CONTEXT = `
You are VELTRIX COMMAND OS, an enterprise-grade autonomous AI Business Operating System for VELTRIX.
VELTRIX is a futuristic AI and creative technology studio offering branding, graphic design, 2D/3D illustrations, streaming/VTuber assets, website development, Shopify storefronts, AI automations, AI chatbots, AI receptionists, AI customer service agents, and growth consulting.

Primary Goal: Help VELTRIX reach $6,000/month in revenue.
Calculations Model: Monthly Revenue = Leads * Booked Calls * Close Rate * Average Deal Value.
Safety permission constraint: Do not send any emails or message clients without explicit human approval (Level 4 approval).

Business Offer Options:
1. AI Website + Brand System ($800 - $1,500)
   Deliverables: 5-page custom website, mobile responsive, brand direction, SEO, copy, booking form.
2. AI Receptionist / Lead Booking Agent ($500 - $1,200 setup, plus $150 - $500/month retainer)
   Deliverables: Chatbot FAQ ingest, appointment scheduling, CRM sheets sync, follow-up automation.
3. Creative Tech Growth Package ($1,000 - $2,500)
   Deliverables: Brand refresh, landing page, social assets, booking funnel, automations.
`;

async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  if (!isGeminiConfigured || !genAI) {
    throw new Error('Gemini API key is missing. Add GEMINI_API_KEY to your environment variables.');
  }

  const modelsToTry = ['gemini-2.5-flash'];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    const maxRetries = 5;
    let delay = 1500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemInstruction || SYSTEM_CONTEXT
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (!text) {
          throw new Error('Gemini returned an empty response.');
        }
        return text;
      } catch (e: any) {
        lastError = e;
        console.warn(`Gemini API call failed for model ${modelName} (attempt ${attempt}/${maxRetries}):`, e.message || e);
        const isTransient = e.message?.includes('503') || 
                            e.message?.includes('Service Unavailable') || 
                            e.message?.includes('429') || 
                            e.message?.includes('Resource Has Exhausted') ||
                            e.message?.includes('overloaded');
        
        if (isTransient && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          break; // Try the next fallback model (if any)
        }
      }
    }
  }

  throw new Error(`AI request failed. Check API key, model name, and server logs. Details: ${lastError?.message || lastError}`);
}

export const gemini = {
  // 1. Generate Daily Command Report
  async generateDailyReport(
    target: number,
    closed: number,
    pipeline: number,
    leads: Lead[],
    memories: Memory[]
  ): Promise<string> {
    const gap = target - closed;
    const leadsStr = leads.map(l => `- ${l.business_name} (${l.industry || 'Unknown'}, Website: ${l.website || 'None'}, Score: ${l.lead_score})`).join('\n');
    const memoriesStr = memories.map(m => `[${m.type}] ${m.content}`).join('\n');

    const prompt = `
Generate a VELTRIX Daily Command Report based on:
- Revenue Target: $${target}
- Current Closed Revenue: $${closed}
- Pipeline Value: $${pipeline}
- Revenue Gap: $${gap}
- Qualified Leads:
${leadsStr}
- Important Memories:
${memoriesStr}

Follow this exact format:
VELTRIX Daily Command Report

Revenue Target:
$${target}

Closed Revenue:
$${closed}

Pipeline Value:
$${pipeline}

Revenue Gap:
$${gap}

Today’s Top Priority:
[Top priority action description]

Leads to Contact:
1. [Name of Lead 1] (Reason: [Reason])
2. [Name of Lead 2] (Reason: [Reason])
3. [Name of Lead 3] (Reason: [Reason])

Follow-ups Due:
1. [Name of Lead 4] (Action: [Action])
2. [Name of Lead 5] (Action: [Action])

Content to Post:
[Social post content idea hook + brief text]

Recommended Action:
[Specific detailed step to take right now]

Risk / Blocker:
[A logical business risk we face right now]

Next Step:
[Immediate action button destination or command]
`;
    return generateText(prompt);
  },

  // 2. Score Lead
  async scoreLead(lead: Lead): Promise<Omit<LeadScore, 'id' | 'lead_id' | 'created_at'>> {
    const prompt = `
Analyze this business prospect details and output a JSON lead score:
Business Name: ${lead.business_name}
Industry: ${lead.industry || 'Unknown'}
Website: ${lead.website || 'None'}
Pain Point: ${lead.pain_point || 'Not specified'}
Source: ${lead.source || 'Unknown'}
Notes: ${lead.notes || 'None'}

Rate the following factors from 1 to 10:
- website_score (1 is perfect, 10 is terrible website. The worse the website, the higher the score!)
- branding_score (1 is perfect, 10 is terrible branding. The worse their brand design, the higher the score!)
- automation_need_score (1 is low, 10 is high need for lead capture, FAQs, booking bots)
- ability_to_pay_score (1 is broke, 10 is highly profitable local business with ability to pay $1k-$2k)
- urgency_score (1 is low, 10 is high, e.g. active complaints, bad reviews, or missing bookings)

Calculate the total_score as the mathematical average of these 5 scores.
Explain the logic in the "reasoning" property.

Output ONLY a raw JSON matching this structure:
{
  "website_score": number,
  "branding_score": number,
  "automation_need_score": number,
  "ability_to_pay_score": number,
  "urgency_score": number,
  "total_score": number,
  "reasoning": "string"
}
`;
    const resText = await generateText(prompt, 'You are Lead Research Agent. You output ONLY JSON.');
    try {
      const cleanJson = resText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Error parsing lead score JSON:', e);
      return {
        website_score: 8,
        branding_score: 7,
        automation_need_score: 9,
        ability_to_pay_score: 8,
        urgency_score: 8,
        total_score: 8.0,
        reasoning: 'Fallback lead qualification due to parsing errors. High automation needs indicated.'
      };
    }
  },

  // 2b. Research a lead from a live website snapshot
  async researchLead(
    lead: Lead,
    website: { ok: boolean; title?: string; text?: string; error?: string }
  ): Promise<{ summary: string; observations: string[]; opportunities: string[]; personalization_hooks: string[] }> {
    const siteSection = website.ok
      ? `Website title: ${website.title || 'n/a'}\nWebsite content (extracted text):\n${website.text || '(empty page)'}`
      : `Their website could NOT be loaded (${website.error}). Treat this as a major finding — a broken or missing web presence is exactly what VELTRIX fixes.`;

    const prompt = `
You are Daniel, the Lead Research Agent. Research this prospect using their REAL website content below.

Business: ${lead.business_name}
Industry: ${lead.industry || 'Unknown'}
Location: ${lead.location || 'Unknown'}
Known pain point: ${lead.pain_point || 'None recorded'}
Existing notes: ${lead.notes || 'None'}

${siteSection}

Produce a research brief. Observations must be SPECIFIC and verifiable from the content above (services they list, missing booking option, outdated copy, no chatbot, weak CTA, etc.) — never invent facts. Personalization hooks are one-line openers Emma (Outreach Agent) can use verbatim.

Output ONLY raw JSON:
{
  "summary": "2-3 sentence overview of the business and its digital posture",
  "observations": ["3-5 concrete facts from their site"],
  "opportunities": ["2-4 things VELTRIX can sell them, most valuable first"],
  "personalization_hooks": ["2-3 one-line openers referencing real details"]
}
`;
    const resText = await generateText(prompt, 'You are Lead Research Agent. You output ONLY JSON.');
    try {
      const cleanJson = resText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        summary: String(parsed.summary || ''),
        observations: Array.isArray(parsed.observations) ? parsed.observations.map(String) : [],
        opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities.map(String) : [],
        personalization_hooks: Array.isArray(parsed.personalization_hooks) ? parsed.personalization_hooks.map(String) : [],
      };
    } catch {
      return {
        summary: website.ok
          ? `Research parse failed; site was reachable (${website.title || 'no title'}).`
          : `Website unreachable (${website.error}) — likely needs a full web presence rebuild.`,
        observations: website.ok ? [] : ['Website could not be loaded during research.'],
        opportunities: ['AI Website + Brand System'],
        personalization_hooks: [],
      };
    }
  },

  // 3. Generate Outreach Message
  async generateOutreach(lead: Lead, offerName: string, researchNotes?: string): Promise<string> {
    const prompt = `
You are Outreach Agent. Draft a personalized outreach message for this lead:
Lead Name: ${lead.business_name}
Industry: ${lead.industry || 'Unknown'}
Website: ${lead.website || 'None'}
Pain Points: ${lead.pain_point || 'Unknown website/booking leaks'}
Notes: ${lead.notes || 'None'}
Target Offer: ${offerName}
${researchNotes ? `\nResearch brief from Daniel (Lead Research Agent) — reference these REAL findings:\n${researchNotes}\n` : ''}
Follow these strict rules:
1. Personalized opening referencing their industry/name${researchNotes ? ' — use a personalization hook from the research brief if one fits' : ''}.
2. One specific observation${researchNotes ? ' taken from the research brief (real, verifiable)' : ' (e.g. mobile speed, lack of booking chat)'}.
3. One clear pain point solved.
4. Soft CTA (e.g. "Can I send you a 2-minute video overview?").
5. Keep it short (3-4 sentences, no long blocks).
6. Do NOT sound needy or like a generic freelancer. Sound like a professional tech partner.
`;
    return generateText(prompt);
  },

  // 4. Generate Follow-up Message
  async generateFollowup(lead: Lead, sequenceDay: number): Promise<string> {
    const prompt = `
You are Follow-up Agent. Draft a follow-up message for:
Lead: ${lead.business_name}
Industry: ${lead.industry || 'Unknown'}
Days since initial contact: ${sequenceDay}

Follow-up rules by schedule:
- Day 3 (Soft reminder): Keep it friendly and short. Check if they received the previous note.
- Day 7 (Value-based): Provide a small helpful hint (e.g., "Here is a quick tip to speed up your page load").
- Day 14 (Final check-in): Polite break-up message ("If timing is not right, I'll close this ticket").
- Day 30 (Re-engagement): Soft check-in on how their business is doing.

Draft a message for Day ${sequenceDay}. Keep the tone simple, helpful, and confident.
`;
    return generateText(prompt);
  },

  // 5. Generate Proposal
  async generateProposal(lead: Lead, offerName: string, price: number): Promise<string> {
    const prompt = `
You are Proposal Agent. Create a comprehensive, premium business proposal for:
Client: ${lead.business_name}
Industry: ${lead.industry || 'Unknown'}
Offer Package: ${offerName}
Agreed/Proposed Price: $${price}
Client Pain Points: ${lead.pain_point || 'Needs conversion optimization'}

Format as standard markdown with sections:
- Executive Overview
- Current Problems Identified
- Our Recommended Solution
- Deliverables Included (match offer specifications)
- Setup Timeline
- Investment & Pricing Model (setup fee and retainer if applicable)
- Payment Terms
- Next Steps
`;
    return generateText(prompt);
  },

  // 6. Generate Content Ideas
  async generateContentIdeas(topic: string): Promise<ContentIdea[]> {
    const prompt = `
You are Content Agent. Generate 3 social media content ideas for VELTRIX authority posting.
Topic/Pillar: ${topic}

Output ONLY a JSON array of 3 ideas matching this schema:
[
  {
    "platform": "LinkedIn" | "Instagram" | "YouTube",
    "title": "string title",
    "hook": "compelling hook phrase",
    "content": "detailed body text or layout directions",
    "content_type": "Text" | "Image" | "Short-form Video" | "Carousel"
  }
]
`;
    const resText = await generateText(prompt, 'You are Content Agent. You output ONLY JSON.');
    try {
      const cleanJson = resText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Error parsing content ideas:', e);
      return [
        {
          id: 'ci-mock-1',
          platform: 'LinkedIn',
          title: 'The AI Client Booking Leak',
          hook: 'Is your service business bleeding 20% of its calls?',
          content: 'Discussing why modern buyers prefer typing to speaking. Explain automated appointment booking widgets.',
          content_type: 'Text',
          status: 'Idea',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ] as any;
    }
  },
  async generateRoiReport(params: {
    clientName: string;
    servicePurchased: string;
    setupFee: number;
    monthlyRetainer: number;
    monthsActive: number;
    projectStatus: string;
    tasksCompleted: number;
    tasksTotal: number;
    estimatedMonthlySaving: number;
    estimatedRoiPct: number;
  }): Promise<string> {
    const {
      clientName, servicePurchased, setupFee, monthlyRetainer,
      monthsActive, projectStatus, tasksCompleted, tasksTotal,
      estimatedMonthlySaving, estimatedRoiPct
    } = params;
    const prompt = `
You are VELTRIX's AI Value Analyst. Write a professional, client-facing ROI summary for:

Client: ${clientName}
Service: ${servicePurchased}
Investment: $${setupFee} setup fee${monthlyRetainer > 0 ? ` + $${monthlyRetainer}/mo retainer` : ''}
Months Active: ${monthsActive}
Project Status: ${projectStatus}
Milestone Completion: ${tasksCompleted}/${tasksTotal} tasks done
Estimated Monthly Value Generated: ~$${estimatedMonthlySaving}/mo
Estimated ROI: ${estimatedRoiPct > 0 ? '+' : ''}${estimatedRoiPct}% on investment

Write exactly 3 short paragraphs (no markdown headers, plain text):
1. What was delivered and the current status — be specific about the service and milestones.
2. The measurable ROI impact — reference the investment vs. value generated numbers confidently.
3. A forward-looking recommendation — one high-impact next step that would deepen the results.

Tone: executive, confident, data-backed, client-ready. No fluff. Under 180 words total.
`;
    return generateText(prompt, 'You are a business value analyst. Output plain prose only — no headers, no bullet points, no markdown.');
  },

  async callRawLLM(prompt: string, systemInstruction?: string): Promise<string> {
    return generateText(prompt, systemInstruction);
  },
  async getEmbedding(text: string): Promise<number[]> {
    if (!isGeminiConfigured || !genAI) {
      throw new Error('Gemini API key is missing. Add GEMINI_API_KEY to your environment variables.');
    }
    const maxRetries = 3;
    let delay = 1000;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
        const result = await model.embedContent({
          content: {
            role: 'user',
            parts: [{ text }]
          },
          outputDimensionality: 768
        } as any);
        if (!result.embedding || !result.embedding.values) {
          throw new Error('Gemini returned an empty embedding response.');
        }
        return result.embedding.values;
      } catch (e: any) {
        console.error(`Gemini Embedding API call failed (attempt ${attempt}/${maxRetries}):`, e);
        const isTransient = e.message?.includes('503') || 
                            e.message?.includes('Service Unavailable') || 
                            e.message?.includes('429') || 
                            e.message?.includes('Resource Has Exhausted') ||
                            e.message?.includes('overloaded');
        
        if (isTransient && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          throw e;
        }
      }
    }
    throw new Error('Failed to generate embedding after maximum retries.');
  }
};
