import { NextResponse } from 'next/server';
import type { z } from 'zod';

/** Parse a JSON body with a zod schema. Returns data, or a ready 400 response listing what is wrong. */
export async function parseJson<S extends z.ZodType>(req: Request, schema: S): Promise<{ data: z.infer<S>; response?: undefined } | { data?: undefined; response: NextResponse }> {
  const raw = await req.json().catch(() => null);
  const r = schema.safeParse(raw);
  if (!r.success) {
    const msg = r.error.issues.slice(0, 4).map(i => `${i.path.join('.') || 'body'}: ${i.message}`).join('; ');
    return { response: NextResponse.json({ success: false, error: `Invalid request - ${msg}` }, { status: 400 }) };
  }
  return { data: r.data };
}
