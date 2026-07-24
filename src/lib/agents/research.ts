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

const MAX_REDIRECTS = 3;

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/, /^127\./, /^10\./, /^192\.168\./, /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./, /^0\./, /^\[?::1\]?$/, /\.local$/, /\.internal$/,
];

/** Refuse anything that isn't plain http(s) to a public host — never let a
 * lead record (or a redirect target) point the agent at localhost, cloud
 * metadata, or internal services (SSRF). */
function assertPublicUrl(parsed: URL): string | null {
  if (!['http:', 'https:'].includes(parsed.protocol)) return 'Unsupported protocol';
  const host = parsed.hostname.toLowerCase();
  if (PRIVATE_HOST_PATTERNS.some(p => p.test(host))) return 'Private/internal host blocked';
  return null;
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
    const parsedInitial = new URL(url);
    const initialError = assertPublicUrl(parsedInitial);
    if (initialError) return { ok: false, url, error: initialError };

    // Follow redirects manually, re-validating the target host at every hop.
    // fetch's built-in redirect:'follow' would only check the ORIGINAL host,
    // letting a public URL 302 to a private/internal address and bypass the
    // guard above entirely.
    let currentUrl = url;
    let res: Response;
    for (let hop = 0; ; hop++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        res = await fetch(currentUrl, {
          signal: controller.signal,
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VeltrixResearch/1.0)',
            Accept: 'text/html,application/xhtml+xml',
          },
        });
      } finally {
        clearTimeout(timer);
      }

      const isRedirect = res.status >= 300 && res.status < 400 && res.headers.get('location');
      if (!isRedirect) break;

      if (hop >= MAX_REDIRECTS) {
        return { ok: false, url: currentUrl, error: 'Too many redirects' };
      }
      const next = new URL(res.headers.get('location')!, currentUrl);
      const redirectError = assertPublicUrl(next);
      if (redirectError) {
        return { ok: false, url: next.toString(), error: `Redirect target blocked: ${redirectError}` };
      }
      currentUrl = next.toString();
    }

    if (!res.ok) {
      return { ok: false, url: currentUrl, status: res.status, error: `HTTP ${res.status}` };
    }

    const html = (await res.text()).slice(0, 400_000);
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const text = htmlToText(html).slice(0, MAX_SNAPSHOT_CHARS);

    return {
      ok: true,
      url: currentUrl,
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
