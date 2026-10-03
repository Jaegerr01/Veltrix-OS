import { GoogleGenerativeAI } from '@google/generative-ai';
import { Lead, LeadScore, ContentIdea, Memory } from '../types';
import { AiError, classifyAiError, notConfigured } from './errors';
import { INSTRUCTION_HIERARCHY, fence, leadBlock } from './untrusted';
import { asErr } from '@/lib/errors';

function readGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY || '';
  return key === 'undefined' ? '' : key;
}

/**
 * Whether an API key is actually present. This used to be a hardcoded `true`,
 * which made /api/health report Gemini as configured on a deployment that had
 * no key at all, and let /api/reel-intel past its own precondition.
 */

/** Reads the environment NOW. Use this (not the load-time constant above) for anything user-facing. */
export function geminiConfigured(): boolean {
  return readGeminiKey().length > 0;
}

async function getGenAI(): Promise<GoogleGenerativeAI | null> {
  // The key comes from the server environment only. It used to also accept an
  // `x-gemini-key` request header forwarded from the browser's localStorage,
  // which let any caller redirect the server's AI spend to a key of their choosing.
  const key = readGeminiKey();

  if (!key) return null;
  try {
    return new GoogleGenerativeAI(key);
  } catch (e) {
    console.error('Failed to initialize GoogleGenerativeAI:', e);
    return null;
  }
}

const SYSTEM_CONTEXT = `
You are PostelOS, an enterprise-grade autonomous AI Business Operating System for PostelOS.
PostelOS is a futuristic AI and creative technology studio offering branding, graphic design, 2D/3D illustrations, streaming/VTuber assets, website development, Shopify storefronts, AI automations, AI chatbots, AI receptionists, AI customer service agents, and growth consulting.

Primary Goal: Help PostelOS reach $6,000/month in revenue.
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

/** Upper bound on a single honored retry wait, so a bad payload can't stall a request. */

/** Short, human-readable message for a quota/rate-limit failure. */
export const QUOTA_MESSAGE =
  'Gemini free-tier rate limit reached (20 requests/minute). Wait about a minute and try again.';

/** Best-effort message text from an unknown thrown value. */
function errorText(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && e !== null && 'message' in e) {
    return String((e as { message: unknown }).message ?? '');
  }
  return String(e ?? '');
}

/** True when the error is a quota/rate-limit rejection rather than a real fault. */
export function isQuotaError(e: unknown): boolean {
  const msg = errorText(e);
  return msg.includes('429') ||
         msg.includes('RESOURCE_EXHAUSTED') ||
         msg.includes('Resource Has Exhausted') ||
         msg.toLowerCase().includes('quota');
}

/**
 * Pull the provider's own `retryDelay` out of an error and return it in ms.
 *
 * The SDK surfaces the RetryInfo detail inside the message text, e.g.
 * `..."retryDelay":"26.28s"...`, so match that rather than trying to walk a
 * typed error shape that the SDK does not guarantee. Returns null when absent.
 */
export function parseRetryDelayMs(e: unknown): number | null {
  const msg = errorText(e);
  const m = msg.match(/"?retryDelay"?\s*:?\s*"?(\d+(?:\.\d+)?)s"?/i);
  if (!m) return null;
  const seconds = Number(m[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  // Pad slightly — the window is rolling, so waiting the exact figure can still
  // land a hair early.
  return Math.ceil(seconds * 1000) + 750;
}

const DEFAULT_MODEL = 'gemini-2.5-flash';
/** Primary model (GEMINI_MODEL) then fallbacks (GEMINI_FALLBACK_MODELS, default the rolling alias). */
function modelList(): string[] {
  const primary = (process.env.GEMINI_MODEL || DEFAULT_MODEL).trim();
  const extra = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-flash-latest').split(',').map(s => s.trim()).filter(Boolean);
  return Array.from(new Set([primary, ...extra]));
}

/**
 * Whole-call time budget. The hosting function has a hard wall (Netlify: ~10-26 s). The old code
 * retried up to 5x and honoured retryDelays of up to 35 s, so one rate-limited call could outlive
 * the function and the browser saw "Connection Failed" with no explanation. Now: bounded budget,
 * short inline waits only, and a typed AiError the UI can explain.
 */
const deadlineMs = () => Number(process.env.GEMINI_DEADLINE_MS) || 22_000;
const MAX_INLINE_WAIT_MS = 8_000;
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

async function generateText(prompt: string, systemInstruction?: string, opts: { json?: boolean } = {}): Promise<string> {
  const key = readGeminiKey();
  if (!key) throw notConfigured();
  const genAI = new GoogleGenerativeAI(key);
  const system = `${systemInstruction || SYSTEM_CONTEXT}\n\n${INSTRUCTION_HIERARCHY}`;
  const started = Date.now();
  const budget = deadlineMs();
  let last: AiError | null = null;

  for (const modelName of modelList()) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      const remaining = budget - (Date.now() - started);
      if (remaining < 1500) throw last ?? new AiError('TIMEOUT', 'The AI took too long to answer.', 'Try again.');
      try {
        const model = genAI.getGenerativeModel(
          {
            model: modelName,
            systemInstruction: system,
            ...(opts.json ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
          },
          { timeout: remaining }
        );
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (!text || !text.trim()) throw new AiError('UNAVAILABLE', 'Gemini returned an empty answer.', 'Try again.');
        return text;
      } catch (eRaw: unknown) { const e = asErr(eRaw);
        const err = classifyAiError(e);
        last = err;
        console.warn(`[gemini] ${modelName} attempt ${attempt}/3 failed: ${err.code} - ${String(e?.message || e).slice(0, 200)}`);
        if (err.code === 'MODEL_NOT_FOUND') break; // try the next model
        if (err.code === 'QUOTA' || err.code === 'UNAVAILABLE') {
          const wait = err.retryAfterMs ?? 1200 * attempt;
          const left = budget - (Date.now() - started);
          if (attempt < 3 && wait <= MAX_INLINE_WAIT_MS && wait < left - 2000) {
            await sleep(wait);
            continue;
          }
        }
        throw err;
      }
    }
  }
  throw last ?? new AiError('UNKNOWN', 'The AI request failed.', 'Check the server log.');
}

/** Parse model JSON tolerantly (fences / leading prose); throws AiError('BAD_OUTPUT') if impossible. */
export function parseJsonLoose(text: string): unknown {
  const t = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(t); } catch { /* fall through */ }
  const a = t.indexOf('{'); const b = t.lastIndexOf('}');
  if (a >= 0 && b > a) {
    try { return JSON.parse(t.slice(a, b + 1)); } catch { /* fall through */ }
  }
  throw new AiError('BAD_OUTPUT', 'The AI answered in an unreadable format.', 'Try again; if it repeats, rephrase the request.');
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
Generate a PostelOS Daily Command Report based on:
- Revenue Target: $${target}
- Current Closed Revenue: $${closed}
- Pipeline Value: $${pipeline}
- Revenue Gap: $${gap}
- Qualified Leads:
${leadsStr}
- Important Memories:
${memoriesStr}

Follow this exact format:
PostelOS Daily Command Report

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
${leadBlock(lead)}

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
      throw new AiError('BAD_OUTPUT', 'The AI returned an unreadable lead score.', 'Run the score again.');
    }
  },

  // 2b. Research a lead from a live website snapshot
  async researchLead(
    lead: Lead,
    website: { ok: boolean; title?: string; text?: string; error?: string }
  ): Promise<{ summary: string; observations: string[]; opportunities: string[]; personalization_hooks: string[] }> {
    const siteSection = website.ok
      ? `Website title: ${website.title || 'n/a'}\nWebsite content (extracted text):\n${website.text || '(empty page)'}`
      : `Their website could NOT be loaded (${website.error}). Treat this as a major finding — a broken or missing web presence is exactly what PostelOS fixes.`;

    const prompt = `
