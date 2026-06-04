import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { gemini } from '@/lib/gemini';

export async function POST(req: Request) {
  let leadId = '';
  let offerName = '';
  let price = 1200;
  try {
    const body = await req.json().catch(() => ({}));
    leadId = body.leadId || '';
    offerName = body.offerName || '';
    price = body.price || 1200;
    if (!leadId || !offerName) {
      return NextResponse.json({ success: false, error: 'leadId and offerName are required' }, { status: 400 });
    }

    const leads = await db.getLeads();
    const lead = leads.find(l => l.id === leadId);

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // Call Gemini to generate the markdown proposal
    const proposalText = await gemini.generateProposal(lead, offerName, price);

    // Save proposal to db
    const newProposal = await db.addProposal({
      lead_id: leadId,
      title: `${offerName} Proposal - ${lead.business_name}`,
      problem: lead.pain_point || 'Outdated digital interface and conversion leaks.',
      solution: proposalText,
      deliverables: offerName.toLowerCase().includes('receptionist')
        ? ['Custom AI chatbot or receptionist', 'FAQs knowledge base', 'Lead capture database', 'Calendar appointment booking', 'CRM sync']
        : ['5-page website', 'Mobile responsive design', 'Brand direction', 'High-converting copy', 'Contact & Booking integrations'],
      timeline: '2-3 weeks',
      price: Number(price),
      payment_terms: '50% upfront retainer, 50% upon deployment',
      status: 'Draft'
    });

    // Create a task to review this proposal
    await db.addTask({
      agent_name: 'Proposal Agent',
      title: `Review and finalize proposal for ${lead.business_name}`,
      description: `Drafted proposal for ${offerName} ($${price}). Click Accept to send to client when ready.`,
      priority: 'Medium',
      status: 'Pending',
      related_lead_id: leadId
    });

    // Log action
    await db.logAgentAction(
      'Proposal Agent',
      'Generate Client Proposal',
      `leadId=${leadId}, offer=${offerName}, price=$${price}`,
      proposalText,
      'Success'
    );

    return NextResponse.json({ success: true, proposal: newProposal });
  } catch (error: any) {
    console.error('Error generating proposal API:', error);
    try {
      if (leadId && offerName) {
        const leads = await db.getLeads();
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
          const business = lead.business_name;
          const industry = lead.industry || 'your business';
          const proposalText = `# Business Proposal: ${offerName} Integration\n\nPrepared for: **${business}**\n\n### Executive Summary\nVELTRIX proposes a custom deployment of the **${offerName}** to solve core operational bottlenecks. Local diagnostics indicated critical areas of improvement in lead qualification and response times.\n\n### Solution Overview\n- **Automated Workflow**: Custom FAQs configured based on local ${industry} operations.\n- **Full Availability**: Handles inquiries 24/7, reducing lead bounce rates by 20%.\n- **Pricing Model**: Total setup fee of $${price} (setup and licensing inclusions).\n\n*Generated via local backup templates due to Gemini API offline status (${error.message}).*`;

          const newProposal = await db.addProposal({
            lead_id: leadId,
            title: `${offerName} Proposal - ${business}`,
            problem: lead.pain_point || 'Outdated digital interface and conversion leaks.',
            solution: proposalText,
            deliverables: offerName.toLowerCase().includes('receptionist')
              ? ['Custom AI chatbot or receptionist', 'FAQs knowledge base', 'Lead capture database', 'Calendar appointment booking', 'CRM sync']
              : ['5-page website', 'Mobile responsive design', 'Brand direction', 'High-converting copy', 'Contact & Booking integrations'],
            timeline: '2-3 weeks',
            price: Number(price),
            payment_terms: '50% upfront retainer, 50% upon deployment',
            status: 'Draft'
          });

          await db.addTask({
            agent_name: 'Proposal Agent',
            title: `Review and finalize simulated proposal for ${business}`,
            description: `Offline drafted proposal ($${price}). Click Accept to send. (API Fallback)`,
            priority: 'Medium',
            status: 'Pending',
            related_lead_id: leadId
          });

          await db.logAgentAction(
            'Proposal Agent',
            'Generate Client Proposal Fallback',
            `leadId=${leadId}, offer=${offerName}, price=$${price}, error=${error.message}`,
            proposalText,
            'Success'
          );

          return NextResponse.json({ success: true, proposal: newProposal, simulated: true });
        }
      }
    } catch (fallbackError) {
      console.error('Fallback proposal generation failed:', fallbackError);
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
