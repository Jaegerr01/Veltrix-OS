import type { BusinessProfile, Goal, Offer } from '../types';
import * as seedData from '../seedData';
import { supabase, getUserId, safeRead, safeWrite } from './_core';
import { addMemory } from './memory';

export async function getBusinessProfile(): Promise<BusinessProfile> {
  const userId = await getUserId().catch(() => 'demo-user');
  const fallbackProfile: BusinessProfile = {
    id: userId,
    business_name: 'VELTRIX Operator',
    description: 'A business powered by VELTRIX OS.',
    services: ['AI Website Development', 'AI Receptionist Chatbots'],
    target_monthly_revenue: 6000,
    current_monthly_revenue: 0,
    primary_offer: 'AI Website System',
    secondary_offer: 'AI Receptionist Voice/Chatbot',
    target_markets: ['Local Medical Clinics', 'Chiropractors', 'Dentists'],
    autopilot: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  return safeRead(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    let profileData = data;
    if (!profileData) {
      const defaultProfile = {
        id: userId,
        business_name: 'VELTRIX Operator',
        description: 'A business powered by VELTRIX OS.',
        services: ['AI Website Development', 'AI Receptionist Chatbots'],
        target_monthly_revenue: 6000,
        current_monthly_revenue: 0,
        primary_offer: 'AI Website System',
        secondary_offer: 'AI Receptionist Voice/Chatbot',
        target_markets: ['Local Medical Clinics', 'Chiropractors', 'Dentists'],
        autopilot: false
      };
      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert(defaultProfile)
        .select()
        .single();
      if (insertError) throw insertError;
      try {
        await syncBusinessProfileToMemory(inserted);
      } catch (syncErr) {
        console.warn('Failed to sync business profile to memory:', syncErr);
      }
      profileData = inserted;
    }

    // Recalculate monthly revenue dynamically
    try {
      const { data: revData } = await supabase
        .from('revenue')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'Paid');
      const closed = revData ? revData.reduce((acc: number, r: any) => acc + Number(r.amount), 0) : 0;
      profileData.current_monthly_revenue = closed;
    } catch (revErr) {
      console.warn('Failed to calculate revenue dynamically:', revErr);
    }
    return profileData;
  }, fallbackProfile, 'getBusinessProfile');
}

export async function updateBusinessProfile(updates: Partial<BusinessProfile>): Promise<BusinessProfile> {
  const userId = await getUserId().catch(() => 'demo-user');
  const fallbackProfile: BusinessProfile = {
    id: userId,
    business_name: updates.business_name || 'VELTRIX Operator',
    description: updates.description || 'A business powered by VELTRIX OS.',
    services: updates.services || ['AI Website Development', 'AI Receptionist Chatbots'],
    target_monthly_revenue: updates.target_monthly_revenue || 6000,
    current_monthly_revenue: updates.current_monthly_revenue || 0,
    primary_offer: updates.primary_offer || 'AI Website System',
    secondary_offer: updates.secondary_offer || 'AI Receptionist Voice/Chatbot',
    target_markets: updates.target_markets || ['Local Medical Clinics', 'Chiropractors', 'Dentists'],
    autopilot: updates.autopilot !== undefined ? updates.autopilot : false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  return safeWrite(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    try {
      await syncBusinessProfileToMemory(data);
    } catch (syncErr) {
      console.warn('Failed to sync updated business profile to memory:', syncErr);
    }
    return data;
  }, fallbackProfile, 'updateBusinessProfile');
}

export async function getGoals(): Promise<Goal[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }, [], 'getGoals');
}

export async function addGoal(goal: Omit<Goal, 'id' | 'created_at' | 'updated_at'>): Promise<Goal> {
  const fallbackGoal: Goal = {
    id: 'mock-goal-' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    title: goal.title,
    description: goal.description || '',
    target_amount: goal.target_amount,
    status: goal.status,
    priority: goal.priority,
    deadline: goal.deadline || '',
    success_criteria: goal.success_criteria || '',
    user_id: 'demo-user'
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    try {
      await syncGoalToMemory(data);
    } catch (err) {
      console.warn('Failed to sync goal to memory:', err);
    }
    return data;
  }, fallbackGoal, 'addGoal');
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
  const fallbackGoal: Goal = {
    id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    title: updates.title || '',
    description: updates.description || '',
    target_amount: updates.target_amount || 0,
    status: updates.status || 'Pending',
    priority: updates.priority || 'Medium',
    deadline: updates.deadline || '',
    success_criteria: updates.success_criteria || '',
    user_id: 'demo-user',
    ...updates
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    try {
      await syncGoalToMemory(data);
    } catch (err) {
      console.warn('Failed to sync goal to memory:', err);
    }
    return data;
  }, fallbackGoal, 'updateGoal');
}

