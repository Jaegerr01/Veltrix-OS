import fs from 'fs';
import path from 'path';

/**
 * AgentLand catalogue — a second tier of specialist agents alongside the 11
 * first-class PostelOS agents in `agents.ts`.
 *
 * Vendored from https://github.com/msitarzewski/agency-agents (MIT, © 2025
 * AgentLand Contributors). The licence is kept verbatim at
 * `catalogue/LICENSE` — do not remove it.
 *
 * Two tiers:
 *   active  — agency-relevant (sales, marketing, paid-media, product,
 *             project-management, support). Offered to the CEO agent.
 *   library — everything else. Not advertised in prompts; loadable by slug
 *             on demand so nothing is lost.
 *
 * Only metadata is ever loaded eagerly. Full system prompts average ~14 KB,
 * so they are read from disk per call — putting 232 of them into a prompt
 * would blow the context budget many times over.
 */

export type CatalogueTier = 'active' | 'library';

export interface CatalogueAgentMeta {
  slug: string;
  name: string;
  description: string;
  category: string;
  tier: CatalogueTier;
  emoji: string;
  color: string;
}

export interface CatalogueAgent extends CatalogueAgentMeta {
  /** Markdown body with the YAML frontmatter stripped — usable as a system prompt. */
  systemPrompt: string;
}

const CATALOGUE_DIR = path.join(process.cwd(), 'src', 'lib', 'agents', 'catalogue');

let cachedIndex: CatalogueAgentMeta[] | null = null;

/** Whole catalogue index (metadata only). Cached after first read. */
export function catalogueIndex(): CatalogueAgentMeta[] {
  if (cachedIndex) return cachedIndex;
  try {
    const raw = fs.readFileSync(path.join(CATALOGUE_DIR, 'index.json'), 'utf-8');
    cachedIndex = JSON.parse(raw) as CatalogueAgentMeta[];
  } catch (err) {
    console.warn('[catalogue] index unavailable:', (err as Error).message);
    cachedIndex = [];
  }
  return cachedIndex;
}

/** List agents, optionally narrowed by tier and/or category. */
export function listCatalogueAgents(opts: { tier?: CatalogueTier; category?: string } = {}): CatalogueAgentMeta[] {
  return catalogueIndex().filter(
    (a) => (!opts.tier || a.tier === opts.tier) && (!opts.category || a.category === opts.category)
  );
}

/** Case-insensitive substring search over name, description, category and slug. */
export function findCatalogueAgents(query: string, limit = 10): CatalogueAgentMeta[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return catalogueIndex()
    .map((a) => {
      const hay = `${a.name} ${a.description} ${a.category} ${a.slug}`.toLowerCase();
      const matched = terms.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);
      // Bonuses must only ever break ties between genuine matches. Applying
      // them unconditionally would give every active agent a non-zero score and
      // let irrelevant results through the filter below.
      if (matched === 0) return { a, score: 0 };
      const score = matched
        + (a.name.toLowerCase().includes(q) ? 2 : 0)
        + (a.tier === 'active' ? 0.5 : 0);
      return { a, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
    .map((x) => x.a);
}

/** Strip leading YAML frontmatter from a markdown document. */
function stripFrontmatter(text: string): string {
  const m = text.match(/^\s*---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return m ? text.slice(m[0].length).trim() : text.trim();
}

/**
 * Load one agent including its full system prompt. Returns null when the slug
 * is unknown or the file cannot be read.
 */
export function loadCatalogueAgent(slug: string): CatalogueAgent | null {
  const meta = catalogueIndex().find((a) => a.slug === slug);
  if (!meta) return null;
  try {
    const file = path.join(CATALOGUE_DIR, meta.category, `${meta.slug}.md`);
    const text = fs.readFileSync(file, 'utf-8');
    return { ...meta, systemPrompt: stripFrontmatter(text) };
  } catch (err) {
    console.warn(`[catalogue] cannot read "${slug}":`, (err as Error).message);
    return null;
  }
}

/**
 * Compact roster for injection into the CEO agent's prompt. Active tier only,
 * grouped by category, descriptions clipped.
 *
 * This is injected on EVERY CEO call, so it is deliberately terse: full
 * descriptions across 70 agents run to ~14 KB. Keep library-tier agents out —
 * their bodies total ~3 MB. Budget target: under 8 KB.
 */
export function activeRosterForPrompt(maxDescChars = 80): string {
  const byCategory = new Map<string, CatalogueAgentMeta[]>();
  for (const a of listCatalogueAgents({ tier: 'active' })) {
    const bucket = byCategory.get(a.category);
    if (bucket) bucket.push(a);
    else byCategory.set(a.category, [a]);
  }

  const clip = (s: string) => {
    const flat = s.replace(/\s+/g, ' ').trim();
    if (flat.length <= maxDescChars) return flat;
    const cut = flat.slice(0, maxDescChars);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).replace(/[,;:.\s]+$/, '')}…`;
  };

  return [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, agents]) =>
      `${category}:\n` + agents.map((a) => `  ${a.slug} — ${clip(a.description)}`).join('\n')
    )
    .join('\n');
}
