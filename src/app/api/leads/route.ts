import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const data = await db.getLeads();
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

    const data = await db.addLead({
      business_name: body.business_name,
      contact_name: body.contact_name || undefined,
      industry: body.industry || undefined,
      website: body.website || undefined,
      email: body.email || undefined,
      phone: body.phone || undefined,
      social_link: body.social_link || undefined,
      location: body.location || undefined,
      pain_point: body.pain_point || undefined,
      lead_score: body.lead_score || 0.0,
      status: body.status || 'New',
      source: body.source || 'Direct',
      notes: body.notes || undefined,
    });

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

