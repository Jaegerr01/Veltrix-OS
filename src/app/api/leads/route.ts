import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/requireUser';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { user, response } = await requireUser(req);
    if (response) return response;

    const body = await req.json();

    if (!body.business_name) {
      return NextResponse.json({ success: false, error: 'business_name is required' }, { status: 400 });
    }

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
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

