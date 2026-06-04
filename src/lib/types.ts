// Types definition for VELTRIX COMMAND OS

export interface BusinessProfile {
  id: string;
  business_name: string;
  description: string;
  services: string[];
  target_monthly_revenue: number;
  current_monthly_revenue: number;
  primary_offer: string;
  secondary_offer: string;
  target_markets: string[];
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  target_amount?: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Abandoned';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  deadline?: string;
  success_criteria?: string;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  name: string;
  description: string;
  target_customer: string;
  price_min: number;
  price_max: number;
  monthly_retainer_min: number;
  monthly_retainer_max: number;
  deliverables: string[];
  status: 'Active' | 'Draft' | 'Archived';
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  business_name: string;
  contact_name?: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  social_link?: string;
  location?: string;
  pain_point?: string;
  lead_score: number;
  status:
    | 'New'
    | 'Researched'
    | 'Qualified'
    | 'Contacted'
    | 'Replied'
    | 'Call Booked'
    | 'Proposal Sent'
    | 'Won'
    | 'Lost'
    | 'Follow-up Later';
  source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadScore {
  id: string;
  lead_id: string;
  website_score: number; // 1-10
  branding_score: number; // 1-10
  automation_need_score: number; // 1-10
  ability_to_pay_score: number; // 1-10
  urgency_score: number; // 1-10
  total_score: number;
  reasoning: string;
  created_at: string;
}

export interface OutreachMessage {
  id: string;
  lead_id: string;
  channel: 'Email' | 'LinkedIn' | 'Instagram' | 'WhatsApp' | 'Facebook';
  message: string;
  status: 'Draft' | 'Approved' | 'Sent' | 'Replied' | 'Failed';
  approval_status: 'Pending Approval' | 'Approved' | 'Rejected';
  sent_at?: string;
  created_at: string;
}

export interface Followup {
  id: string;
  lead_id: string;
  followup_date: string;
  followup_type: string; // Soft Reminder, Value-based, Final Check-in, Re-engagement
  message?: string;
  status: 'Pending' | 'Drafted' | 'Approved' | 'Sent' | 'Completed' | 'Skipped';
  created_at: string;
  updated_at: string;
}

export interface Call {
  id: string;
  lead_id: string;
  scheduled_date: string;
  call_status: 'Scheduled' | 'Completed' | 'No Show' | 'Rescheduled' | 'Cancelled';
  notes?: string;
  pain_points?: string;
  budget?: number;
  decision_maker: boolean;
  next_step?: string;
  created_at: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  lead_id?: string;
  client_id?: string;
  title: string;
  problem?: string;
  solution?: string;
  deliverables: string[];
  timeline?: string;
  price: number;
  payment_terms?: string;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Needs Revision';
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  business_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  service_purchased?: string;
  total_value: number;
  monthly_retainer: number;
  status: 'Active' | 'Inactive' | 'Completed';
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  client_id: string;
  project_name: string;
  service_type: string;
  status:
    | 'Discovery'
    | 'Requirements'
    | 'Design'
    | 'Development'
    | 'Review'
    | 'Revision'
    | 'Delivered'
    | 'Completed';
  deadline?: string;
  requirements?: string;
  deliverables: string[];
  revision_count: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  agent_name: string;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Blocked' | 'Needs Approval';
  due_date?: string;
  result?: string;
  related_goal_id?: string;
  related_lead_id?: string;
  related_client_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Revenue {
  id: string;
  client_id?: string;
  proposal_id?: string;
  amount: number;
  type: 'Project' | 'Retainer' | 'Setup Fee' | 'Upsell' | 'Other';
  status: 'Expected' | 'Invoiced' | 'Paid' | 'Overdue' | 'Cancelled';
  payment_date?: string;
  month: string; // YYYY-MM
  notes?: string;
  created_at: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'Software' | 'Marketing' | 'Contractors' | 'Legal' | 'Other';
  date: string;
  notes?: string;
  created_at: string;
}

export interface Memory {
  id: string;
  type:
    | 'Business'
    | 'Client'
    | 'Lead'
    | 'Project'
    | 'Sales'
    | 'Offer'
    | 'Strategy'
    | 'Personal Preference'
    | 'Decision'
    | 'Lesson';
  content: string;
  tags: string[];
  importance: number; // 1-10
  embedding?: number[];
  source: string;
  created_at: string;
  updated_at: string;
}

export interface AgentLog {
  id: string;
  agent_name: string;
  action: string;
  input?: string;
  output?: string;
  status: 'Success' | 'Failure' | 'Pending Approval';
  created_at: string;
}

export interface ToolLog {
  id: string;
  tool_name: string;
  action: string;
  input?: string;
  output?: string;
  status: 'Success' | 'Failure';
  error?: string;
  created_at: string;
}

export interface DailyReport {
  id: string;
  report_date: string;
  revenue_target: number;
  closed_revenue: number;
  pipeline_value: number;
  revenue_gap: number;
  top_priority?: string;
  leads_to_contact: string[];
  followups_due: string[];
  content_to_post?: string;
  recommended_action?: string;
  created_at: string;
}

export interface ContentIdea {
  id: string;
  platform: 'LinkedIn' | 'Instagram' | 'YouTube' | 'TikTok' | 'Twitter';
  title: string;
  hook?: string;
  content?: string;
  content_type?: 'Text' | 'Image' | 'Short-form Video' | 'Carousel';
  status: 'Idea' | 'Draft' | 'Approved' | 'Scheduled' | 'Posted';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  agentName?: string;
  message: string;
  created_at: string;
}

export interface AdCampaign {
  id: string;
  name: string;
  platform?: string;
  status: 'Active' | 'Paused' | 'Completed' | 'Draft';
  budget: number;
  spent?: number;
  clicks?: number;
  impressions?: number;
  conversions?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CommunityMetric {
  id: string;
  name: string;
  platform?: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  created_at?: string;
}

