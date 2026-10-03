'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mic, MicOff, Square, Volume2, VolumeX, X, Loader2, Send } from 'lucide-react';
import { authFetch } from '@/lib/authFetch';
import { asErr } from '@/lib/errors';
import { askCeoOnce, CeoRequestError } from '@/lib/orchestrator/client';
import { runToChatText, runToSpoken } from '@/lib/orchestrator/chatText';
import { parseVoiceIntent } from '@/lib/voice/intent';
import { toSpoken } from '@/lib/voice/spoken';

/**
 * ARIA - the voice front-end of the SAME CEO orchestrator used by the CEO console.
 *   speech -> /api/ceo (plan -> real tasks -> agents) -> what really happened is spoken back.
 * Status questions read /api/ceo/status (database counts). Nothing is invented client-side.
 *
 * States: idle | listening | thinking | speaking | error.   Controls: push-to-talk (hold), hands-free toggle,
 * Stop (interrupts speech/requests), mute, typed input (works in every browser, incl. Firefox).
 * Events kept for the rest of the app: 'postelos-toggle-voice' (in), 'postelos-voice-status' (out).
 */

type VState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

const STATE_LABEL: Record<VState, string> = { idle: 'Ready', listening: 'Listening…', thinking: 'Thinking…', speaking: 'Speaking…', error: 'Problem' };
const STATE_COLOR: Record<VState, string> = { idle: 'var(--violet-300)', listening: 'var(--signal-400)', thinking: 'var(--warn-400)', speaking: 'var(--magenta-300)', error: 'var(--danger-400)' };
const TTS_SKIP_KEY = 'postelos_tts_server_unavailable_until';

interface SpeechRecResult { isFinal: boolean; [i: number]: { transcript: string } }
interface SpeechRecEvent { resultIndex: number; results: { length: number; [i: number]: SpeechRecResult } }
interface SpeechRec {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((ev: SpeechRecEvent) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
type SpeechRecCtor = new () => SpeechRec;

function getRecognitionCtor(): SpeechRecCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecCtor; webkitSpeechRecognition?: SpeechRecCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function VoiceAssistant() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [state, setState] = React.useState<VState>('idle');
  const [handsFree, setHandsFree] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [heard, setHeard] = React.useState('');
  const [reply, setReply] = React.useState('');
  const [error, setError] = React.useState<{ message: string; hint?: string } | null>(null);
  const [typed, setTyped] = React.useState('');
  const [supported, setSupported] = React.useState(true);
  const [voiceNote, setVoiceNote] = React.useState<string | null>(null);
  const [hasTasks, setHasTasks] = React.useState(false);

  const recRef = React.useRef<SpeechRec | null>(null);
  const startListeningRef = React.useRef<((mode: 'ptt' | 'handsfree') => void) | null>(null);
  const stateRef = React.useRef<VState>('idle');
  const handsFreeRef = React.useRef(false);
  const mutedRef = React.useRef(false);
  const finalRef = React.useRef('');
  const acRef = React.useRef<AbortController | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const speakDoneRef = React.useRef<(() => void) | null>(null);
  const runIdRef = React.useRef(0); // invalidates stale async work after Stop

  const setS = React.useCallback((s: VState) => { stateRef.current = s; setState(s); }, []);
  React.useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);
  React.useEffect(() => { mutedRef.current = muted; }, [muted]);
  React.useEffect(() => {
    window.dispatchEvent(new CustomEvent('postelos-voice-status', { detail: { state, isListening: state === 'listening', isSpeaking: state === 'speaking' } }));
  }, [state]);