You are Daniel, the Lead Research Agent. Research this prospect using their REAL website content below.

${leadBlock(lead)}

${fence('WEBSITE_CONTENT', siteSection, 8000)}

Produce a research brief. Observations must be SPECIFIC and verifiable from the content above (services they list, missing booking option, outdated copy, no chatbot, weak CTA, etc.) — never invent facts. Personalization hooks are one-line openers Emma (Outreach Agent) can use verbatim.

Output ONLY raw JSON:
{
  "summary": "2-3 sentence overview of the business and its digital posture",
  "observations": ["3-5 concrete facts from their site"],
  "opportunities": ["2-4 things PostelOS can sell them, most valuable first"],
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
  async generateOutreach(lead: Lead, offerName: string, researchNotes?: string, channel: string = 'Email'): Promise<string> {
    const isDM = channel !== 'Email';
    const prompt = `
You are Outreach Agent. Draft a personalized ${isDM ? `${channel} DIRECT MESSAGE (DM)` : 'outreach email'} for this lead:
${leadBlock(lead)}
Target Offer: ${offerName}
${researchNotes ? `\nResearch brief from Daniel (Lead Research Agent) — reference these REAL findings:\n${fence('RESEARCH_BRIEF', researchNotes, 3000)}\n` : ''}
Follow these strict rules:
1. Personalized opening referencing their industry/name${researchNotes ? ' — use a personalization hook from the research brief if one fits' : ''}.
2. One specific observation${researchNotes ? ' taken from the research brief (real, verifiable)' : ' (e.g. mobile speed, lack of booking chat)'}.
3. One clear pain point solved.
4. Soft CTA (e.g. "Can I send you a 2-minute video overview?").
5. Keep it short (${isDM ? '2-3 casual sentences — this is a DM, not an email: no subject line, no greeting like "Dear", no signature block' : '3-4 sentences, no long blocks'}).
6. Do NOT sound needy or like a generic freelancer. Sound like a professional tech partner.${isDM ? '\n7. Write like a human typing on their phone — casual capitalization is fine, zero corporate stiffness.' : ''}
`;
    return generateText(prompt);
  },

  // 4. Generate Follow-up Message
  async generateFollowup(lead: Lead, sequenceDay: number): Promise<string> {
    const prompt = `
You are Follow-up Agent. Draft a follow-up message for:
${leadBlock(lead, { includeNotes: false })}
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
${leadBlock(lead, { includeNotes: false })}
Offer Package: ${offerName}
Agreed/Proposed Price: $${price}

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
You are Content Agent. Generate 3 social media content ideas for PostelOS authority posting.
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
      throw new AiError('BAD_OUTPUT', 'The AI returned unreadable content ideas.', 'Try again.');
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
You are PostelOS's AI Value Analyst. Write a professional, client-facing ROI summary for:

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
  /** Structured output: Gemini JSON mode, parsed tolerantly. Callers validate the shape (zod). */
  async callJson(prompt: string, systemInstruction?: string): Promise<unknown> {
    return parseJsonLoose(await generateText(prompt, systemInstruction, { json: true }));
  },
  async getEmbedding(text: string): Promise<number[]> {
    const genAI = await getGenAI();
    if (!genAI) {
      throw new Error('Gemini API key is missing. Add GEMINI_API_KEY to settings or environment.');
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
        } as Parameters<typeof model.embedContent>[0]);
        if (!result.embedding || !result.embedding.values) {
          throw new Error('Gemini returned an empty embedding response.');
        }
        return result.embedding.values;
      } catch (eRaw: unknown) { const e = asErr(eRaw);
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
