import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/requireUser';

// VOICEBOX_URL: local dev → http://127.0.0.1:8000
//               production → https://your-voicebox.railway.app (set in Vercel env vars)
const VOICEBOX_URL = (process.env.VOICEBOX_URL || 'http://127.0.0.1:8000')
  .replace('localhost', '127.0.0.1');

// Optional: pin to a specific voice profile ID instead of auto-discovering
const VOICEBOX_PROFILE_ID = process.env.VOICEBOX_PROFILE_ID || null;

let cachedProfileId: string | null = VOICEBOX_PROFILE_ID;

async function getProfileId(): Promise<string | null> {
  if (cachedProfileId) return cachedProfileId;
  try {
    const res = await fetch(`${VOICEBOX_URL}/profiles`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const profiles: { id: string }[] = await res.json();
    if (!profiles.length) return null;
    cachedProfileId = profiles[0].id;
    return cachedProfileId;
  } catch {
    return null;
  }
}

// Debug: GET /api/voice/tts → returns Voicebox connectivity status
export async function GET() {
  const profileId = await getProfileId();
  try {
    const r = await fetch(`${VOICEBOX_URL}/models/status`, { signal: AbortSignal.timeout(4000) });
    const status = await r.json();
    const kokoro = status.models?.find((m: any) => m.model_name === 'kokoro');
    return NextResponse.json({ ok: true, url: VOICEBOX_URL, profileId, kokoro: kokoro || null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, url: VOICEBOX_URL, profileId, error: e.message }, { status: 503 });
  }
}

export async function POST(req: Request) {
  // Auth: TTS generation costs compute — only signed-in operators may use it.
  const auth = await requireUser(req);
  if (auth.response) return auth.response;

  try {
    const body = await req.json();
    const text: string = body?.text?.trim();
    if (!text) return NextResponse.json({ error: 'text is required' }, { status: 400 });

    const profileId = await getProfileId();
    if (!profileId) {
      return NextResponse.json(
        { error: 'Voicebox has no voice profiles. Open the Voicebox app and create a profile.' },
        { status: 503 }
      );
    }

    let voiceboxRes: Response;
    try {
      voiceboxRes = await fetch(`${VOICEBOX_URL}/generate/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          text,
          language: 'en',
          engine: 'kokoro',
          personality: false,
        }),
        signal: AbortSignal.timeout(30000),
      });
    } catch (connErr: any) {
      const isOffline = connErr?.cause?.code === 'ECONNREFUSED' || connErr?.code === 'ECONNREFUSED';
      console.warn('[ARIA TTS] Voicebox unreachable:', connErr?.message);
      return NextResponse.json(
        { error: isOffline ? 'Voicebox is offline. Start voicebox-server.exe first.' : 'Voicebox connection failed.' },
        { status: 503 }
      );
    }

    if (!voiceboxRes.ok) {
      const errBody = await voiceboxRes.text().catch(() => '');
      console.warn(`[ARIA TTS] Voicebox ${voiceboxRes.status}:`, errBody.slice(0, 200));
      // Reset profile cache if profile was deleted
      if (voiceboxRes.status === 404) cachedProfileId = VOICEBOX_PROFILE_ID;
      return NextResponse.json({ error: `Voicebox error ${voiceboxRes.status}` }, { status: 502 });
    }

    const audioBuffer = await voiceboxRes.arrayBuffer();
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-store',
        'X-TTS-Source': 'voicebox-kokoro',
      },
    });
  } catch (err: any) {
    console.error('[ARIA TTS] Unexpected error:', err);
    return NextResponse.json({ error: 'TTS proxy internal error' }, { status: 500 });
  }
}
