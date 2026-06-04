import { db } from '../db';
import { BusinessProfile, Goal, Offer, Lead, Task, Revenue, Followup, Memory, Client, Proposal, Project } from '../types';

export interface BusinessContext {
  profile: BusinessProfile;
  goals: Goal[];
  offers: Offer[];
  leads: Lead[];
  tasks: Task[];
  revenues: Revenue[];
  followups: Followup[];
  memories: Memory[];
  clients: Client[];
  proposals: Proposal[];
  projects: Project[];
  metrics: {
    targetRevenue: number;
    closedRevenue: number;
    pipelineValue: number;
    revenueGap: number;
    activeClientsCount: number;
    activeProposalsCount: number;
    qualifiedLeadsCount: number;
  };
  contextString: string;
}

export async function buildBusinessContext(): Promise<BusinessContext> {
  const [
    profile,
    goals,
    offers,
    leads,
    tasks,
    revenues,
    followups,
    memories,
    clients,
    proposals,
    projects,
  ] = await Promise.all([
    db.getBusinessProfile(),
    db.getGoals(),
    db.getOffers(),
    db.getLeads(),
    db.getTasks(),
    db.getRevenue(),
    db.getFollowups(),
    db.getMemories(),
    db.getClients(),
    db.getProposals(),
    db.getProjects(),
  ]);

  // Closed revenue calculation
  const closedRevenue = revenues
    .filter(r => r.status === 'Paid')
    .reduce((acc, r) => acc + Number(r.amount), 0);

  // Expected/Pipeline revenue calculation from active proposals
  const pipelineValue = proposals
    .filter(p => ['Draft', 'Sent', 'Accepted'].includes(p.status))
    .reduce((acc, p) => acc + Number(p.price), 0);

  const targetRevenue = profile.target_monthly_revenue || 6000;
  const revenueGap = Math.max(0, targetRevenue - closedRevenue);

  const activeClientsCount = clients.filter(c => c.status === 'Active').length;
  const activeProposalsCount = proposals.filter(p => ['Draft', 'Sent'].includes(p.status)).length;
  const qualifiedLeadsCount = leads.filter(l => ['New', 'Researched', 'Qualified', 'Contacted', 'Replied'].includes(l.status)).length;

  const contextString = `
=== BUSINESS PROFILE ===
Company Name: ${profile.business_name}
Description: ${profile.description || 'N/A'}
Services Offered: ${(profile.services || []).join(', ') || 'N/A'}
Primary Offer: ${profile.primary_offer || 'N/A'}
Secondary Offer: ${profile.secondary_offer || 'N/A'}
Target Markets: ${(profile.target_markets || []).join(', ') || 'N/A'}

=== REVENUE METRICS ===
Target Monthly Revenue: $${targetRevenue}
Current Month Closed Revenue: $${closedRevenue}
Revenue Gap to Target: $${revenueGap}
Est. Pipeline Value: $${pipelineValue}

=== ACTIVE RECURRING CLIENTS ===
${clients.length === 0 ? 'No active clients yet.' : clients.map(c => `- ID: ${c.id} | ${c.business_name} (Retainer: $${c.monthly_retainer}/mo, Service: ${c.service_purchased || 'N/A'}, Status: ${c.status})`).join('\n')}

=== ACTIVE OFFERS PRICING AND DELIVERABLES ===
${offers.length === 0 ? 'No offers defined.' : offers.map(o => `- ${o.name}: Price Range $${o.price_min}-$${o.price_max}, Retainer $${o.monthly_retainer_min}-$${o.monthly_retainer_max}/mo. Deliverables: ${(o.deliverables || []).join(', ')}`).join('\n')}

=== CRM LEADS PIPELINE ===
${leads.length === 0 ? 'No leads in CRM.' : leads.map(l => `- ID: ${l.id} | ${l.business_name} (${l.industry || 'Unknown'}, Web: ${l.website || 'None'}, Score: ${l.lead_score || 'Not Scored'}, Status: ${l.status}, Pain Points: ${l.pain_point || 'None'})`).join('\n')}

=== CHECKLIST TO-DOS ===
${tasks.length === 0 ? 'No checklist tasks pending.' : tasks.map(t => `- [${t.status === 'Completed' ? 'X' : ' '}] ID: ${t.id} | ${t.title} (Agent: ${t.agent_name}, Due: ${t.due_date || 'N/A'}, Priority: ${t.priority}, Status: ${t.status})`).join('\n')}

=== BUSINESS MEMORIES & NOTES ===
${memories.length === 0 ? 'No memories saved.' : memories.map(m => `- [${m.type}] ${m.content} (Importance: ${m.importance}/10, Tags: ${(m.tags || []).join(', ')})`).join('\n')}

=== ACTIVE CLIENT PROJECTS ===
${projects.length === 0 ? 'No active delivery projects.' : projects.map(p => `- ID: ${p.id} | ${p.project_name} (Status: ${p.status}, Deadline: ${p.deadline || 'N/A'}, Deliverables: ${(p.deliverables || []).slice(0, 3).join(', ')}...)`).join('\n')}

=== UPCOMING FOLLOW-UPS ===
${followups.length === 0 ? 'No followups scheduled.' : followups.map(f => `- ID: ${f.id} | Lead ID: ${f.lead_id} (Date: ${f.followup_date}, Type: ${f.followup_type}, Status: ${f.status})`).join('\n')}
`.trim();

  return {
    profile,
    goals,
    offers,
    leads,
    tasks,
    revenues,
    followups,
    memories,
    clients,
    proposals,
    projects,
    metrics: {
      targetRevenue,
      closedRevenue,
      pipelineValue,
      revenueGap,
      activeClientsCount,
      activeProposalsCount,
      qualifiedLeadsCount,
    },
    contextString,
  };
}
