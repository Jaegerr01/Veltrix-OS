import { describe, it, expect } from 'vitest';
import { parseVoiceIntent } from './intent';
import { toSpoken } from './spoken';
import { selectTtsProvider } from './tts';

describe('parseVoiceIntent', () => {
  it('navigates only on an explicit open/go-to request', () => {
    expect(parseVoiceIntent('Open the leads')).toMatchObject({ kind: 'navigate', path: '/leads' });
    expect(parseVoiceIntent('go to command center')).toMatchObject({ kind: 'navigate', path: '/command-center' });
    expect(parseVoiceIntent('ARIA, please show me proposals')).toMatchObject({ kind: 'navigate', path: '/proposals' });
  });
  it('does NOT hijack real instructions that merely contain a route keyword', () => {
    expect(parseVoiceIntent('Email the dentist leads about the new offer')).toMatchObject({ kind: 'ask' });
    expect(parseVoiceIntent('draft a proposal for Acme Dental')).toMatchObject({ kind: 'ask' });
    expect(parseVoiceIntent('open a new task for Daniel to research Acme')).toMatchObject({ kind: 'ask' });
  });
  it('status and stop', () => {
    expect(parseVoiceIntent('system status').kind).toBe('status');
    expect(parseVoiceIntent("how are we doing").kind).toBe('status');
    expect(parseVoiceIntent('stop').kind).toBe('stop');
    expect(parseVoiceIntent('never mind').kind).toBe('stop');
  });
  it('a long sentence mentioning status is still a question for the CEO', () => {
    expect(parseVoiceIntent('what is the status of the Acme proposal and who is following up on it').kind).toBe('ask');
  });
});

describe('toSpoken', () => {
  it('strips markdown, emoji and expands dollars', () => {
    const s = toSpoken('## Plan\n- **Research** Acme ✅\n- Close $1,500 deal');
    expect(s).not.toMatch(/[#*✅]/);
    expect(s).toContain('1,500 dollars');
  });
  it('caps long text on a sentence boundary and says the rest is on screen', () => {
    const long = Array.from({ length: 80 }, (_, i) => `Sentence number ${i}.`).join(' ');
    const s = toSpoken(long, 200);
    expect(s.length).toBeLessThan(260);
    expect(s).toMatch(/The rest is on screen\.$/);
  });
});

describe('selectTtsProvider', () => {
  it('auto with nothing configured -> none (browser voice), never assumes localhost', () => {
    const r = selectTtsProvider({} as any);
    expect(r.provider).toBe('none');
    expect(r.missing).toContain('ELEVENLABS_API_KEY');
  });
  it('picks ElevenLabs when its key is set; Voicebox only when VOICEBOX_URL is explicit', () => {
    expect(selectTtsProvider({ ELEVENLABS_API_KEY: 'x' } as any).provider).toBe('elevenlabs');
    expect(selectTtsProvider({ VOICEBOX_URL: 'http://x' } as any).provider).toBe('voicebox');
    expect(selectTtsProvider({ TTS_PROVIDER: 'elevenlabs' } as any)).toMatchObject({ provider: 'none', missing: ['ELEVENLABS_API_KEY'] });
    expect(selectTtsProvider({ TTS_PROVIDER: 'browser', ELEVENLABS_API_KEY: 'x' } as any).provider).toBe('none');
  });
});
