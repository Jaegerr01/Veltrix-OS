import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

async function getUserId(req: NextRequest): Promise<string | null> {
  if (!supabaseAdmin) return null;
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user?.id ?? null;
}

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 });
  }

  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const files = formData.getAll('files') as File[];

  if (!files.length) {
    return NextResponse.json({ success: false, error: 'No files received' }, { status: 400 });
  }

  let synced = 0;
  const errors: string[] = [];

  for (const file of files) {
    if (!file.name.endsWith('.md')) continue;

    try {
      const content = (await file.text()).trim();
      if (!content) continue;

      const title  = file.name.replace('.md', '');
      const source = `obsidian::upload::${title}`;
      const body   = `[OBSIDIAN: ${title}]\n\n${content.substring(0, 2500)}`;

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
          .update({ content: body, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .eq('user_id', userId));
      } else {
        ({ error } = await supabaseAdmin.from('notes').insert({
          user_id:    userId,
          title,
          content:    body,
          tags:       ['obsidian'],
          importance: 7,
          source,
        }));
      }

      if (error) errors.push(`${file.name}: ${error.message}`);
      else synced++;
    } catch (err: any) {
      errors.push(`${file.name}: ${err.message}`);
    }
  }

  await supabaseAdmin.from('activities').insert({
    user_id: userId,
    type:    'system',
    actor:   'Obsidian Brain',
    action:  `Imported ${synced}/${files.length} notes from file upload`,
    status:  errors.length && synced === 0 ? 'Failed' : errors.length ? 'Partial' : 'Success',
  }).catch(() => {});

  return NextResponse.json({ success: true, synced, total: files.length, errors });
}
