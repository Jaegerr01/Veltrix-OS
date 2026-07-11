import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  if (!supabaseAdmin) {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('notes')
      .select('id, title, content, tags, importance, source, created_at')
      .eq('user_id', auth.user.id)
      .like('source', 'reel-intel::%')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error('Reel Intel history error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
