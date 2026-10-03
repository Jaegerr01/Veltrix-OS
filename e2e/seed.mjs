// Fixture rows for visual QA / e2e only (QA company names, example.com addresses). Never shipped to production data.
const iso = (d) => new Date(Date.now() - d * 864e5).toISOString();
const day = (d) => iso(d).slice(0, 10);
export function seedTables(uid) {
  const L = (i, o) => ({ id: `10000000-0000-0000-0000-00000000000${i}`, user_id: uid, created_at: iso(10 - i), updated_at: iso(i), ...o });
  const leads = [
    L(1, { business_name: 'Northside Dental QA', contact_name: 'Dana Fox', industry: 'Dental', website: 'https://northside-dental.example.com', email: 'dana@northside-dental.example.com', location: 'Austin, TX', pain_point: 'No online booking; outdated site', lead_score: 86, status: 'New', source: 'scraper', notes: '' }),
    L(2, { business_name: 'Harbor Chiropractic QA', contact_name: 'Lee Park', industry: 'Chiropractic', website: 'https://harbor-chiro.example.com', email: 'lee@harbor-chiro.example.com', location: 'Seattle, WA', pain_point: 'Missed calls after hours', lead_score: 78, status: 'Contacted', source: 'manual', notes: 'Intro sent' }),
    L(3, { business_name: 'Summit Clinic QA', contact_name: 'Rae Kim', industry: 'Medical', website: 'https://summit-clinic.example.com', email: 'rae@summit-clinic.example.com', location: 'Denver, CO', pain_point: 'Slow follow-up on inquiries', lead_score: 64, status: 'Replied', source: 'scraper', notes: '' }),
    L(4, { business_name: 'Bright Smiles QA', contact_name: 'Sam Ortiz', industry: 'Dental', website: '', email: 'sam@bright-smiles.example.com', location: 'Miami, FL', pain_point: 'No automation', lead_score: 41, status: 'New', source: 'import', notes: '' }),
  ];
  const outreach = [
    { id: '20000000-0000-0000-0000-000000000001', user_id: uid, lead_id: leads[0].id, channel: 'Email', message: 'Hi Dana, I noticed Northside Dental has no online booking. We help clinics add one in a week. Worth a quick chat?', status: 'Draft', approval_status: 'Pending', attempts: 0, created_at: iso(1), updated_at: iso(1) },
    { id: '20000000-0000-0000-0000-000000000002', user_id: uid, lead_id: leads[1].id, channel: 'Email', message: 'Hi Lee, quick idea to catch after-hours calls for Harbor Chiropractic.', status: 'Sent', approval_status: 'Approved', provider: 'resend', provider_message_id: 'mock-msg-1', sent_at: iso(2), attempts: 1, created_at: iso(3), updated_at: iso(2) },
    { id: '20000000-0000-0000-0000-000000000003', user_id: uid, lead_id: leads[2].id, channel: 'Email', message: 'Hi Rae, following up about Summit Clinic inquiries.', status: 'Failed', approval_status: 'Approved', error: 'Resend: domain not verified', attempts: 2, created_at: iso(2), updated_at: iso(2) },
  ];
  return {
    profiles: [{ id: uid, business_name: 'Postel Studio', description: 'Websites and AI automation for local clinics', services: ['Website redesign', 'AI receptionist'], target_monthly_revenue: 6000, current_monthly_revenue: 0, target_markets: ['Local Medical Clinics', 'Dentists'], autopilot: false, created_at: iso(30), updated_at: iso(1) }],
    leads, outreach_messages: outreach,
    followups: [{ id: '30000000-0000-0000-0000-000000000001', user_id: uid, lead_id: leads[1].id, followup_date: day(-1), followup_type: 'Email', message: 'Gentle bump on the after-hours call idea.', status: 'Pending', created_at: iso(1), updated_at: iso(1) }],
    clients: [{ id: '40000000-0000-0000-0000-000000000001', user_id: uid, business_name: 'Cedar Wellness QA', contact_name: 'Jo Marsh', email: 'jo@cedar.example.com', service_purchased: 'Website redesign', total_value: 3200, monthly_retainer: 400, status: 'Active', created_at: iso(20), updated_at: iso(2) }],
    projects: [{ id: '50000000-0000-0000-0000-000000000001', user_id: uid, client_id: '40000000-0000-0000-0000-000000000001', project_name: 'Cedar website v2', service_type: 'Web', status: 'In Progress', deadline: day(-14), requirements: 'Five pages, booking form', deliverables: ['Design', 'Build'], revision_count: 1, created_at: iso(15), updated_at: iso(1) }],
    proposals: [{ id: '60000000-0000-0000-0000-000000000001', user_id: uid, lead_id: leads[2].id, title: 'Summit Clinic - intake automation', problem: 'Slow follow-up', solution: 'AI intake + reminders', deliverables: ['Setup', 'Training'], timeline: '3 weeks', price: 2400, payment_terms: '50/50', status: 'Draft', created_at: iso(2), updated_at: iso(2) }],
    tasks: [
      { id: '70000000-0000-0000-0000-000000000001', user_id: uid, agent_name: 'Leo', title: 'Research dental clinics in Austin', description: 'Find 10 clinics without online booking', priority: 'High', status: 'In Progress', agent_key: 'leadResearch', created_by: 'ceo', created_at: iso(0.1), updated_at: iso(0.05) },
      { id: '70000000-0000-0000-0000-000000000002', user_id: uid, agent_name: 'Nova', title: 'Draft intro email for Summit Clinic', description: '', priority: 'Medium', status: 'Needs Approval', agent_key: 'outreach', created_by: 'ceo', requires_approval: true, created_at: iso(0.3), updated_at: iso(0.2) },
      { id: '70000000-0000-0000-0000-000000000003', user_id: uid, agent_name: 'Leo', title: 'Score new leads', description: '', priority: 'Low', status: 'Completed', agent_key: 'leadScoring', created_by: 'ceo', result: 'Scored 4 leads', created_at: iso(1), updated_at: iso(0.9) },
    ],
    approval_requests: [{ id: '80000000-0000-0000-0000-000000000001', user_id: uid, type: 'outreach', department: 'Sales', created_by_agent: 'Nova', title: 'Send intro to Northside Dental', context: 'Lead score 86', payload: {}, recommendation: 'Approve', confidence: 82, status: 'Pending', created_at: iso(0.2) }],
    revenue: [{ id: '90000000-0000-0000-0000-000000000001', user_id: uid, client_id: '40000000-0000-0000-0000-000000000001', amount: 1600, type: 'Project', status: 'Paid', payment_date: day(5), month: day(5).slice(0, 7), notes: 'Deposit', created_at: iso(5) }],
    content_ideas: [{ id: 'a0000000-0000-0000-0000-000000000001', user_id: uid, platform: 'Instagram', title: '3 signs your clinic site loses patients', hook: 'Your website is quietly turning patients away.', content: '', content_type: 'Reel', status: 'Idea', created_at: iso(3), updated_at: iso(3) }],
    offers: [{ id: 'b0000000-0000-0000-0000-000000000001', user_id: uid, name: 'AI Receptionist', description: 'Answers calls and books appointments', target_customer: 'Clinics', price_min: 1500, price_max: 3000, monthly_retainer_min: 300, monthly_retainer_max: 600, deliverables: ['Setup'], status: 'Active', created_at: iso(30), updated_at: iso(30) }],
    activities: [{ id: 'c0000000-0000-0000-0000-000000000001', user_id: uid, type: 'agent', actor: 'Leo', action: 'Scored 4 leads', status: 'Success', created_at: iso(0.9) }],
  };
}
