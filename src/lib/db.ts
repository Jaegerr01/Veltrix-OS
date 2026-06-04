import { supabase as supabaseInstance } from './supabase/client';
import * as seed from './seedData';
import {
  BusinessProfile,
  Goal,
  Offer,
  Lead,
  LeadScore,
  OutreachMessage,
  Followup,
  Call,
  Proposal,
  Client,
  Project,
  Task,
  Revenue,
  Expense,
  Memory,
  AgentLog,
  ToolLog,
  DailyReport,
  ContentIdea,
  ChatMessage
} from './types';

// Detect Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
  !!(supabaseUrl &&
  supabaseUrl !== 'undefined' &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'undefined');

export const supabase = isSupabaseConfigured
  ? supabaseInstance
  : null;

// Global server-side mock storage (persisted during server session)
// On client side, we will load/save to LocalStorage if window is defined.
const globalMockStorage = globalThis as any;

if (!globalMockStorage.__mockDb) {
  const isDemo = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === 'true';
  const businessProfile = { ...seed.defaultBusinessProfile };
  if (!isDemo) {
    businessProfile.current_monthly_revenue = 0.00;
  }

  globalMockStorage.__mockDb = {
    businessProfile: businessProfile,
    goals: isDemo ? [...seed.defaultGoals] : [] as Goal[],
    offers: [...seed.defaultOffers],
    leads: isDemo ? [...seed.defaultLeads] : [] as Lead[],
    leadScores: [] as LeadScore[],
    outreachMessages: [] as OutreachMessage[],
    followups: [] as Followup[],
    calls: [] as Call[],
    proposals: [] as Proposal[],
    clients: [] as Client[],
    projects: [] as Project[],
    tasks: isDemo ? [...seed.defaultTasks] : [] as Task[],
    revenue: isDemo ? [
      {
        id: 'rev-seed-1',
        client_id: 'c-seed-1',
        amount: 1500.00,
        type: 'Project' as const,
        status: 'Paid' as const,
        payment_date: new Date('2026-05-15').toISOString().split('T')[0],
        month: '2026-05',
        notes: 'Initial website setup client',
        created_at: new Date().toISOString()
      }
    ] as Revenue[] : [] as Revenue[],
    expenses: isDemo ? [
      {
        id: 'exp-seed-1',
        title: 'Gemini API Credits',
        amount: 35.00,
        category: 'Software' as const,
        date: new Date('2026-05-20').toISOString().split('T')[0],
        notes: 'AI Agent inference calls',
        created_at: new Date().toISOString()
      }
    ] as Expense[] : [] as Expense[],
    memories: isDemo ? [...seed.defaultMemories] : [] as Memory[],
    agentLogs: [] as AgentLog[],
    toolLogs: [] as ToolLog[],
    dailyReports: isDemo ? [...seed.defaultDailyReports] : [] as DailyReport[],
    contentIdeas: isDemo ? [...seed.defaultContentIdeas] : [] as ContentIdea[],
    chatMessages: [
      {
        id: 'msg-start-1',
        sender: 'ai' as const,
        agentName: 'CEO Agent',
        message: 'VELTRIX COMMAND OS Initialized. I am your AI Chief of Staff. What is our focus today?',
        created_at: new Date().toISOString()
      }
    ] as ChatMessage[]
  };
}

const getMockDb = () => {
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('veltrix_cmd_db');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        // Fall back to server mock data
      }
    }
  }
  return globalMockStorage.__mockDb;
};

const saveMockDb = (db: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('veltrix_cmd_db', JSON.stringify(db));
  } else {
    globalMockStorage.__mockDb = db;
  }
};

// --- DATA ACCESS LAYER MAPPING ---

