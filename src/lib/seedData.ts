import { BusinessProfile, Goal, Offer, Lead, Task, Memory, DailyReport, ContentIdea } from './types';

export const defaultBusinessProfile: BusinessProfile = {
  id: 'bp-veltrix-1',
  business_name: 'VELTRIX',
  description: 'Futuristic AI and creative technology studio providing websites, branding, AI chatbots, receptionists, and growth consulting.',
  services: [
    'Branding',
    'Graphic design',
    '2D/3D illustrations',
    'Streaming models and VTuber assets',
    'Website development',
    'Shopify storefronts',
    'AI automations',
    'AI chatbots',
    'AI receptionists',
    'AI customer service agents',
    'Growth consulting'
  ],
  target_monthly_revenue: 6000.00,
  current_monthly_revenue: 1500.00, // closed starting revenue
  primary_offer: 'AI Receptionist / Lead Booking Agent',
  secondary_offer: 'AI Website + Brand System',
  target_markets: ['Local service businesses', 'Dental clinics', 'Salons', 'Restaurants', 'Coaches', 'Consultants', 'Real estate agents', 'Small e-commerce stores'],
  autopilot: false,
  created_at: new Date('2026-05-01').toISOString(),
  updated_at: new Date().toISOString()
};

export const defaultGoals: Goal[] = [
  {
    id: 'g-1',
    title: 'Reach $6,000/Month in Revenue',
    description: 'Hit the target recurring and project monthly revenue through AI website deliveries and AI receptionist setup and retainers.',
    target_amount: 6000.00,
    status: 'In Progress',
    priority: 'Critical',
    deadline: '2026-06-30',
    success_criteria: 'Tracked invoiced and paid receipts total >= $6,000 in a single calendar month.',
    created_at: new Date('2026-05-15').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'g-2',
    title: 'Acquire 4 AI Receptionist Retainer Clients',
    description: 'Build a monthly recurring revenue (MRR) base of $1,000 by signing 4 clients on a $250/month optimization retainer.',
    target_amount: 1000.00,
    status: 'In Progress',
    priority: 'High',
    deadline: '2026-06-15',
    success_criteria: '4 clients paying at least $250/month for chatbot maintenance.',
    created_at: new Date('2026-05-20').toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const defaultOffers: Offer[] = [
  {
    id: 'o-1',
    name: 'AI Website + Brand System',
    description: 'A complete brand refresh combined with a premium, responsive, high-converting 5-page website featuring professional copy, SEO, and booking calls-to-action.',
    target_customer: 'Small businesses, Coaches, Startups, Clinics, Restaurants',
    price_min: 800.00,
    price_max: 1500.00,
    monthly_retainer_min: 0,
    monthly_retainer_max: 0,
    deliverables: [
      '5-page custom website',
      'Brand direction board',
      'High-converting copy',
      'Contact form & booking calendar integrations',
      'Basic search engine optimization',
      'Fully mobile responsive design',
      'Optional customer service chatbot integration'
    ],
    status: 'Active',
    created_at: new Date('2026-05-01').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'o-2',
    name: 'AI Receptionist / Lead Booking Agent',
    description: 'Autonomous AI assistant that resides on the client website or channels, captures leads, answers complex FAQs, and automatically schedules appointments in their calendar.',
    target_customer: 'Dental clinics, Medspas, Salons, Real estate agencies, Consultants',
    price_min: 500.00,
    price_max: 1200.00,
    monthly_retainer_min: 150.00,
    monthly_retainer_max: 500.00,
    deliverables: [
      'Custom trained AI chatbot or voice agent interface',
      'Integration with Google Calendar / Calendly',
      'Lead capture database (Google Sheets or CRM integration)',
      'FAQ knowledge base ingestion (up to 50 custom questions)',
      'Outbound email follow-up notification builder',
      'Monthly optimization reports (first month included)'
    ],
    status: 'Active',
    created_at: new Date('2026-05-01').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'o-3',
    name: 'Creative Tech Growth Package',
    description: 'The ultimate marketing upgrade that merges high-end graphic design, brand reboot, landing page structure, social templates, and marketing CRM integrations.',
    target_customer: 'E-commerce storefronts, Growing agencies, High-ticket service providers',
    price_min: 1000.00,
    price_max: 2500.00,
    monthly_retainer_min: 0,
    monthly_retainer_max: 0,
    deliverables: [
      'Full branding reboot (Logo, Palette, Typeface, Assets)',
      'High-converting landing page',
      '10 custom social media graphic assets & layout templates',
      'AI Lead generation funnel with automated intake',
      'Automated email welcome sequences',
      '1-on-1 growth consulting session'
    ],
    status: 'Active',
    created_at: new Date('2026-05-01').toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const defaultLeads: Lead[] = [
  {
    id: 'lead-1',
    business_name: 'Radiant Smiles Dental Clinic',
    industry: 'Dental',
    website: 'http://radiantsmilesexample.com',
    email: 'info@radiantsmilesexample.com',
    phone: '555-0123',
    social_link: 'instagram.com/radiantsmiles',
    location: 'Austin, TX',
    pain_point: 'Has an outdated website that is slow on mobile, and no online booking option. Patients must call during business hours to schedule.',
    lead_score: 9.2,
    status: 'Qualified',
    source: 'Cold Research',
    notes: 'Website is from 2017. Extremely high potential for AI Receptionist + Web Refresh package. The receptionist can handle bookings 24/7.',
    created_at: new Date('2026-05-24').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'lead-2',
    business_name: 'Metro Real Estate Group',
    industry: 'Real Estate',
    website: 'http://metrorealtyex.com',
    email: 'contact@metrorealtyex.com',
    phone: '555-0198',
    social_link: 'linkedin.com/company/metrorealty',
    location: 'Denver, CO',
    pain_point: 'Agents miss after-hour inquiries from home buyers. Low lead capturing capability on landing pages.',
    lead_score: 8.5,
    status: 'Contacted',
    source: 'LinkedIn',
    notes: 'Sent initial outreach message on LinkedIn. Waiting for reply. High-fit for lead booking agent setup.',
    created_at: new Date('2026-05-25').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'lead-3',
    business_name: 'Apex Fitness Coaching',
    industry: 'Fitness',
    website: 'http://apexfitcoach.com',
    email: 'apexcoaching@fitness.com',
    phone: '555-0442',
    social_link: 'instagram.com/apexfit',
    location: 'Miami, FL',
    pain_point: 'Strong social presence but weak conversion funnel. Branding is generic and doesn’t stand out.',
    lead_score: 7.8,
    status: 'Call Booked',
    source: 'Instagram DM',
    notes: 'Discovery call booked for next Tuesday. They need a custom brand refresh and high-converting landing page to sell high-ticket training.',
    created_at: new Date('2026-05-26').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'lead-4',
    business_name: 'Bella Vita Salon & Spa',
    industry: 'Beauty & Wellness',
    website: 'http://bellavitasalonex.com',
    email: 'hello@bellavitasalonex.com',
    phone: '555-0771',
    social_link: 'facebook.com/bellavitasalon',
    location: 'Phoenix, AZ',
    pain_point: 'Front desk is overwhelmed handling bookings and answering simple FAQ calls about prices, leading to long waits.',
    lead_score: 8.9,
    status: 'New',
    source: 'Cold Research',
    notes: 'Prime candidate for the AI Receptionist. The receptionist can answer pricing and service questions instantly.',
    created_at: new Date('2026-05-27').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'lead-5',
    business_name: 'The Green Garden Bistro',
    industry: 'Restaurant',
    website: 'http://greengardenbistro.com',
    email: 'events@greengardenbistro.com',
    phone: '555-1212',
    social_link: 'instagram.com/greengardenbistro',
    location: 'Portland, OR',
    pain_point: 'No online catering inquiry system. Website has poor typography and branding is a bit dull.',
    lead_score: 6.4,
    status: 'New',
    source: 'Instagram',
    notes: 'Catering leads could be captured by a chat booking agent. Website layout needs updates.',
    created_at: new Date('2026-05-27').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'lead-6',
    business_name: 'Sol Threads E-Commerce',
    industry: 'E-commerce',
    website: 'http://solthreadsstore.com',
    email: 'support@solthreadsstore.com',
    phone: '555-3321',
    social_link: 'instagram.com/solthreads',
    location: 'Los Angeles, CA',
    pain_point: 'Customers asking where their order is in support tickets. High customer service agent costs.',
    lead_score: 8.0,
    status: 'Follow-up Later',
    source: 'Inbound Inquiry',
    notes: 'Needs order tracking automation and FAQ handling. Postponed to next month due to internal budget constraints.',
    created_at: new Date('2026-05-22').toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const defaultTasks: Task[] = [
  {
    id: 't-1',
    agent_name: 'Lead Research Agent',
    title: 'Research and qualification checks for 20 local service leads',
    description: 'Find dental clinics and medspas in the local area, assess their website speed, mobile responsiveness, and check for existing online chat widgets.',
    priority: 'High',
    status: 'Pending',
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    related_goal_id: 'g-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 't-2',
    agent_name: 'Outreach Agent',
    title: 'Draft outreach messages for qualified dental clinics',
    description: 'Tailor outreach messages referencing their specific website deficiencies (lack of booking system, slow mobile loading) for Radiant Smiles Dental Clinic.',
    priority: 'Critical',
    status: 'In Progress',
    due_date: new Date().toISOString().split('T')[0], // today
    related_goal_id: 'g-1',
    related_lead_id: 'lead-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 't-3',
    agent_name: 'Content Agent',
    title: 'Create LinkedIn authority post about AI Receptionists',
    description: 'Write a value-rich post showing the ROI math of an AI Booking receptionist for local businesses (saving front desk hours + booking 24/7).',
    priority: 'Medium',
    status: 'Completed',
    due_date: new Date().toISOString().split('T')[0],
    result: 'LinkedIn post drafted, approved, and posted to founder profile. Reached 1,200 impressions and generated 1 lead.',
    created_at: new Date('2026-05-26').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 't-4',
    agent_name: 'Proposal Agent',
    title: 'Build proposal template for AI Receptionist integration',
    description: 'Create a template outlining client problem, solution benefits, setup checklist, timeline, and monthly recurring pricing terms.',
    priority: 'High',
    status: 'In Progress',
    due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // in 2 days
    related_goal_id: 'g-2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 't-5',
    agent_name: 'Follow-up Agent',
    title: 'Follow up with warm leads',
    description: 'Send follow-up messages to Metro Real Estate Group regarding the proposal sent or conversation starter.',
    priority: 'High',
    status: 'Pending',
    due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    related_lead_id: 'lead-2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const defaultMemories: Memory[] = [
  {
    id: 'mem-1',
    type: 'Business',
    content: 'VELTRIX provides premium AI automations and high-end creative technology services. We position ourselves as an elite agency, not budget freelancers.',
    tags: ['positioning', 'agency-identity'],
    importance: 9,
    source: 'Manual',
    created_at: new Date('2026-05-10').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mem-2',
    type: 'Business',
    content: 'The core business revenue target is $6,000/month. We measure progress on: Monthly Revenue = Leads × Booked Calls × Close Rate × Average Deal Value.',
    tags: ['revenue', 'goals', 'business-model'],
    importance: 10,
    source: 'Manual',
    created_at: new Date('2026-05-10').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mem-3',
    type: 'Strategy',
    content: 'Our primary recommended offer is the AI Receptionist / Lead Booking Agent. It is highly effective because it allows for both high upfront setup fees ($500-$1200) and low-maintenance monthly recurring retainers ($150-$500).',
    tags: ['offers', 'pricing', 'strategy'],
    importance: 8,
    source: 'Manual',
    created_at: new Date('2026-05-12').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mem-4',
    type: 'Personal Preference',
    content: 'All outreach communication drafts must be reviewed and approved by the user (Level 4 safety level) before they are sent out to prospects. We never authorize direct AI-to-client messaging.',
    tags: ['safety', 'permissions', 'outreach'],
    importance: 10,
    source: 'Manual',
    created_at: new Date('2026-05-15').toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mem-5',
    type: 'Lesson',
    content: 'Clinics and medical service practices care more about appointment show-up rates and saving receptionist staff hours than pure aesthetic website redesigns. Pitch the time-saved and automated reminders angle first.',
    tags: ['pitching', 'sales', 'clinics'],
    importance: 8,
    source: 'AI CEO',
    created_at: new Date('2026-05-20').toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const defaultDailyReports: DailyReport[] = [
  {
    id: 'rep-1',
    report_date: new Date('2026-05-26').toISOString().split('T')[0],
    revenue_target: 6000.00,
    closed_revenue: 1500.00,
    pipeline_value: 3200.00,
    revenue_gap: 4500.00,
    top_priority: 'Create LinkedIn authority content and check in on clinic outreach response metrics.',
    leads_to_contact: ['Radiant Smiles Dental Clinic', 'Metro Real Estate Group'],
    followups_due: ['Sol Threads E-Commerce'],
    content_to_post: 'LinkedIn post on how an automated AI Receptionist saved a local salon 22 hours per week in call bookings.',
    recommended_action: 'Directly target local dental practice web administrators. Offer free 2-min website analysis drafts.',
    created_at: new Date('2026-05-26T18:00:00Z').toISOString()
  }
];

export const defaultContentIdeas: ContentIdea[] = [
  {
    id: 'ci-1',
    platform: 'LinkedIn',
    title: 'The AI Receptionist Math for Local Businesses',
    hook: 'If your business has a front desk, you are losing at least 15 hours a week to phone calls that could be automated.',
    content: 'Breakdown of receptionist wages vs. AI bot setup. Highlight: 1) Capturing booking leads at 11:00 PM while sleeping. 2) Zero missed calls. 3) Retainers are a fraction of payroll costs. Offer a free 2-min AI assessment to businesses in the comments.',
    content_type: 'Text',
    status: 'Approved',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'ci-2',
    platform: 'Instagram',
    title: 'Before & After: Dental Website Booking Flow Redesign',
    hook: 'Stop forcing patient prospects to dial a phone number in 2026.',
    content: 'Visual slider idea showing: Slide 1: Old text-heavy clinic page with a giant phone number and no booking link. Slide 2: Modern dark-glass VELTRIX layout with a glowing "Book Appointment Instantly" chatbot floating at the bottom. Detail how this doubles conversion rates.',
    content_type: 'Image',
    status: 'Idea',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'ci-3',
    platform: 'YouTube',
    title: 'How I Built an AI Booking Agent in 2 Hours',
    hook: 'Watch me build an autonomous AI receptionist from scratch for a local salon.',
    content: 'Video outline: 1. The Problem: Salon owner misses 30% of bookings. 2. Fetching FAQ data using a text scraper. 3. Building the logical appointment flows. 4. Live demo booking a hair salon appointment. CTA to check out VELTRIX automations.',
    content_type: 'Short-form Video',
    status: 'Idea',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
