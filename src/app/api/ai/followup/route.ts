import { z } from 'zod';
import { makeDraftRoute } from '@/lib/api/agentRoute';

export const POST = makeDraftRoute('followup', z.object({
  leadId: z.string().min(1).max(100),
  sequenceDay: z.number().int().min(1).max(90).default(3),
}));
