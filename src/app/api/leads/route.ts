import { z } from 'zod';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/requireUser';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { asErr } from '@/lib/errors';

export async function GET(req: Request) {
  try {
    const { user, response } = await requireUser(req);
    if (response) return response;

    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .order('lead_score', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, data: data || [] });
  } catch (errRaw: unknown) { const err = asErr(errRaw);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user, response } = await requireUser(req);
    if (response) return response;

    const str = (n: number) => z.string().trim().max(n).nullish();
    const parsedLead = z.object({
      business_name: z.string().trim().min(1, 'business_name is required').max(200),
      contact_name: str(200), industry: str(120), website: str(500), email: str(254), phone: str(60),
      social_link: str(500), location: str(200), pain_point: str(2000), notes: str(5000), source: str(80), status: str(40),
      lead_score: z.number().min(0).max(10).nullish(),
    }).safeParse(await req.json().catch(() => null));
    if (!parsedLead.success) {
      return NextResponse.json({ success: false, error: 'Invalid lead: ' + parsedLead.error.issues.slice(0, 3).map(i => `${i.path.join('.') || 'body'} ${i.message}`).join('; ') }, { status: 400 });
    }
    const body = parsedLead.data;

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        business_name: body.business_name,
        contact_name: body.contact_name || null,
        industry: body.industry || null,
        website: body.website || null,
        email: body.email || null,
        phone: body.phone || null,
        social_link: body.social_link || null,
        location: body.location || null,
        pain_point: body.pain_point || null,
        lead_score: body.lead_score || 0.0,
        status: body.status || 'New',
        source: body.source || 'Direct',
        notes: body.notes || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Check if autopilot is enabled and trigger loop
    try {
      const profile = await db.getBusinessProfile();
      if (profile.autopilot) {
        const { runAutopilotForLead } = await import('@/lib/agents/autopilot');
        // Trigger background task asynchronously
        runAutopilotForLead(data.id);
      }
    } catch (err) {
      console.error('Failed to trigger background autopilot scoring:', err);
    }

    return NextResponse.json({ success: true, data });
  } catch (errRaw: unknown) { const err = asErr(errRaw);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

