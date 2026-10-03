import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';
import { checkRateLimit, rateLimitResponse } from '@/lib/auth/rateLimit';
import { selectTtsProvider } from '@/lib/voice/tts';
import { asErr } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const bodySchema = z.object({ text: z.string().trim().min(1).max(1500) });

/** Every non-audio answer carries `fallback:'browser'` so the client can switch to speechSynthesis immediately. */
const fallback = (status: number, error: string) => NextResponse.json({ ok: false, error, fallback: 'browser' }, { status });

// GET: which TTS is configured (names only). Operator-only.
export async function GET(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const sel = selectTtsProvider();
  return NextResponse.json({ ok: true, provider: sel.provider, requested: sel.requested, reason: sel.reason, missing: sel.missing });
}

export async function POST(req: Request) {
  const auth = await requireUser(req);
  if (auth.response) return auth.response;
  const rl = await checkRateLimit(`tts:${auth.user.id}`, { limit: 30, windowMs: 60_000, failClosed: true });
  if (!rl.allowed) return rateLimitResponse(rl);

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'text is required (max 1500 characters).' }, { status: 400 });
  const { text } = parsed.data;

  const sel = selectTtsProvider();
  if (sel.provider === 'none') return fallback(501, sel.reason);

  try {
    if (sel.provider === 'elevenlabs') {
      const voice = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice)}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY as string, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
        body: JSON.stringify({ text, model_id: process.env.ELEVENLABS_MODEL || 'eleven_turbo_v2_5' }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 160);
        console.warn('[tts] ElevenLabs error', res.status, detail);
        return fallback(502, res.status === 401 ? 'ElevenLabs rejected the API key (ELEVENLABS_API_KEY).' : `ElevenLabs error ${res.status}.`);
      }
      return new Response(await res.arrayBuffer(), { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store', 'X-TTS-Source': 'elevenlabs' } });
    }

    // Voicebox (self-hosted) - only used when VOICEBOX_URL is explicitly set.
    const base = String(process.env.VOICEBOX_URL).replace('localhost', '127.0.0.1').replace(/\/$/, '');
    let profileId = process.env.VOICEBOX_PROFILE_ID || null;
    if (!profileId) {
      const pr = await fetch(`${base}/profiles`, { signal: AbortSignal.timeout(4000) }).catch(() => null);
      const list = pr && pr.ok ? ((await pr.json().catch(() => [])) as Array<{ id: string }>) : [];
      profileId = list[0]?.id ?? null;
    }
    if (!profileId) return fallback(503, 'Voicebox is unreachable or has no voice profile.');
    const vb = await fetch(`${base}/generate/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile_id: profileId, text, language: 'en', engine: 'kokoro', personality: false }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!vb.ok) return fallback(502, `Voicebox error ${vb.status}.`);
    return new Response(await vb.arrayBuffer(), { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'no-store', 'X-TTS-Source': 'voicebox' } });
  } catch (eRaw: unknown) { const e = asErr(eRaw);
    console.warn('[tts] provider unreachable:', e?.message);
    return fallback(503, 'The TTS provider is unreachable.');
  }
}
