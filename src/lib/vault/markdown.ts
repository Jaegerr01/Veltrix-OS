import { extractInlineTags, normalizePath, normalizeTags, sanitizeTitle } from './links';

export interface ParsedMarkdown {
  title?: string;
  tags: string[];
  pinned?: boolean;
  body: string;
}

/** Parse optional YAML-ish front matter (title / tags / pinned) as written by Obsidian & friends. */
function unquote(v: string): string {
  const t = v.trim();
  if (t.startsWith('"') && t.endsWith('"') && t.length >= 2) { try { return JSON.parse(t); } catch { /* fall through */ } }
  return t.replace(/^["']|["']$/g, '');
}

export function parseMarkdownFile(text: string): ParsedMarkdown {
  let src = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  let title: string | undefined;
  let pinned: boolean | undefined;
  let tags: string[] = [];
  const fm = src.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    src = src.slice(fm[0].length);
    const lines = fm[1].split('\n');
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      const kv = l.match(/^([A-Za-z_]+):\s*(.*)$/);
      if (!kv) continue;
      const key = kv[1].toLowerCase();
      const val = kv[2].trim();
      if (key === 'title' && val) title = unquote(val);
      else if (key === 'pinned') pinned = /^true$/i.test(val);
      else if (key === 'tags') {
        if (val.startsWith('[')) tags = val.replace(/^\[|\]$/g, '').split(',').map(unquote);
        else if (val) tags = val.split(',').map(s => s.trim());
        else { while (lines[i + 1] && /^\s*-\s+/.test(lines[i + 1])) { tags.push(lines[++i].replace(/^\s*-\s+/, '').trim()); } }
      }
    }
  }
  const body = src.replace(/^\n+/, '');
  return { title, pinned, body, tags: normalizeTags([...tags, ...extractInlineTags(body)]) };
}

export function buildMarkdownFile(n: { title: string; body: string; tags: string[]; pinned: boolean }): string {
  const q = (s: string) => JSON.stringify(s);
  const fm = ['---', `title: ${q(n.title)}`, `tags: [${n.tags.map(q).join(', ')}]`, `pinned: ${n.pinned ? 'true' : 'false'}`, '---', ''].join('\n');
  return fm + '\n' + n.body.replace(/\r\n/g, '\n') + (n.body.endsWith('\n') ? '' : '\n');
}

/** "Decisions/2026/Pricing call.md" -> { path: "Decisions/2026", title: "Pricing call" } */
export function splitFilePath(filePath: string): { path: string; title: string } {
  const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
  const file = parts.pop() ?? '';
  return { path: normalizePath(parts.join('/')), title: sanitizeTitle(file.replace(/\.(md|markdown|txt)$/i, '')) };
}
