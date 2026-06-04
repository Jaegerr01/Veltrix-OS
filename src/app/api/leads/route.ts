import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .order('lead_score', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate required fields
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
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
