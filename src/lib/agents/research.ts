/**
 * Lead research helpers — gives Daniel (Lead Research Agent) actual eyes.
 *
 * Before this existed, "research" meant scoring whatever fields Barry typed
 * in by hand. Now the agent fetches the lead's live website and produces a
 * structured brief that downstream agents (Emma/outreach, Olivia/proposal)
 * reference for genuine personalization instead of generic cold copy.
 */

const FETCH_TIMEOUT_MS = 10_000;
const MAX_SNAPSHOT_CHARS = 5_000;

/** Strip a page down to human-visible text. Cheap and dependency-free. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface WebsiteSnapshot {
  ok: boolean;
  url: string;
  status?: number;
  title?: string;
  text?: string;
  error?: string;
}

/**
 * Fetch the lead's website and return a text snapshot for the LLM.
 * Never throws — a dead website is itself a valuable research finding
 * (it means they need us more).
 */
export async function fetchWebsiteSnapshot(rawUrl: string): Promise<WebsiteSnapshot> {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const parsed = new URL(url);
    // Autonomous server-side fetch: refuse anything that isn't plain http(s)
    // to a public host — never let a lead record point the agent at
    // localhost, cloud metadata, or internal services (SSRF).
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { ok: false, url, error: 'Unsupported protocol' };
    }
    const host = parsed.hostname.toLowerCase();
    const privatePatterns = [
      /^localhost$/, /^127\./, /^10\./, /^192\.168\./, /^169\.254\./,
      /^172\.(1[6-9]|2\d|3[01])\./, /^0\./, /^\[?::1\]?$/, /\.local$/, /\.internal$/,
    ];
    if (privatePatterns.some(p => p.test(host))) {
      return { ok: false, url, error: 'Private/internal host blocked' };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; VeltrixResearch/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { ok: false, url, status: res.status, error: `HTTP ${res.status}` };
    }

    const html = (await res.text()).slice(0, 400_000);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const text = htmlToText(html).slice(0, MAX_SNAPSHOT_CHARS);

    return {
      ok: true,
      url,
      status: res.status,
      title: titleMatch ? htmlToText(titleMatch[1]) : undefined,
      text,
    };
  } catch (err: any) {
    const msg = err?.name === 'AbortError' ? 'Timed out after 10s' : err?.message || 'Fetch failed';
    return { ok: false, url, error: msg };
  }
}

export interface ResearchBrief {
  summary: string;
  observations: string[];   // concrete, citable facts from their site
  opportunities: string[];  // what VELTRIX can fix/sell
  personalization_hooks: string[]; // lines Emma can open with
}

/** Compact the brief for storage in lead.notes. */
export function briefToNotes(brief: ResearchBrief): string {
  const lines = [
    `[Research Brief — ${new Date().toISOString().slice(0, 10)}]`,
    brief.summary,
    '',
    'Observations:',
    ...brief.observations.map(o => `• ${o}`),
    'Opportunities:',
    ...brief.opportunities.map(o => `• ${o}`),
    'Hooks:',
    ...brief.personalization_hooks.map(h => `• ${h}`),
  ];
  return lines.join('\n');
}
