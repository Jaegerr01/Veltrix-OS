import type { Proposal } from '../types';
import { supabase, getUserId, safeRead, safeWrite } from './_core';
import { updateLead } from './leads';
import { addClient } from './clients';
import { addRevenue } from './revenue';
import { addProject } from './projects';
import { addTask } from './tasks';
import { addMemory } from './memory';

export async function getProposals(): Promise<Proposal[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [], 'getProposals');
}

export async function addProposal(prop: Omit<Proposal, 'id' | 'created_at' | 'updated_at'>): Promise<Proposal> {
  const fallbackProposal: Proposal = {
    id: 'mock-prop-' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'demo-user',
    ...prop
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('proposals')
      .insert({ ...prop, user_id: userId })
      .select()
      .single();
    if (error) throw error;

    if (prop.lead_id) {
      try {
        await supabase
          .from('leads')
          .update({ status: 'Proposal Sent' })
          .eq('id', prop.lead_id)
          .eq('user_id', userId);
      } catch (err) {
        console.warn('Failed to update lead status during proposal creation:', err);
      }
    }
    return data;
  }, fallbackProposal, 'addProposal');
}

export async function updateProposal(id: string, updates: Partial<Proposal>): Promise<Proposal> {
  const fallbackProposal: Proposal = {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    title: updates.title || '',
    price: updates.price || 0,
    status: updates.status || 'Draft',
    deliverables: updates.deliverables || [],
    user_id: 'demo-user',
    ...updates
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data: proposal, error } = await supabase
      .from('proposals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    if (!proposal) throw new Error('Proposal not found');

    // Handlers if proposal is accepted (Convert to active Client & Project)
    if (updates.status === 'Accepted' && proposal.lead_id) {
      try {
        const { data: lead } = await supabase
          .from('leads')
          .select('*')
          .eq('id', proposal.lead_id)
          .eq('user_id', userId)
          .single();

        if (lead) {
          // 1. Update Lead status to 'Won'
          await updateLead(lead.id, { status: 'Won' });

          // 2. Create Client
          const newClient = await addClient({
            business_name: lead.business_name,
            contact_name: lead.contact_name || lead.business_name.split(' ')[0] + ' Manager',
            email: lead.email || '',
            phone: lead.phone || '',
            website: lead.website || '',
            service_purchased: proposal.title,
            total_value: proposal.price,
            monthly_retainer: proposal.title.toLowerCase().includes('receptionist') ? 250 : 0,
            status: 'Active'
          });

          // 3. Update Proposal client_id link
          await supabase
            .from('proposals')
            .update({ client_id: newClient.id })
            .eq('id', proposal.id)
            .eq('user_id', userId);

          // 4. Add setup fee to revenue
          await addRevenue({
            client_id: newClient.id,
            proposal_id: proposal.id,
            amount: newClient.total_value,
            type: 'Setup Fee',
            status: 'Paid',
            payment_date: new Date().toISOString().split('T')[0],
            month: new Date().toISOString().substring(0, 7),
            notes: `Onboarding setup for ${newClient.business_name}`
          });

          // 5. Generate Dynamic Checklist via Gemini
          let checklist = ['Onboarding kick-off call', 'Collect brand assets', 'Deploy system', 'Client testing', 'Launch checklist'];
          try {
            const prompt = `
Generate a detailed 6-8 item project delivery roadmap checklist (array of short strings) for the project:
Project Name: ${proposal.title}
Deliverables list from proposal: ${proposal.deliverables ? proposal.deliverables.join(', ') : 'N/A'}
Problem: ${proposal.problem || 'N/A'}
Solution Scope: ${proposal.solution || 'N/A'}

Output ONLY a raw JSON array of strings, e.g. ["task 1", "task 2", ...], with no markup or explanation.
`;
            const { gemini } = await import('../ai/gemini');
            const responseText = await gemini.callRawLLM(prompt, "You are Delivery Agent Mia. Output ONLY a raw JSON array of strings.");
            const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            if (Array.isArray(parsed) && parsed.length > 0) {
              checklist = parsed;
            }
          } catch (err) {
            const isChatbot = proposal.title.toLowerCase().includes('receptionist');
            const isBranding = proposal.title.toLowerCase().includes('brand');
            checklist = isChatbot
              ? ['Collect business FAQs', 'Define lead qualification questions', 'Build chatbot/receptionist flow', 'Connect CRM/Google Sheet', 'Test booking capability', 'Client review and launch']
              : isBranding
              ? ['Brand discovery call', 'Moodboard creation', 'Logo design draft', 'Color palette selection', 'Typography guidelines', 'Final files handover']
              : ['Collect brand assets', 'Write page copywriting drafts', 'Build responsive landing page', 'Integrate booking form', 'Mobile responsiveness audit', 'Launch'];
          }

          // 6. Create Project
          const newProj = await addProject({
            client_id: newClient.id,
            project_name: proposal.title,
            service_type: proposal.title.toLowerCase().includes('receptionist') ? 'AI Receptionist' : proposal.title.toLowerCase().includes('brand') ? 'Branding' : 'Website Development',
            status: 'Discovery',
            deadline: new Date(Date.now() + 86400000 * 21).toISOString().split('T')[0],
            requirements: lead.pain_point || '',
            deliverables: checklist,
            revision_count: 0,
            notes: 'Initialized automatically upon proposal acceptance with custom checklists.'
          });

          // 7. Write tasks to checklist
          for (const item of checklist) {
            await addTask({
              agent_name: 'Delivery Manager Agent',
              title: `[${newProj.project_name}] ${item}`,
              description: `Project milestone checklist task for ${newClient.business_name}.`,
              priority: 'Medium',
              status: 'Pending',
              due_date: newProj.deadline,
              related_client_id: newClient.id
            });
          }

          // 8. Add memory/note
          await addMemory({
            type: 'Decision',
            content: `Autopilot: Proposal accepted for ${newClient.business_name}. Created project roadmap with ${checklist.length} custom delivery steps.`,
            tags: ['autopilot', 'proposal-accepted', newClient.business_name.toLowerCase().replace(/\s+/g, '-')],
            importance: 8,
            source: 'Delivery Manager Agent'
          });
        }
      } catch (err) {
        console.warn('Failed to completely convert accepted proposal to client/project:', err);
      }
    }

    return proposal;
  }, fallbackProposal, 'updateProposal');
}