  React.useEffect(() => {
    // Deferred so the first render matches the server markup (browser capability is only known on the client).
    const t = setTimeout(() => {
      setSupported(!!getRecognitionCtor());
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        setVoiceNote('Microphone access needs HTTPS (or localhost). Typing still works.');
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  /* ----------------------------- speech output ----------------------------- */

  const cancelSpeech = React.useCallback(() => {
    if (audioRef.current) { audioRef.current.onended = null; audioRef.current.onerror = null; try { audioRef.current.pause(); } catch { /* */ } audioRef.current = null; }
    try { window.speechSynthesis?.cancel(); } catch { /* */ }
    const done = speakDoneRef.current; speakDoneRef.current = null; done?.();
  }, []);

  const speakBrowser = (text: string) => new Promise<void>((resolve) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
    if (!synth) { setVoiceNote('This browser cannot speak (no speech synthesis). The reply is shown on screen.'); resolve(); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const en = voices.filter(v => v.lang?.startsWith('en'));
    const v = en.find(x => /natural|online|aria|jenny|google us/i.test(x.name)) || en[0] || voices[0];
    if (v) u.voice = v;
    u.rate = 1.0;
    speakDoneRef.current = resolve;
    u.onend = () => { speakDoneRef.current = null; resolve(); };
    u.onerror = () => { speakDoneRef.current = null; resolve(); };
    synth.speak(u);
  });

  const speakServer = async (text: string): Promise<boolean> => {
    const until = Number(sessionStorage.getItem(TTS_SKIP_KEY) || 0);
    if (until > Date.now()) return false;
    try {
      const res = await authFetch('/api/voice/tts', { method: 'POST', body: JSON.stringify({ text }), signal: AbortSignal.timeout(22000) });
      if (!res.ok || !(res.headers.get('content-type') || '').startsWith('audio/')) {
        // not configured / provider down -> remember for 10 min so we don't add latency to every reply
        sessionStorage.setItem(TTS_SKIP_KEY, String(Date.now() + 10 * 60_000));
        return false;
      }
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      await new Promise<void>((resolve, reject) => {
        speakDoneRef.current = resolve;
        audio.onended = () => { speakDoneRef.current = null; resolve(); };
        audio.onerror = () => reject(new Error('audio error'));
        audio.play().catch(reject);
      });
      URL.revokeObjectURL(url);
      audioRef.current = null;
      return true;
    } catch {
      return false;
    }
  };

  const speak = async (text: string, myRun: number) => {
    const spoken = toSpoken(text);
    if (!spoken || mutedRef.current) return;
    if (myRun !== runIdRef.current) return;
    setS('speaking');
    const ok = await speakServer(spoken);
    if (!ok && myRun === runIdRef.current) await speakBrowser(spoken);
  };

  /* ----------------------------- the brain call ----------------------------- */

  const ask = React.useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    const myRun = ++runIdRef.current;
    setHeard(text); setError(null); setReply(''); setHasTasks(false);
    setS('thinking');
    const ac = new AbortController(); acRef.current = ac;
    let spoken = '';
    try {
      const intent = parseVoiceIntent(text);
      if (intent.kind === 'stop') { setS('idle'); return; }
      if (intent.kind === 'navigate') {
        spoken = `Opening ${intent.label}.`;
        setReply(spoken);
        router.push(intent.path);
      } else if (intent.kind === 'status') {
        const res = await authFetch('/api/ceo/status', { signal: ac.signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new CeoRequestError({ message: data.error || `Status request failed (${res.status}).` }, res.status);
        spoken = data.status.spoken; // built only from database counts
        setReply(spoken);
      } else {
        const result = await askCeoOnce(intent.text, 'aria', ac.signal);
        setReply(runToChatText(result));
        setHasTasks(result.tasks.length > 0);
        spoken = runToSpoken(result);
      }
      if (myRun !== runIdRef.current) return;
      await speak(spoken, myRun);
    } catch (raw) {
      const e = asErr(raw);
      if (e.name === 'AbortError' || myRun !== runIdRef.current) return;
      const msg = e instanceof CeoRequestError ? e.message : String(e?.message || e);
      setError({ message: msg, hint: e instanceof CeoRequestError ? e.hint : undefined });
      setS('error');
      // Say the real problem out loud (short), so hands-free users are not left guessing.
      await speak(msg, myRun);
      return;
    } finally {
      if (acRef.current === ac) acRef.current = null;
    }
    if (myRun !== runIdRef.current) return;
    if (handsFreeRef.current) startListeningRef.current?.('handsfree'); else setS('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  /* ----------------------------- speech input ----------------------------- */

  const stopAll = React.useCallback(() => {
    runIdRef.current++;
    acRef.current?.abort(); acRef.current = null;
    try { recRef.current?.abort(); } catch { /* */ }
    cancelSpeech();
    setHandsFree(false); handsFreeRef.current = false;
    setS('idle');
  }, [cancelSpeech, setS]);

  const startListening = React.useCallback((mode: 'ptt' | 'handsfree') => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError({ message: 'Voice input is not supported in this browser.', hint: 'Firefox does not implement the Web Speech API. Use Chrome, Edge or Safari for the microphone, or type below - ARIA will still answer and speak.' });
      setS('error');
      return;
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setError({ message: 'Microphone access requires HTTPS (or localhost).', hint: 'Open the app over https:// (your Netlify URL) or on http://localhost.' });
      setS('error');
      return;
    }
    // interrupt anything in flight (speech or request)
    runIdRef.current++;
    acRef.current?.abort(); cancelSpeech();
    try { recRef.current?.abort(); } catch { /* */ }

    const rec = new Ctor();
    rec.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    finalRef.current = '';
    let fatal = false;

    rec.onstart = () => { setError(null); setS('listening'); setHeard(''); };
    rec.onresult = (ev: SpeechRecEvent) => {
      let interim = ''; let fin = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) fin += r[0].transcript; else interim += r[0].transcript;
      }
      if (fin) finalRef.current += fin;
      setHeard((finalRef.current + interim).trim());
    };
    rec.onerror = (ev: { error?: string }) => {
      const code = ev?.error ?? '';
      if (code === 'no-speech' || code === 'aborted') return;
      fatal = true;
      const map: Record<string, { message: string; hint?: string }> = {
        'not-allowed': { message: 'Microphone permission is blocked.', hint: 'Click the lock/camera icon in the address bar, allow the microphone for this site, then try again.' },
        'service-not-allowed': { message: 'The browser blocked speech recognition.', hint: 'Allow microphone access for this site in your browser settings.' },
        'audio-capture': { message: 'No microphone was found.', hint: 'Plug in or enable a microphone and try again.' },
        network: { message: 'Speech recognition could not reach its service.', hint: 'Chrome sends audio to Google for recognition - check your internet connection.' },
      };
      setError(map[code] || { message: `Voice input error: ${code}` });
      setHandsFree(false); handsFreeRef.current = false;
      setS('error');
    };
    rec.onend = () => {
      if (fatal || recRef.current !== rec) return;
      const text = finalRef.current.trim();
      if (text) { void ask(text); return; }
      // nothing heard: hands-free keeps listening, push-to-talk returns to idle
      // eslint-disable-next-line react-hooks/immutability -- startListening is a hoisted closure invoked after the recognizer ends
      if (handsFreeRef.current && stateRef.current === 'listening') { setTimeout(() => { if (handsFreeRef.current && stateRef.current !== 'thinking' && stateRef.current !== 'speaking') startListening('handsfree'); }, 300); }
      else if (stateRef.current === 'listening') setS('idle');
    };
    recRef.current = rec;
    if (mode === 'handsfree') { setHandsFree(true); handsFreeRef.current = true; }
    try { rec.start(); } catch (raw) { setError({ message: `Could not start the microphone: ${asErr(raw).message || String(raw)}` }); setS('error'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask, cancelSpeech, setS]);
  React.useEffect(() => { startListeningRef.current = startListening; }, [startListening]);

  const stopListeningKeepRun = () => { try { recRef.current?.stop(); } catch { /* */ } }; // lets the final result arrive (push-to-talk release)

  /* ----------------------------- global toggle event ----------------------------- */

  React.useEffect(() => {
    const onToggle = () => {
      setOpen(true);
      if (stateRef.current === 'idle' || stateRef.current === 'error') startListening('handsfree');
      else stopAll();
    };
    window.addEventListener('postelos-toggle-voice', onToggle);
    return () => { window.removeEventListener('postelos-toggle-voice', onToggle); try { recRef.current?.abort(); } catch { /* */ } cancelSpeech(); };
  }, [startListening, stopAll, cancelSpeech]);

  const busy = state === 'thinking' || state === 'speaking';

  /* ----------------------------- UI ----------------------------- */

  const fab: React.CSSProperties = {
    position: 'fixed', right: 22, bottom: 22, zIndex: 70, width: 54, height: 54, borderRadius: '50%', border: '1px solid var(--border-default)',
    background: 'var(--grad-brand)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    boxShadow: state === 'listening' ? '0 0 0 6px rgba(46,230,160,0.25), var(--glow-violet)' : 'var(--glow-violet)',
  };

  return (
    <>
      <button type="button" aria-label={open ? 'Close ARIA voice assistant' : 'Open ARIA voice assistant'} title="ARIA voice assistant" style={fab} onClick={() => setOpen(o => !o)}>
        {state === 'thinking' ? <Loader2 size={22} className="animate-spin" /> : <Mic size={22} />}
      </button>

      {open && (
        <div role="dialog" aria-label="ARIA voice assistant" className="vx-glass" style={{ position: 'fixed', right: 22, bottom: 88, zIndex: 70, width: 'min(380px, calc(100vw - 32px))', padding: 16, borderRadius: 18, background: 'var(--grad-panel)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: STATE_COLOR[state], boxShadow: state === 'listening' || state === 'speaking' ? `0 0 10px ${STATE_COLOR[state]}` : 'none' }} />
              <b style={{ fontFamily: 'var(--font-display)', color: 'var(--text-strong)' }}>ARIA</b>
              <span data-testid="aria-state" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: STATE_COLOR[state] }}>{STATE_LABEL[state]}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => { const m = !mutedRef.current; setMuted(m); if (m) cancelSpeech(); }} aria-label={muted ? 'Unmute ARIA' : 'Mute ARIA'} title={muted ? 'Unmute' : 'Mute'} style={iconBtn}>{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button>
              <button type="button" onClick={() => { stopAll(); setOpen(false); }} aria-label="Close" style={iconBtn}><X size={15} /></button>
            </div>
          </div>

          {!supported && (
            <div style={note('warn')}>Voice input is not supported in this browser (Firefox does not implement the Web Speech API). Use Chrome, Edge or Safari for the microphone - or type below. ARIA still answers and speaks.</div>
          )}
          {voiceNote && <div style={note('warn')}>{voiceNote}</div>}
          {error && (
            <div role="alert" style={note('bad')}>
              {error.message}{error.hint ? <><br />{error.hint}</> : null}
            </div>
          )}
          {heard && <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5 }}>YOU </span>{heard}</div>}
          {reply && <div style={{ fontSize: 13, color: 'var(--text-body)', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--violet-300)' }}>ARIA </span>{reply}</div>}
          {hasTasks && <Link href="/ceo" style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5, color: 'var(--cyan-300)' }}>Open the CEO console to follow these tasks →</Link>}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              aria-label="Hold to talk"
              title="Hold to talk"
              disabled={!supported}
              onPointerDown={(e) => { e.preventDefault(); startListening('ptt'); }}
              onPointerUp={stopListeningKeepRun}
              onPointerLeave={() => { if (stateRef.current === 'listening' && !handsFreeRef.current) stopListeningKeepRun(); }}
              style={{ ...pill, background: state === 'listening' && !handsFree ? 'rgba(46,230,160,0.18)' : 'rgba(139,92,246,0.14)', opacity: supported ? 1 : 0.45 }}
            ><Mic size={14} /> Hold to talk</button>
            <button type="button" disabled={!supported} onClick={() => (handsFree ? stopAll() : startListening('handsfree'))} style={{ ...pill, background: handsFree ? 'rgba(46,230,160,0.18)' : 'rgba(255,255,255,0.04)', opacity: supported ? 1 : 0.45 }}>
              {handsFree ? <><MicOff size={14} /> Hands-free: on</> : <><Mic size={14} /> Hands-free</>}
            </button>
            {(busy || state === 'listening') && <button type="button" onClick={stopAll} style={{ ...pill, color: 'var(--danger-400)' }}><Square size={13} /> Stop</button>}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); const t = typed; setTyped(''); void ask(t); }} style={{ display: 'flex', gap: 6 }}>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} disabled={state === 'thinking'} placeholder="…or type to ARIA" aria-label="Type a message to ARIA"
              style={{ flex: 1, minWidth: 0, height: 36, padding: '0 10px', borderRadius: 8, background: 'var(--ink-700)', border: '1px solid var(--border-default)', color: 'var(--text-strong)', fontSize: 13, outline: 'none' }} />
            <button type="submit" disabled={!typed.trim() || state === 'thinking'} aria-label="Send" style={{ ...iconBtn, width: 36, height: 36, opacity: typed.trim() ? 1 : 0.5 }}><Send size={15} /></button>
          </form>
          <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            ARIA sends your words to the CEO agent. It can create and run tasks; emails and proposals still wait for your approval.
          </div>
        </div>
      )}
    </>
  );
}

const iconBtn: React.CSSProperties = { width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const pill: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, border: '1px solid var(--border-default)', color: 'var(--text-strong)', fontSize: 12, fontFamily: 'var(--font-display)', fontWeight: 600, cursor: 'pointer', userSelect: 'none', touchAction: 'none' };
const note = (tone: 'warn' | 'bad'): React.CSSProperties => ({ fontSize: 12, lineHeight: 1.5, padding: '8px 10px', borderRadius: 8, fontFamily: 'var(--font-mono)', color: tone === 'bad' ? 'var(--danger-400)' : 'var(--warn-400)', background: tone === 'bad' ? 'rgba(239,68,68,0.08)' : 'rgba(245,180,60,0.08)', border: `1px solid ${tone === 'bad' ? 'rgba(239,68,68,0.3)' : 'rgba(245,180,60,0.3)'}` });
