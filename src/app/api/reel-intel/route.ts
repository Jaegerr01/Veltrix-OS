import { NextRequest, NextResponse } from 'next/server';
import { gemini, isGeminiConfigured } from '@/lib/ai/gemini';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit } from '@/lib/auth/rateLimit';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { AGENTS } from '@/lib/agents/agents';

// ── Types ────────────────────────────────────────────────────────────────────

interface ReelIntelResult {
  summary: string;
  creator: string;
  topic: string;
  keyTakeaways: string[];
  veltrixRelevance: string;
  implementationSuggestions: { area: string; action: string; priority: string }[];
  tags: string[];
}

interface OEmbedData {
  author_name?: string;
  title?: string;
  html?: string;
  thumbnail_url?: string;
}

// ── Instagram oEmbed metadata extraction ─────────────────────────────────────

async function fetchReelMetadata(url: string): Promise<OEmbedData | null> {
  try {
    const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Extract shortcode from Instagram URL ─────────────────────────────────────

function extractShortcode(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:reel|p|reels)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

// ── Write note to Obsidian vault (local dev only) ────────────────────────────

async function writeToObsidian(title: string, content: string): Promise<boolean> {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  if (!vaultPath) return false;

  try {
    const fs = await import('fs');
    const path = await import('path');

    const reelIntelDir = path.join(vaultPath, 'Reel Intel');
    if (!fs.existsSync(reelIntelDir)) {
      fs.mkdirSync(reelIntelDir, { recursive: true });
    }

    const safeTitle = title.replace(/[<>:"/\\|?*]/g, '-').substring(0, 80);
    const filename = `${safeTitle}.md`;
    const filepath = path.join(reelIntelDir, filename);

    fs.writeFileSync(filepath, content, 'utf-8');
    return true;
  } catch (err) {
    console.warn('Failed to write to Obsidian vault:', err);
    return false;
  }
}

// ── Build Obsidian markdown note ─────────────────────────────────────────────

function buildObsidianNote(url: string, result: ReelIntelResult): string {
  const date = new Date().toISOString().split('T')[0];
  const tags = result.tags.map(t => `#${t.replace(/\s+/g, '-')}`).join(' ');

  let md = `---\nsource: instagram-reel\nurl: ${url}\ncreator: ${result.creator}\ntopic: ${result.topic}\ndate: ${date}\ntags: [${result.tags.map(t => `"${t}"`).join(', ')}]\n---\n\n`;
  md += `# ${result.summary.split('.')[0]}\n\n`;
  md += `> **Source**: [Instagram Reel](${url})  \n`;
  md += `> **Creator**: ${result.creator}  \n`;
  md += `> **Topic**: ${result.topic}  \n`;
  md += `> **Analyzed**: ${date}  \n\n`;
  md += `## Summary\n${result.summary}\n\n`;
  md += `## Key Takeaways\n${result.keyTakeaways.map(t => `- ${t}`).join('\n')}\n\n`;
  md += `## VELTRIX Relevance\n${result.veltrixRelevance}\n\n`;
  md += `## Implementation Suggestions\n`;
  result.implementationSuggestions.forEach(s => {
    md += `- **[${s.area}]** ${s.action} _(${s.priority} priority)_\n`;
  });
  md += `\n${tags}\n`;

  return md;
}

// ── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = checkRateLimit(auth.user.id);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Rate limit exceeded. Try again in a minute.' }, { status: 429 });
  }

  if (!isGeminiConfigured) {
    return NextResponse.json({ success: false, error: 'Gemini API key not configured.' }, { status: 500 });
  }

  try {
    const { url, context } = await req.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ success: false, error: 'URL is required.' }, { status: 400 });
    }

    // Validate Instagram URL
    const shortcode = extractShortcode(url);
    if (!shortcode) {
      return NextResponse.json({
        success: false,
        error: 'Invalid Instagram URL. Paste a link like: https://www.instagram.com/reel/...'
      }, { status: 400 });
    }

    // Dedup check — skip if this reel was already analyzed
    if (supabaseAdmin) {
      const { data: existing } = await supabaseAdmin
        .from('notes')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('source', `reel-intel::${shortcode}`)
        .maybeSingle();

      if (existing?.id) {
        return NextResponse.json({
          success: false,
          error: 'This reel has already been analyzed. Check your Intel History.'
        }, { status: 409 });
      }
    }

    // Fetch oEmbed metadata
    const metadata = await fetchReelMetadata(url);
    const authorName = metadata?.author_name || 'Unknown';
    const caption = metadata?.title || '';

    // Build the analysis prompt
    const agent = AGENTS.reelIntel;
    const contextParts = [
      `Instagram Reel URL: ${url}`,
      `Reel Shortcode: ${shortcode}`,
      `Creator: ${authorName}`,
      caption ? `Caption/Description: ${caption}` : '',
      context ? `User's context note: ${context}` : '',
    ].filter(Boolean).join('\n');

    const prompt = `Analyze this Instagram Reel and extract actionable business intelligence:\n\n${contextParts}\n\nProvide your deep analysis as the JSON object specified in your instructions. Research the topic thoroughly and map everything to VELTRIX's context as an AI automation agency targeting SMBs.`;

    const rawResponse = await gemini.callRawLLM(prompt, agent.systemPrompt);

    // Parse and validate the JSON response
    let result: ReelIntelResult;
    try {
      const cleaned = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      // Validate required fields with safe defaults
      result = {
        summary: typeof parsed.summary === 'string' ? parsed.summary : 'Analysis completed.',
        creator: typeof parsed.creator === 'string' ? parsed.creator : authorName,
        topic: typeof parsed.topic === 'string' ? parsed.topic : 'General',
        keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways.filter((t: unknown) => typeof t === 'string') : [],
        veltrixRelevance: typeof parsed.veltrixRelevance === 'string' ? parsed.veltrixRelevance : '',
        implementationSuggestions: Array.isArray(parsed.implementationSuggestions)
          ? parsed.implementationSuggestions.map((s: any) => ({
              area: typeof s?.area === 'string' ? s.area : 'Strategy',
              action: typeof s?.action === 'string' ? s.action : '',
              priority: typeof s?.priority === 'string' ? s.priority : 'Medium',
            })).filter((s: any) => s.action)
          : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags.filter((t: unknown) => typeof t === 'string').slice(0, 10) : [],
      };
    } catch {
      return NextResponse.json({
        success: false,
        error: 'AI returned malformed analysis. Try again.'
      }, { status: 500 });
    }

    // Save to Supabase notes table
    let noteId: string | null = null;
    if (supabaseAdmin) {
      const noteContent = `[REEL INTEL: ${result.summary.split('.')[0]}]\n\nSource: ${url}\nCreator: ${result.creator}\nTopic: ${result.topic}\n\n${result.summary}\n\nKey Takeaways:\n${result.keyTakeaways.map(t => `• ${t}`).join('\n')}\n\nVELTRIX Relevance:\n${result.veltrixRelevance}\n\nImplementation:\n${result.implementationSuggestions.map(s => `• [${s.area}] ${s.action} (${s.priority})`).join('\n')}`;

      let embedding: number[] | null = null;
      try {
        embedding = await gemini.getEmbedding(noteContent.substring(0, 2000));
      } catch {
        console.warn('Failed to generate embedding for reel intel note.');
      }

      const { data, error } = await supabaseAdmin.from('notes').insert({
        user_id: auth.user.id,
        title: `Reel Intel: ${result.summary.split('.')[0].substring(0, 60)}`,
        content: noteContent,
        tags: ['reel-intel', 'instagram', result.topic.toLowerCase(), ...result.tags.slice(0, 3)],
        importance: 8,
        source: `reel-intel::${shortcode}`,
        embedding,
      }).select('id').single();

      if (!error && data) noteId = data.id;

      // Log activity
      await supabaseAdmin.from('activities').insert({
        user_id: auth.user.id,
        type: 'agent',
        actor: 'Nova (Reel Intel Agent)',
        action: `Analyzed Instagram Reel from ${result.creator}: ${result.summary.split('.')[0].substring(0, 80)}`,
        status: 'Success',
      });
    }

    // Write to Obsidian vault (local dev only)
    const obsidianNote = buildObsidianNote(url, result);
    const safeTitle = `${result.topic} - ${result.creator} - ${new Date().toISOString().split('T')[0]}`;
    const savedToObsidian = await writeToObsidian(safeTitle, obsidianNote);

    return NextResponse.json({
      success: true,
      data: result,
      noteId,
      savedToObsidian,
      metadata: {
        author: authorName,
        caption: caption || null,
        shortcode,
      },
    });

  } catch (error: any) {
    console.error('Reel Intel API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Analysis failed.' }, { status: 500 });
  }
}
