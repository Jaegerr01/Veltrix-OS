/** Which server-side TTS (if any) is configured. Names only; browser speechSynthesis is always the client fallback. */
export type TtsProvider = 'elevenlabs' | 'voicebox' | 'none';

export interface TtsSelection { provider: TtsProvider; requested: string; reason: string; missing: string[] }

const has = (env: NodeJS.ProcessEnv, k: string) => !!(env[k] && String(env[k]).trim());

export function selectTtsProvider(env: NodeJS.ProcessEnv = process.env): TtsSelection {
  const requested = (env.TTS_PROVIDER || 'auto').toLowerCase();
  if (requested === 'browser' || requested === 'none') return { provider: 'none', requested, reason: 'TTS_PROVIDER=browser: ARIA speaks with the browser voice.', missing: [] };
  if (requested === 'elevenlabs') {
    return has(env, 'ELEVENLABS_API_KEY')
      ? { provider: 'elevenlabs', requested, reason: 'ElevenLabs selected.', missing: [] }
      : { provider: 'none', requested, reason: 'TTS_PROVIDER=elevenlabs but ELEVENLABS_API_KEY is missing.', missing: ['ELEVENLABS_API_KEY'] };
  }
  if (requested === 'voicebox') {
    return has(env, 'VOICEBOX_URL')
      ? { provider: 'voicebox', requested, reason: 'Voicebox selected.', missing: [] }
      : { provider: 'none', requested, reason: 'TTS_PROVIDER=voicebox but VOICEBOX_URL is missing.', missing: ['VOICEBOX_URL'] };
  }
  // auto: only use what is explicitly configured - never assume a localhost service exists.
  if (has(env, 'ELEVENLABS_API_KEY')) return { provider: 'elevenlabs', requested, reason: 'ELEVENLABS_API_KEY is set.', missing: [] };
  if (has(env, 'VOICEBOX_URL')) return { provider: 'voicebox', requested, reason: 'VOICEBOX_URL is set.', missing: [] };
  return { provider: 'none', requested, reason: 'No server TTS configured (set ELEVENLABS_API_KEY or VOICEBOX_URL). ARIA uses the browser voice.', missing: ['ELEVENLABS_API_KEY'] };
}
