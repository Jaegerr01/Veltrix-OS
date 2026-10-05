/** Turn [[Wiki Links]] into normal markdown links (#wiki:<encoded title>) for react-markdown; code is left untouched. */
export function wikiToMarkdownLinks(md: string): string {
  return md
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((part, i) => {
      if (i % 2 === 1) return part; // code
      return part.replace(/\[\[([^\[\]\n]{1,200}?)\]\]/g, (_m, inner: string) => {
        const [target, alias] = inner.split('|');
        let t = target.split('#')[0].trim();
        if (t.includes('/')) t = t.split('/').pop()!.trim();
        if (!t) return _m;
        const label = (alias ?? target).trim().replace(/[\[\]]/g, '');
        return `[${label}](#wiki:${encodeURIComponent(t)})`;
      });
    })
    .join('');
}

export function wikiTargetFromHref(href: string | undefined): string | null {
  if (!href || !href.startsWith('#wiki:')) return null;
  try { return decodeURIComponent(href.slice(6)); } catch { return null; }
}

export interface FolderNode { name: string; path: string; children: FolderNode[]; }

/** Build a folder tree from note paths ("A/B" => A -> B). */
export function buildFolderTree(paths: string[]): FolderNode[] {
  const root: FolderNode = { name: '', path: '', children: [] };
  for (const p of new Set(paths.filter(Boolean))) {
    let node = root;
    let acc = '';
    for (const seg of p.split('/')) {
      acc = acc ? `${acc}/${seg}` : seg;
      let child = node.children.find(c => c.name === seg);
      if (!child) { child = { name: seg, path: acc, children: [] }; node.children.push(child); }
      node = child;
    }
  }
  const sort = (n: FolderNode) => { n.children.sort((a, b) => a.name.localeCompare(b.name)); n.children.forEach(sort); };
  sort(root);
  return root.children;
}