export async function getOffers(): Promise<Offer[]> {
  return safeRead(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;

    // Auto seed default offers if empty
    if (data && data.length === 0) {
      const defaultOffers = seedData.defaultOffers.map(o => ({
        name: o.name,
        description: o.description,
        target_customer: o.target_customer,
        price_min: o.price_min,
        price_max: o.price_max,
        monthly_retainer_min: o.monthly_retainer_min,
        monthly_retainer_max: o.monthly_retainer_max,
        deliverables: o.deliverables,
        status: o.status,
        user_id: userId
      }));
      const { data: seeded, error: seedError } = await supabase
        .from('offers')
        .insert(defaultOffers)
        .select();
      if (seedError) throw seedError;
      if (seeded) {
        for (const off of seeded) {
          try {
            await syncOfferToMemory(off);
          } catch (err) {
            console.warn('Failed to sync offer to memory:', err);
          }
        }
      }
      return seeded || [];
    }
    return data || [];
  }, [], 'getOffers');
}

export async function addOffer(offer: Omit<Offer, 'id' | 'created_at' | 'updated_at'>): Promise<Offer> {
  const fallbackOffer: Offer = {
    id: 'mock-offer-' + Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    name: offer.name,
    description: offer.description || '',
    target_customer: offer.target_customer || '',
    price_min: offer.price_min || 0,
    price_max: offer.price_max || 0,
    monthly_retainer_min: offer.monthly_retainer_min || 0,
    monthly_retainer_max: offer.monthly_retainer_max || 0,
    deliverables: offer.deliverables || [],
    status: offer.status,
    user_id: 'demo-user'
  };
  return safeWrite(async () => {
    const userId = await getUserId();
    const { data, error } = await supabase
      .from('offers')
      .insert({ ...offer, user_id: userId })
      .select()
      .single();
    if (error) throw error;
    try {
      await syncOfferToMemory(data);
    } catch (err) {
      console.warn('Failed to sync offer to memory:', err);
    }
    return data;
  }, fallbackOffer, 'addOffer');
}

export async function syncBusinessProfileToMemory(profile: BusinessProfile): Promise<void> {
  try {
    const servicesStr = (profile.services || []).join(', ');
    const content = `Business Profile: ${profile.business_name}. Description: ${profile.description || 'N/A'}. Services offered: ${servicesStr || 'N/A'}. Revenue Target: $${profile.target_monthly_revenue || 6000}. Primary Offer: ${profile.primary_offer || 'N/A'}. Secondary Offer: ${profile.secondary_offer || 'N/A'}. Target Markets: ${(profile.target_markets || []).join(', ') || 'N/A'}.`;

    const { data: existing } = await supabase
      .from('notes')
      .select('id')
      .eq('user_id', profile.id)
      .contains('tags', ['system-profile'])
      .maybeSingle();

    if (existing) {
      const { gemini } = await import('../ai/gemini');
      const embedding = await gemini.getEmbedding(content);
      await supabase
        .from('notes')
        .update({
          content,
          embedding,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await addMemory({
        type: 'Business',
        content,
        tags: ['system-profile', 'profile', 'revenue-target'],
        importance: 10,
        source: 'System Sync'
      });
    }
  } catch (err) {
    console.error('Failed to sync business profile to memory:', err);
  }
}

export async function syncGoalToMemory(goal: Goal): Promise<void> {
  try {
    const userId = await getUserId();
    const content = `Business Goal: ${goal.title}. Description: ${goal.description || 'N/A'}. Target Amount/Metric: ${goal.target_amount ? '$' + goal.target_amount : 'N/A'}. Status: ${goal.status}. Priority: ${goal.priority}. Deadline: ${goal.deadline || 'N/A'}. Success Criteria: ${goal.success_criteria || 'N/A'}.`;

    const { data: existing } = await supabase
      .from('notes')
      .select('id')
      .eq('user_id', userId)
      .contains('tags', [`goal-${goal.id}`])
      .maybeSingle();

    if (existing) {
      const { gemini } = await import('../ai/gemini');
      const embedding = await gemini.getEmbedding(content);
      await supabase
        .from('notes')
        .update({
          content,
          embedding,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await addMemory({
        type: 'Strategy',
        content,
        tags: [`goal-${goal.id}`, 'goal', 'system-goal'],
        importance: 9,
        source: 'System Sync'
      });
    }
  } catch (err) {
    console.error('Failed to sync goal to memory:', err);
  }
}

export async function syncOfferToMemory(offer: Offer): Promise<void> {
  try {
    const userId = await getUserId();
    const deliverablesStr = (offer.deliverables || []).join(', ');
    const content = `Business Offer: ${offer.name}. Description: ${offer.description || 'N/A'}. Target Customer: ${offer.target_customer || 'N/A'}. Price Range: $${offer.price_min || 0} - $${offer.price_max || 0}. Retainer Range: $${offer.monthly_retainer_min || 0} - $${offer.monthly_retainer_max || 0}/mo. Deliverables: ${deliverablesStr || 'N/A'}. Status: ${offer.status}.`;

    const { data: existing } = await supabase
      .from('notes')
      .select('id')
      .eq('user_id', userId)
      .contains('tags', [`offer-${offer.id}`])
      .maybeSingle();

    if (existing) {
      const { gemini } = await import('../ai/gemini');
      const embedding = await gemini.getEmbedding(content);
      await supabase
        .from('notes')
        .update({
          content,
          embedding,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await addMemory({
        type: 'Business',
        content,
        tags: [`offer-${offer.id}`, 'offer', 'system-offer'],
        importance: 8,
        source: 'System Sync'
      });
    }
  } catch (err) {
    console.error('Failed to sync offer to memory:', err);
  }
}
