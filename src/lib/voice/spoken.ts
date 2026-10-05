/** Turn AI/markdown text into clean speech text. Pure + tested. Never invents content. */
export function toSpoken(text: string, maxChars = 900): string {
  let s = (text || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+•]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g, (_, n) => {
      const num = parseFloat(String(n).replace(/,/g, ''));
      if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} million dollars`;
      return `${num.toLocaleString('en-US')} dollars`;
    })
    .replace(/\bDMs?\b/g, 'direct messages')
    .replace(/\s*\n+\s*/g, '. ')
    .replace(/\.\s*\.+/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (s.length > maxChars) {
    const cut = s.slice(0, maxChars);
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
    s = (end > maxChars * 0.5 ? cut.slice(0, end + 1) : cut).trim() + ' The rest is on screen.';
  }
  return s;
}
