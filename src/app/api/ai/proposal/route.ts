import { z } from 'zod';
import { makeDraftRoute } from '@/lib/api/agentRoute';

export const POST = makeDraftRoute('proposal', z.object({
  leadId: z.string().min(1).max(100),
  offerName: z.string().min(1).max(200),
  price: z.number().min(0).max(10_000_000),
}));