export const db = {
  // 1. Business Profile
  async getBusinessProfile(): Promise<BusinessProfile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('business_profile').select('*').limit(1).maybeSingle();
      if (!error && data) {
        // Calculate dynamic current monthly revenue from Paid revenues
        const { data: revData } = await supabase.from('revenue').select('amount').eq('status', 'Paid');
        const closed = revData ? revData.reduce((acc: number, r: any) => acc + Number(r.amount), 0) : 0;
        data.current_monthly_revenue = closed;
        return data;
      } else if (!error && !data) {
        // Seed default profile
        const defaultProfile = { ...seed.defaultBusinessProfile };
        defaultProfile.current_monthly_revenue = 0.00;
        const { data: insertedData, error: insertError } = await supabase
          .from('business_profile')
          .insert(defaultProfile)
          .select()
          .single();
        if (!insertError && insertedData) {
          return insertedData;
        }
      }
    }
    const mock = getMockDb();
    // For local fallback: calculate dynamically from revenue list
    const closed = mock.revenue
      .filter((r: any) => r.status === 'Paid')
      .reduce((acc: number, r: any) => acc + Number(r.amount), 0);
    mock.businessProfile.current_monthly_revenue = closed;
    return mock.businessProfile;
  },

  async updateBusinessProfile(updates: Partial<BusinessProfile>): Promise<BusinessProfile> {
    if (isSupabaseConfigured && supabase) {
      const current = await this.getBusinessProfile();
      const { data, error } = await supabase
        .from('business_profile')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', current.id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.businessProfile = { ...mock.businessProfile, ...updates, updated_at: new Date().toISOString() };
    saveMockDb(mock);
    return mock.businessProfile;
  },

  // 2. Goals
  async getGoals(): Promise<Goal[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getMockDb().goals;
  },

  async addGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    const newGoal: Goal = {
      ...goal,
      id: 'g-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('goals').insert(newGoal).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.goals.unshift(newGoal);
    saveMockDb(mock);
    return newGoal;
  },

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('goals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    const idx = mock.goals.findIndex((g: Goal) => g.id === id);
    if (idx !== -1) {
      mock.goals[idx] = { ...mock.goals[idx], ...updates, updated_at: new Date().toISOString() };
      saveMockDb(mock);
      return mock.goals[idx];
    }
    throw new Error('Goal not found');
  },

  // 3. Offers
  async getOffers(): Promise<Offer[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('offers').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) return data;
      if (!error && data && data.length === 0) {
        // Seed default offers
        const { data: seeded } = await supabase.from('offers').insert(seed.defaultOffers).select();
        if (seeded) return seeded;
      }
    }
    return getMockDb().offers;
  },

  async addOffer(offer: Omit<Offer, 'id' | 'created_at' | 'updated_at'>): Promise<Offer> {
    const newOffer: Offer = {
      ...offer,
      id: 'o-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('offers').insert(newOffer).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.offers.push(newOffer);
    saveMockDb(mock);
    return newOffer;
  },

  // 4. Leads
  async getLeads(): Promise<Lead[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('leads').select('*').order('lead_score', { ascending: false });
      if (!error && data) return data;
    }
    return getMockDb().leads;
  },

  async addLead(lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<Lead> {
    const newLead: Lead = {
      ...lead,
      id: 'lead-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('leads').insert(newLead).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.leads.unshift(newLead);
    saveMockDb(mock);
    return newLead;
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('leads')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    const idx = mock.leads.findIndex((l: Lead) => l.id === id);
    if (idx !== -1) {
      mock.leads[idx] = { ...mock.leads[idx], ...updates, updated_at: new Date().toISOString() };
      saveMockDb(mock);
      return mock.leads[idx];
    }
    throw new Error('Lead not found');
  },

  async deleteLead(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (!error) return true;
    }
    const mock = getMockDb();
    const lenBefore = mock.leads.length;
    mock.leads = mock.leads.filter((l: Lead) => l.id !== id);
    saveMockDb(mock);
    return mock.leads.length < lenBefore;
  },

  // 5. Lead Scores
  async getLeadScores(leadId?: string): Promise<LeadScore[]> {
    if (isSupabaseConfigured && supabase) {
      const q = supabase.from('lead_scores').select('*');
      if (leadId) q.eq('lead_id', leadId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    const mock = getMockDb();
    return leadId
      ? mock.leadScores.filter((s: LeadScore) => s.lead_id === leadId)
      : mock.leadScores;
  },

  async addLeadScore(score: Omit<LeadScore, 'id' | 'created_at'>): Promise<LeadScore> {
    const newScore: LeadScore = {
      ...score,
      id: 'score-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('lead_scores').insert(newScore).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.leadScores.unshift(newScore);
    // Sync total score directly in lead record
    const leadIdx = mock.leads.findIndex((l: Lead) => l.id === score.lead_id);
    if (leadIdx !== -1) {
      mock.leads[leadIdx].lead_score = score.total_score;
      mock.leads[leadIdx].status = 'Researched';
    }
    saveMockDb(mock);
    return newScore;
  },

  // 6. Outreach Messages
  async getOutreachMessages(leadId?: string): Promise<OutreachMessage[]> {
    if (isSupabaseConfigured && supabase) {
      const q = supabase.from('outreach_messages').select('*');
      if (leadId) q.eq('lead_id', leadId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    const mock = getMockDb();
    return leadId
      ? mock.outreachMessages.filter((m: OutreachMessage) => m.lead_id === leadId)
      : mock.outreachMessages;
  },

  async addOutreachMessage(msg: Omit<OutreachMessage, 'id' | 'created_at'>): Promise<OutreachMessage> {
    const newMsg: OutreachMessage = {
      ...msg,
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('outreach_messages').insert(newMsg).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.outreachMessages.unshift(newMsg);
    saveMockDb(mock);
    return newMsg;
  },

  async updateOutreachMessage(id: string, updates: Partial<OutreachMessage>): Promise<OutreachMessage> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('outreach_messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    const idx = mock.outreachMessages.findIndex((m: OutreachMessage) => m.id === id);
    if (idx !== -1) {
      mock.outreachMessages[idx] = { ...mock.outreachMessages[idx], ...updates };
      // If marked as sent, sync lead status
      if (updates.status === 'Sent') {
        const leadIdx = mock.leads.findIndex((l: Lead) => l.id === mock.outreachMessages[idx].lead_id);
        if (leadIdx !== -1) {
          mock.leads[leadIdx].status = 'Contacted';
        }
      }
      saveMockDb(mock);
      return mock.outreachMessages[idx];
    }
    throw new Error('Outreach message not found');
  },

  // 7. Follow-ups
  async getFollowups(leadId?: string): Promise<Followup[]> {
    if (isSupabaseConfigured && supabase) {
      const q = supabase.from('followups').select('*');
      if (leadId) q.eq('lead_id', leadId);
      const { data, error } = await q.order('followup_date', { ascending: true });
      if (!error && data) return data;
    }
    const mock = getMockDb();
    return leadId
      ? mock.followups.filter((f: Followup) => f.lead_id === leadId)
      : mock.followups;
  },

  async addFollowup(fup: Omit<Followup, 'id' | 'created_at' | 'updated_at'>): Promise<Followup> {
    const newFup: Followup = {
      ...fup,
      id: 'fup-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('followups').insert(newFup).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.followups.push(newFup);
    saveMockDb(mock);
    return newFup;
  },

  async updateFollowup(id: string, updates: Partial<Followup>): Promise<Followup> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('followups')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    const idx = mock.followups.findIndex((f: Followup) => f.id === id);
    if (idx !== -1) {
      mock.followups[idx] = { ...mock.followups[idx], ...updates, updated_at: new Date().toISOString() };
      saveMockDb(mock);
      return mock.followups[idx];
    }
    throw new Error('Followup not found');
  },

  // 8. Calls
  async getCalls(): Promise<Call[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('calls').select('*').order('scheduled_date', { ascending: true });
      if (!error && data) return data;
    }
    return getMockDb().calls;
  },

  async addCall(call: Omit<Call, 'id' | 'created_at' | 'updated_at'>): Promise<Call> {
    const newCall: Call = {
      ...call,
      id: 'call-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('calls').insert(newCall).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.calls.push(newCall);
    // Sync lead status
    const leadIdx = mock.leads.findIndex((l: Lead) => l.id === call.lead_id);
    if (leadIdx !== -1) {
      mock.leads[leadIdx].status = 'Call Booked';
    }
    saveMockDb(mock);
    return newCall;
  },

  async updateCall(id: string, updates: Partial<Call>): Promise<Call> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('calls')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    const idx = mock.calls.findIndex((c: Call) => c.id === id);
    if (idx !== -1) {
      mock.calls[idx] = { ...mock.calls[idx], ...updates, updated_at: new Date().toISOString() };
      saveMockDb(mock);
      return mock.calls[idx];
    }
    throw new Error('Call not found');
  },

  // 9. Proposals
  async getProposals(): Promise<Proposal[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('proposals').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getMockDb().proposals;
  },

  async addProposal(prop: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>): Promise<Proposal> {
    const newProp: Proposal = {
      ...prop,
      id: 'prop-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('proposals').insert(newProp).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.proposals.unshift(newProp);
    if (prop.lead_id) {
      const leadIdx = mock.leads.findIndex((l: Lead) => l.id === prop.lead_id);
      if (leadIdx !== -1) {
        mock.leads[leadIdx].status = 'Proposal Sent';
      }
    }
    saveMockDb(mock);
    return newProp;
  },

  async updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('proposals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    const idx = mock.proposals.findIndex((p: Proposal) => p.id === id);
    if (idx !== -1) {
      mock.proposals[idx] = { ...mock.proposals[idx], ...updates, updated_at: new Date().toISOString() };
      // Handlers if proposal is accepted (Convert to active Client)
      if (updates.status === 'Accepted' && mock.proposals[idx].lead_id) {
        const lead = mock.leads.find((l: Lead) => l.id === mock.proposals[idx].lead_id);
        if (lead) {
          // Update Lead status
          lead.status = 'Won';
          // Create Client
          const newClient: Client = {
            id: 'client-' + Math.random().toString(36).substring(2, 9),
            business_name: lead.business_name,
            contact_name: lead.business_name.split(' ')[0] + ' Manager',
            email: lead.email || '',
            phone: lead.phone || '',
            website: lead.website || '',
            service_purchased: mock.proposals[idx].title,
            total_value: mock.proposals[idx].price,
            monthly_retainer: mock.proposals[idx].title.toLowerCase().includes('receptionist') ? 250 : 0, // default retainer estimate
            status: 'Active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          mock.clients.unshift(newClient);
          mock.proposals[idx].client_id = newClient.id;

          // Add to revenue
          const newRev: Revenue = {
            id: 'rev-' + Math.random().toString(36).substring(2, 9),
            client_id: newClient.id,
            proposal_id: mock.proposals[idx].id,
            amount: newClient.total_value,
            type: 'Setup Fee',
            status: 'Paid',
            payment_date: new Date().toISOString().split('T')[0],
            month: new Date().toISOString().substring(0, 7),
            notes: `Onboarding setup for ${newClient.business_name}`,
            created_at: new Date().toISOString()
          };
          mock.revenue.unshift(newRev);

          // Update Business Profile current revenue
          mock.businessProfile.current_monthly_revenue =
            Number(mock.businessProfile.current_monthly_revenue) + Number(newClient.total_value);

          // Create standard Project delivery card
          const isChatbot = mock.proposals[idx].title.toLowerCase().includes('receptionist');
          const isBranding = mock.proposals[idx].title.toLowerCase().includes('brand');
          const checklist = isChatbot
            ? ['Collect business FAQs', 'Define lead qualification questions', 'Define booking process', 'Build chatbot/receptionist flow', 'Connect CRM/Google Sheet', 'Test responses', 'Test appointment booking', 'Client review', 'Launch', 'Monthly optimization plan']
            : isBranding
            ? ['Brand discovery', 'Competitor review', 'Moodboard', 'Logo concepts', 'Color palette', 'Typography', 'Brand guidelines', 'Social media assets', 'Final files', 'Testimonial request']
            : ['Collect requirements', 'Collect brand assets', 'Create sitemap', 'Write website copy', 'Create design direction', 'Build homepage', 'Build inner pages', 'Add contact/booking form', 'Mobile optimization', 'Basic SEO', 'Client review', 'Revisions', 'Final delivery', 'Testimonial request', 'Retainer upsell'];

          const newProj: Project = {
            id: 'proj-' + Math.random().toString(36).substring(2, 9),
            client_id: newClient.id,
            project_name: mock.proposals[idx].title,
            service_type: isChatbot ? 'AI Receptionist' : isBranding ? 'Branding' : 'Website Development',
            status: 'Discovery',
            deadline: new Date(Date.now() + 86400000 * 21).toISOString().split('T')[0], // 3 weeks out
            requirements: lead.pain_point || '',
            deliverables: checklist,
            revision_count: 0,
            notes: 'Initialized automatically upon proposal acceptance.',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          mock.projects.unshift(newProj);
        }
      }
      saveMockDb(mock);
      return mock.proposals[idx];
    }
    throw new Error('Proposal not found');
  },

  // 10. Clients
  async getClients(): Promise<Client[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getMockDb().clients;
  },

  async addClient(client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client> {
    const newClient: Client = {
      ...client,
      id: 'client-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clients').insert(newClient).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.clients.unshift(newClient);
    saveMockDb(mock);
    return newClient;
  },

  // 11. Projects
  async getProjects(): Promise<Project[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('projects').select('*').order('deadline', { ascending: true });
      if (!error && data) return data;
    }
    return getMockDb().projects;
  },

  async addProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    const newProj: Project = {
      ...project,
      id: 'proj-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('projects').insert(newProj).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.projects.unshift(newProj);
    saveMockDb(mock);
    return newProj;
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    const idx = mock.projects.findIndex((p: Project) => p.id === id);
    if (idx !== -1) {
      mock.projects[idx] = { ...mock.projects[idx], ...updates, updated_at: new Date().toISOString() };
      saveMockDb(mock);
      return mock.projects[idx];
    }
    throw new Error('Project not found');
  },

  // 12. Tasks
  async getTasks(): Promise<Task[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('tasks').select('*').order('due_date', { ascending: true });
      if (!error && data) return data;
    }
    return getMockDb().tasks;
  },

  async addTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: 't-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.tasks.unshift(newTask);
    saveMockDb(mock);
    return newTask;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    const idx = mock.tasks.findIndex((t: Task) => t.id === id);
    if (idx !== -1) {
      mock.tasks[idx] = { ...mock.tasks[idx], ...updates, updated_at: new Date().toISOString() };
      saveMockDb(mock);
      return mock.tasks[idx];
    }
    throw new Error('Task not found');
  },

  async deleteTask(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (!error) return true;
    }
    const mock = getMockDb();
    const lenBefore = mock.tasks.length;
    mock.tasks = mock.tasks.filter((t: Task) => t.id !== id);
    saveMockDb(mock);
    return mock.tasks.length < lenBefore;
  },

  // 13. Revenue
  async getRevenue(): Promise<Revenue[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('revenue').select('*').order('payment_date', { ascending: false });
      if (!error && data) return data;
    }
    return getMockDb().revenue;
  },

  async addRevenue(rev: Omit<Revenue, 'id' | 'created_at'>): Promise<Revenue> {
    const newRev: Revenue = {
      ...rev,
      id: 'rev-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('revenue').insert(newRev).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.revenue.unshift(newRev);
    if (rev.status === 'Paid') {
      mock.businessProfile.current_monthly_revenue =
        Number(mock.businessProfile.current_monthly_revenue) + Number(rev.amount);
    }
    saveMockDb(mock);
    return newRev;
  },

  // 14. Expenses
  async getExpenses(): Promise<Expense[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
      if (!error && data) return data;
    }
    return getMockDb().expenses;
  },

  async addExpense(exp: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
    const newExp: Expense = {
      ...exp,
      id: 'exp-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('expenses').insert(newExp).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.expenses.unshift(newExp);
    saveMockDb(mock);
    return newExp;
  },

  // 15. Memories
  async getMemories(): Promise<Memory[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('memories').select('*').order('importance', { ascending: false });
      if (!error && data) return data;
    }
    return getMockDb().memories;
  },

  async addMemory(mem: Omit<Memory, 'id' | 'created_at' | 'updated_at'>): Promise<Memory> {
    const newMem: Memory = {
      ...mem,
      id: 'mem-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('memories').insert(newMem).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.memories.unshift(newMem);
    saveMockDb(mock);
    return newMem;
  },

  async searchMemories(query: string, limit: number = 5): Promise<Memory[]> {
    // If pgvector is enabled, do actual similarity search
    // For mock/fallback, we do a basic keyword regex search
    if (isSupabaseConfigured && supabase) {
      // In production, we'd trigger a RPC matching cosine similarity:
      // const { data, error } = await supabase.rpc('match_memories', { query_embedding: embedding, match_threshold: 0.7, match_count: limit })
      // For fallback we'll do standard text search:
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .textSearch('content', query)
        .limit(limit);
      if (!error && data) return data;
    }

    const mock = getMockDb();
    const keywords = query.toLowerCase().split(/\s+/);
    return mock.memories
      .filter((mem: Memory) => {
        const text = (mem.content + ' ' + mem.tags.join(' ')).toLowerCase();
        return keywords.some(kw => text.includes(kw));
      })
      .slice(0, limit);
  },

  // 16. Agent Logs
  async getAgentLogs(): Promise<AgentLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('agent_logs').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getMockDb().agentLogs;
  },

  async logAgentAction(
    agentName: string,
    action: string,
    input?: string,
    output?: string,
    status: 'Success' | 'Failure' | 'Pending Approval' = 'Success'
  ): Promise<AgentLog> {
    const newLog: AgentLog = {
      id: 'alog-' + Math.random().toString(36).substring(2, 9),
      agent_name: agentName,
      action,
      input,
      output,
      status,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('agent_logs').insert(newLog).select().single();
      if (data) return data;
    }
    const mock = getMockDb();
    mock.agentLogs.unshift(newLog);
    saveMockDb(mock);
    return newLog;
  },

  // 17. Tool Logs
  async getToolLogs(): Promise<ToolLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('tool_logs').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getMockDb().toolLogs;
  },

  async logToolAction(
    toolName: string,
    action: string,
    input?: string,
    output?: string,
    status: 'Success' | 'Failure' = 'Success',
    error?: string
  ): Promise<ToolLog> {
    const newLog: ToolLog = {
      id: 'tlog-' + Math.random().toString(36).substring(2, 9),
      tool_name: toolName,
      action,
      input,
      output,
      status,
      error,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('tool_logs').insert(newLog).select().single();
      if (data) return data;
    }
    const mock = getMockDb();
    mock.toolLogs.unshift(newLog);
    saveMockDb(mock);
    return newLog;
  },

  // 18. Daily Reports
  async getDailyReports(): Promise<DailyReport[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('daily_reports').select('*').order('report_date', { ascending: false });
      if (!error && data) return data;
    }
    return getMockDb().dailyReports;
  },

  async addDailyReport(report: Omit<DailyReport, 'id' | 'created_at'>): Promise<DailyReport> {
    const newReport: DailyReport = {
      ...report,
      id: 'rep-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('daily_reports').insert(newReport).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.dailyReports.unshift(newReport);
    saveMockDb(mock);
    return newReport;
  },

  // 19. Content Ideas
  async getContentIdeas(): Promise<ContentIdea[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('content_ideas').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return getMockDb().contentIdeas;
  },

  async addContentIdea(idea: Omit<ContentIdea, 'id' | 'created_at' | 'updated_at'>): Promise<ContentIdea> {
    const newIdea: ContentIdea = {
      ...idea,
      id: 'ci-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('content_ideas').insert(newIdea).select().single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    mock.contentIdeas.unshift(newIdea);
    saveMockDb(mock);
    return newIdea;
  },

  async updateContentIdea(id: string, updates: Partial<ContentIdea>): Promise<ContentIdea> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('content_ideas')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (!error && data) return data;
    }
    const mock = getMockDb();
    const idx = mock.contentIdeas.findIndex((c: ContentIdea) => c.id === id);
    if (idx !== -1) {
      mock.contentIdeas[idx] = { ...mock.contentIdeas[idx], ...updates, updated_at: new Date().toISOString() };
      saveMockDb(mock);
      return mock.contentIdeas[idx];
    }
    throw new Error('Content idea not found');
  },

  // 20. Chat Messages
  async getChatMessages(): Promise<ChatMessage[]> {
    const mock = getMockDb();
    return mock.chatMessages;
  },

  async addChatMessage(msg: Omit<ChatMessage, 'id' | 'created_at'>): Promise<ChatMessage> {
    const mock = getMockDb();
    const newMsg: ChatMessage = {
      ...msg,
      id: 'msg-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString()
    };
    mock.chatMessages.push(newMsg);
    saveMockDb(mock);
    return newMsg;
  },

  async clearChatMessages(): Promise<void> {
    const mock = getMockDb();
    mock.chatMessages = [
      {
        id: 'msg-start-1',
        sender: 'ai' as const,
        agentName: 'CEO Agent',
        message: 'Chat history cleared. I am ready to review our next high-value actions.',
        created_at: new Date().toISOString()
      }
    ];
    saveMockDb(mock);
  },

  async resetDatabase(mode: 'clean' | 'demo'): Promise<void> {
    const isDemo = mode === 'demo';
    const businessProfile = { ...seed.defaultBusinessProfile };
    if (!isDemo) {
      businessProfile.current_monthly_revenue = 0.00;
    }

    const newDb = {
      businessProfile: businessProfile,
      goals: isDemo ? [...seed.defaultGoals] : [] as Goal[],
      offers: [...seed.defaultOffers],
      leads: isDemo ? [...seed.defaultLeads] : [] as Lead[],
      leadScores: [] as LeadScore[],
      outreachMessages: [] as OutreachMessage[],
      followups: [] as Followup[],
      calls: [] as Call[],
      proposals: [] as Proposal[],
      clients: [] as Client[],
      projects: [] as Project[],
      tasks: isDemo ? [...seed.defaultTasks] : [] as Task[],
      revenue: isDemo ? [
        {
          id: 'rev-seed-1',
          client_id: 'c-seed-1',
          amount: 1500.00,
          type: 'Project' as const,
          status: 'Paid' as const,
          payment_date: new Date('2026-05-15').toISOString().split('T')[0],
          month: '2026-05',
          notes: 'Initial website setup client',
          created_at: new Date().toISOString()
        }
      ] as Revenue[] : [] as Revenue[],
      expenses: isDemo ? [
        {
          id: 'exp-seed-1',
          title: 'Gemini API Credits',
          amount: 35.00,
          category: 'Software' as const,
          date: new Date('2026-05-20').toISOString().split('T')[0],
          notes: 'AI Agent inference calls',
          created_at: new Date().toISOString()
        }
      ] as Expense[] : [] as Expense[],
      memories: isDemo ? [...seed.defaultMemories] : [] as Memory[],
      agentLogs: [] as AgentLog[],
      toolLogs: [] as ToolLog[],
      dailyReports: isDemo ? [...seed.defaultDailyReports] : [] as DailyReport[],
      contentIdeas: isDemo ? [...seed.defaultContentIdeas] : [] as ContentIdea[],
      chatMessages: [
        {
          id: 'msg-start-1',
          sender: 'ai' as const,
          agentName: 'CEO Agent',
          message: isDemo 
            ? 'Demo mode initialized. VELTRIX COMMAND OS is loaded with sample leads, transaction histories, and tasks.' 
            : 'Workspace reset complete. Database initialized to a clean state. Ready for deployment.',
          created_at: new Date().toISOString()
        }
      ] as ChatMessage[]
    };

    saveMockDb(newDb);
  }
};
