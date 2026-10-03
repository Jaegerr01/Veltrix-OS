/** Wiki-link + path helpers (pure). */

export function titleKey(t: string): string {
  return t.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Remove fenced code blocks and inline code so `[[not a link]]` inside code is ignored. */
function stripCode(md: string): string {
  return md.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`\n]*`/g, ' ');
}

/** Unique link targets from [[Title]], [[Title|alias]], [[Title#heading]], [[Folder/Title]]. */
export function parseWikiLinks(body: string): { title: string; key: string }[] {
  const out = new Map<string, string>();
  const re = /\[\[([^\[\]\n]{1,200}?)\]\]/g;
  const text = stripCode(body || '');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    let target = m[1].split('|')[0].split('#')[0].trim();
    if (target.includes('/')) target = target.split('/').pop()!.trim();
    if (!target) continue;
    const key = titleKey(target);
    if (!out.has(key)) out.set(key, target);
  }
  return Array.from(out, ([key, title]) => ({ title, key }));
}

/** #tags written inline in the body (not headings, not inside code). */
export function extractInlineTags(body: string): string[] {
  const out = new Set<string>();
  const re = /(^|[\s(])#([A-Za-z][\w/-]{1,39})(?=$|[\s.,;:!?)])/gm;
  const text = stripCode(body || '');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) out.add(m[2].toLowerCase());
  return Array.from(out);
}

const BAD_CHARS = /[<>:"\\|?*\u0000-\u001f]/g;

export function sanitizeTitle(raw: string): string {
  return raw.replace(BAD_CHARS, ' ').replace(/\//g, '-').replace(/\s+/g, ' ').trim().slice(0, 200);
}

/** Normalise a folder path: no "..", no leading/trailing slashes, max depth 6, safe characters. */
export function normalizePath(raw: string | undefined | null): string {
  const segs = String(raw ?? '')
    .replace(/\\/g, '/')
    .split('/')
    .map(s => s.replace(BAD_CHARS, ' ').replace(/\s+/g, ' ').trim().slice(0, 60))
    .filter(s => s && s !== '.' && s !== '..');
  return segs.slice(0, 6).join('/');
}

export function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  const out = new Set<string>();
  for (const t of tags) {
    const v = String(t ?? '').replace(/^#/, '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}_/-]/gu, '').slice(0, 40);
    if (v) out.add(v);
    if (out.size >= 20) break;
  }
  return Array.from(out);
}
