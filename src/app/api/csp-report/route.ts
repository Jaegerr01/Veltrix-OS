import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Receives CSP violation reports (Report-Only policy). Logs a trimmed line; never stores or echoes the payload. */
export async function POST(req: Request) {
  const len = Number(req.headers.get('content-length') || 0);
  if (len > 20_000) return new NextResponse(null, { status: 413 });
  try {
    const text = (await req.text()).slice(0, 2000);
    console.warn('[csp-report]', text.replace(/\s+/g, ' '));
  } catch { /* ignore */ }
  return new NextResponse(null, { status: 204 });
}
