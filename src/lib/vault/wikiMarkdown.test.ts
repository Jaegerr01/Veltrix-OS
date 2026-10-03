import { describe, it, expect } from 'vitest';
import { buildFolderTree, wikiToMarkdownLinks, wikiTargetFromHref } from './wikiMarkdown';

describe('wikiMarkdown', () => {
  it('converts wiki links but leaves code alone', () => {
    const out = wikiToMarkdownLinks('See [[Pricing|our rates]] and [[Leads/Acme Dental#x]]. `[[code]]`\n```\n[[fenced]]\n```');
    expect(out).toContain('[our rates](#wiki:Pricing)');
    expect(out).toContain('[Leads/Acme Dental#x](#wiki:Acme%20Dental)');
    expect(out).toContain('`[[code]]`');
    expect(out).toContain('[[fenced]]');
  });
  it('decodes hrefs and rejects others', () => {
    expect(wikiTargetFromHref('#wiki:Acme%20Dental')).toBe('Acme Dental');
    expect(wikiTargetFromHref('https://x.com')).toBeNull();
    expect(wikiTargetFromHref('#wiki:%E0%A4%A')).toBeNull();
  });
  it('builds a sorted nested folder tree', () => {
    const t = buildFolderTree(['Decisions/2026', 'Agent Notes', 'Decisions', '', 'Decisions/2025']);
    expect(t.map(n => n.name)).toEqual(['Agent Notes', 'Decisions']);
    expect(t[1].children.map(c => c.path)).toEqual(['Decisions/2025', 'Decisions/2026']);
  });
});
