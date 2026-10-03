import { z } from 'zod';
import { makeDraftRoute } from '@/lib/api/agentRoute';

export const POST = makeDraftRoute('outreach', z.object({
  leadId: z.string().min(1).max(100),
  offerName: z.string().min(1).max(200),
  channel: z.enum(['Email', 'LinkedIn', 'Instagram', 'WhatsApp', 'Facebook']).default('Email'),
}));
