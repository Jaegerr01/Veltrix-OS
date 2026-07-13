import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { headers } from 'next/headers';

// ── Types ────────────────────────────────────────────────────────────────────

interface VaultNote {
  title: string;
  content: string;
  tag: string;
}

// ── GitHub API sync (works on Netlify + local) ───────────────────────────────

async function collectNotesFromGitHub(): Promise<VaultNote[]> {
  let token = process.env.GITHUB_TOKEN;
  let repo  = process.env.GITHUB_OBSIDIAN_REPO; // e.g. "barry/veltrix-vault"

  try {
    const nextHeaders = await headers();
    token = nextHeaders.get('x-github-token') || token;
    repo = nextHeaders.get('x-github-repo') || repo;
  } catch {}

  if (!token || !repo) return [];

  const gitHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Fetch the full recursive file tree
  const treeRes = await fetch(
    `https://api.github.com/repos/${repo}/git/trees/HEAD?recursive=1`,
    { headers: gitHeaders, next: { revalidate: 0 } }
  );
  if (!treeRes.ok) throw new Error(`GitHub tree fetch failed: ${treeRes.status}`);

  const tree = await treeRes.json();
  const mdFiles: { path: string; url: string }[] = (tree.tree ?? [])
    .filter((f: any) => f.type === 'blob' && f.path.endsWith('.md'))
    .map((f: any) => ({ path: f.path, url: f.url }));

  const results: VaultNote[] = [];

  await Promise.all(
    mdFiles.map(async (file) => {
      try {
        const blobRes = await fetch(file.url, { headers: gitHeaders, next: { revalidate: 0 } });
        if (!blobRes.ok) return;
        const blob = await blobRes.json();
        const content = Buffer.from(blob.content, 'base64').toString('utf-8').trim();
        if (!content) return;

        const parts  = file.path.split('/');
        const folder = parts.length > 1 ? parts[0] : 'root';
        const title  = parts[parts.length - 1].replace('.md', '');
        results.push({ title, content, tag: folder });
      } catch {
        // skip unreadable files silently
      }
    })
  );

  return results;
}

// ── Local filesystem sync (local dev only — not available on Netlify) ─────────

async function collectNotesFromDisk(): Promise<VaultNote[]> {
  let vaultPath = process.env.OBSIDIAN_VAULT_PATH;
  try {
    const nextHeaders = await headers();
    vaultPath = nextHeaders.get('x-obsidian-path') || vaultPath;
  } catch {}
  if (!vaultPath) return [];

  try {
    const fs   = await import('fs');
    const path = await import('path');

    function walk(dir: string, base: string): VaultNote[] {
      const out: VaultNote[] = [];
      let entries: import('fs').Dirent[] = [];
      try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }

      for (const e of entries) {
        if (e.name.startsWith('.')) continue;
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          out.push(...walk(full, base));
        } else if (e.name.endsWith('.md')) {
          let content = '';
          try { content = fs.readFileSync(full, 'utf-8').trim(); } catch {}
          if (!content) continue;
          const rel    = full.replace(base, '').replace(/\\/g, '/').replace(/^\//, '');
          const folder = rel.includes('/') ? rel.split('/')[0] : 'root';
          out.push({ title: e.name.replace('.md', ''), content, tag: folder });
        }
      }
      return out;
    }

    return walk(vaultPath, vaultPath);
  } catch {
    return [];
  }
}

// ── Auth helper — get user_id from Authorization header ──────────────────────

async function getUserId(req: NextRequest): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user?.id ?? null;
}

// ── Routes ───────────────────────────────────────────────────────────────────

export async function GET() {
  const githubReady = !!(process.env.GITHUB_TOKEN && process.env.GITHUB_OBSIDIAN_REPO);
  const localReady  = !!process.env.OBSIDIAN_VAULT_PATH;

  return NextResponse.json({
    success: true,
    mode: githubReady ? 'github' : localReady ? 'local' : 'unconfigured',
    github_repo: process.env.GITHUB_OBSIDIAN_REPO ?? null,
    vault_path:  process.env.OBSIDIAN_VAULT_PATH ?? null,
  });
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
      { status: 500 }
    );
  }

  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized — please log in first' },
      { status: 401 }
    );
  }

  // Collect notes — prefer GitHub (works deployed), fall back to local disk
  let notes: VaultNote[] = [];
  let mode = 'unconfigured';

  try {
    notes = await collectNotesFromGitHub();
    mode  = 'github';
  } catch (err: any) {
    console.warn('GitHub vault sync failed, trying local:', err.message);
  }

  if (notes.length === 0) {
    notes = await collectNotesFromDisk();
    mode  = notes.length > 0 ? 'local' : 'unconfigured';
  }

  if (notes.length === 0) {
    return NextResponse.json({
      success: true,
      synced: 0,
      total: 0,
      mode,
      message:
        mode === 'unconfigured'
          ? 'No vault configured. Add GITHUB_TOKEN + GITHUB_OBSIDIAN_REPO env vars (recommended) or OBSIDIAN_VAULT_PATH for local dev.'
          : 'Vault is empty — add notes in Obsidian first.',
    });
  }

  let synced = 0;
  const errors: string[] = [];

  for (const note of notes) {
    const memoryContent = `[OBSIDIAN: ${note.title}]\n\n${note.content.substring(0, 2500)}`;
    const source        = `obsidian::${note.tag}::${note.title}`;

    const { data: existing } = await supabaseAdmin
      .from('notes')
      .select('id')
      .eq('user_id', userId)
      .eq('source', source)
      .maybeSingle();

    let error;
    if (existing?.id) {
      ({ error } = await supabaseAdmin
        .from('notes')
        .update({ content: memoryContent, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .eq('user_id', userId));
    } else {
      ({ error } = await supabaseAdmin.from('notes').insert({
        user_id:   userId,
        title:     note.title,
        content:   memoryContent,
        tags:      ['obsidian', note.tag],
        importance: 7,
        source,
      }));
    }

    if (error) errors.push(`${note.title}: ${error.message}`);
    else synced++;
  }

  await supabaseAdmin.from('activities').insert({
    user_id: userId,
    type:    'system',
    actor:   'Obsidian Brain',
    action:  `Synced ${synced}/${notes.length} vault notes to VELTRIX memory (${mode})`,
    status:  errors.length ? 'Partial' : 'Success',
  });

  return NextResponse.json({ success: true, synced, total: notes.length, mode, errors });
}
