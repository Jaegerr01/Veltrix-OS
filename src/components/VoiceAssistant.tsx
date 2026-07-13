'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';
import { Mic, Volume2, VolumeX, X, Loader2 } from 'lucide-react';

// Convert AI text output to clean spoken English
function toSpoken(text: string): string {
  return text
    // Remove markdown formatting
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
    .replace(/#{1,6}\s*/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*+•]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // Remove emojis
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '')
    .replace(/[⚠️💡📊💰🎯✍️👥🔑✅❌📝🚀]/g, '')
    // Remove "Offline Simulator Mode" banner — read just the spoken part
    .replace(/⚠️?\s*\*?\*?Offline Simulator Mode\*?\*?\s*\([^)]*\)\s*/gi, '')
    // Expand numbers to spoken form for natural TTS
    .replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g, (_, n) => {
      const num = parseFloat(n.replace(/,/g, ''));
      if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} million dollars`;
      if (num >= 1_000) return `${(num / 1_000).toFixed(0)} thousand dollars`;
      return `${num} dollars`;
    })
    // Expand common abbreviations
    .replace(/\bDMs?\b/g, 'direct messages')
    .replace(/\bCRM\b/g, 'CRM')
    .replace(/\bAI\b/g, 'AI')
    .replace(/\bCEO\b/g, 'CEO')
    // Collapse whitespace and line breaks
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    // Trim filler agent prefixes like "Alex (CEO Agent):"
    .replace(/^\*?\*?[A-Za-z]+ \([^)]+\)\*?\*?:\s*/m, '')
    .trim();
}

export default function VoiceAssistant() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const shouldResumeRef = useRef(false);
  const isActuallyRunningRef = useRef(false);
  const selectedVoiceNameRef = useRef<string | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCommandRef = useRef(false);

  useEffect(() => { isListeningActiveRef.current = isListening; }, [isListening]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('veltrix-voice-status', { detail: { isListening, isSpeaking } }));
  }, [isListening, isSpeaking]);

  // Cancel any audio currently playing (Voicebox or browser TTS)
  const cancelCurrentAudio = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.onended = null;
      currentAudioRef.current.onerror = null;
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    isSpeakingRef.current = false;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Web Speech API not supported. Use Chrome, Edge, or Safari.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => { setErrorMsg(null); isActuallyRunningRef.current = true; };

    rec.onresult = async (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
      setAgentResponse('');
      await handleVoiceCommand(speechToText);
    };

    rec.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setErrorMsg('Microphone permission blocked. Check browser settings.');
        setIsListening(false);
      } else if (event.error !== 'no-speech') {
        setErrorMsg(`Voice input error: ${event.error}`);
      }
    };

    rec.onend = () => {
      isActuallyRunningRef.current = false;
      if (isListeningActiveRef.current && !shouldResumeRef.current) {
        try { rec.start(); } catch (e) { console.error('Failed to restart recognition:', e); }
      }
    };

    recognitionRef.current = rec;

    const handleGlobalToggle = () => {
      if (isListeningActiveRef.current) {
        stopListening();
      } else {
        startListening();
      }
    };
    window.addEventListener('veltrix-toggle-voice', handleGlobalToggle);
    if (window.speechSynthesis) window.speechSynthesis.getVoices();

    return () => {
      window.removeEventListener('veltrix-toggle-voice', handleGlobalToggle);
      try { recognitionRef.current?.abort(); } catch {}
      cancelCurrentAudio();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setIsListening(true);
    setIsOpen(true);
    setTranscript('');
    setAgentResponse('');
    setErrorMsg(null);
    try {
      if (!isActuallyRunningRef.current) recognitionRef.current.start();
    } catch (e) { console.error('Error starting recognition:', e); }
  };

  const stopListening = () => {
    setIsListening(false);
    try { recognitionRef.current?.stop(); } catch {}
  };

  const resumeListeningIfNeeded = () => {
    if (shouldResumeRef.current) {
      shouldResumeRef.current = false;
      if (isListeningActiveRef.current && recognitionRef.current) {
        try {
          if (!isActuallyRunningRef.current) recognitionRef.current.start();
        } catch (e) { console.error('Failed to resume voice listening:', e); }
      }
    }
  };

  const speakBrowserTTS = (spokenText: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      resumeListeningIfNeeded();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    const voices = window.speechSynthesis.getVoices();

    let voice: SpeechSynthesisVoice | null = null;
    if (selectedVoiceNameRef.current) {
      voice = voices.find(v => v.name === selectedVoiceNameRef.current) || null;
    }
    if (!voice) {
      const en = voices.filter(v => v.lang.startsWith('en'));
      voice =
        en.find(v => /Google US English/i.test(v.name)) ||
        en.find(v => /Aria/i.test(v.name)) ||
        en.find(v => /Microsoft.*Online/i.test(v.name)) ||
        en.find(v => /natural/i.test(v.name) && /jenny|female/i.test(v.name)) ||
        en.find(v => /Samantha|Zira/i.test(v.name)) ||
        en[0] || voices[0];
      if (voice) selectedVoiceNameRef.current = voice.name;
    }
    if (voice) utterance.voice = voice;
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.onstart = () => { setIsSpeaking(true); isSpeakingRef.current = true; };
    utterance.onend = () => { setIsSpeaking(false); isSpeakingRef.current = false; resumeListeningIfNeeded(); };
    utterance.onerror = () => { setIsSpeaking(false); isSpeakingRef.current = false; resumeListeningIfNeeded(); };
    window.speechSynthesis.speak(utterance);
  };

  const speakText = async (text: string) => {
    if (typeof window === 'undefined' || isMuted) return;

    // Stop anything currently playing before starting new speech
    cancelCurrentAudio();

    // Gate the mic so rec.onend won't restart it while we're speaking
    if (recognitionRef.current && isListeningActiveRef.current) {
      shouldResumeRef.current = true;
      try { recognitionRef.current.stop(); } catch {}
    }

    const spokenText = toSpoken(text);
    if (!spokenText) { resumeListeningIfNeeded(); return; }

    try {
      setIsSpeaking(true);
      isSpeakingRef.current = true;

      const res = await authFetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenText }),
        signal: AbortSignal.timeout(25000),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          currentAudioRef.current = null;
          URL.revokeObjectURL(audioUrl);
          resumeListeningIfNeeded();
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          currentAudioRef.current = null;
          URL.revokeObjectURL(audioUrl);
          speakBrowserTTS(spokenText);
        };

        await audio.play();
        return;
      }

      setIsSpeaking(false);
      isSpeakingRef.current = false;
    } catch (err: any) {
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }

    // Browser TTS fallback
    speakBrowserTTS(spokenText);
  };

  const handleVoiceCommand = async (command: string) => {
    if (pendingCommandRef.current) return;
    pendingCommandRef.current = true;

    const text = command.toLowerCase().trim();

    // System status shortcut
    if (text.includes('system status') || text.includes('status report')) {
      const msg = "All systems are online. Agents are ready. What do you need?";
      setAgentResponse(msg);
      await speakText(msg);
      pendingCommandRef.current = false;
      return;
    }

    // Navigation shortcuts
    const navRoutes = [
      { keys: ['potential client', 'leads', 'lead list'], path: '/leads', reply: "Opening your leads directory now." },
      { keys: ['money', 'revenue', 'earnings', 'finance'], path: '/revenue', reply: "Loading your revenue tracker." },
      { keys: ['outreach', 'outbox', 'messages', 'email'], path: '/outreach', reply: "Opening sent outreach." },
      { keys: ['reminder', 'follow up', 'followup'], path: '/follow-ups', reply: "Loading your follow-up reminders." },
      { keys: ['proposal', 'quote', 'estimate', 'price'], path: '/proposals', reply: "Opening proposals and quotes." },
      { keys: ['client list', 'my client', 'customers'], path: '/clients', reply: "Navigating to clients." },
      { keys: ['project', 'milestone'], path: '/projects', reply: "Loading active projects." },
      { keys: ['to do', 'todo', 'tasks', 'task list'], path: '/tasks', reply: "Opening tasks board." },
      { keys: ['notes', 'memory', 'brain', 'vault'], path: '/memory', reply: "Opening memory vault." },
      { keys: ['writer', 'content', 'posts', 'social'], path: '/content', reply: "Opening the content writer." },
      { keys: ['report', 'summaries', 'daily summary'], path: '/reports', reply: "Loading your reports." },
      { keys: ['settings', 'config', 'keys'], path: '/settings', reply: "Opening settings." },
      { keys: ['chat', 'command center', 'terminal'], path: '/command-center', reply: "Connecting to the AI command center." },
      { keys: ['dashboard', 'home', 'main page'], path: '/', reply: "Going home." },
    ];

    for (const route of navRoutes) {
      if (route.keys.some(key => text.includes(key))) {
        setAgentResponse(route.reply);
        await speakText(route.reply);
        router.push(route.path);
        pendingCommandRef.current = false;
        return;
      }
    }

    // AI agent query
    setLoading(true);
    try {
      const res = await authFetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: command, voiceMode: true }),
      });

      if (res.status === 429) {
        const fallback = "I'm handling too many requests right now. Give me a moment and try again.";
        setAgentResponse(fallback);
        await speakText(fallback);
        pendingCommandRef.current = false;
        setLoading(false);
        return;
      }

      const data = await res.json();
      if (data.success) {
        const reply = data.message?.message || data.message;
        setAgentResponse(reply);
        await speakText(reply);
      } else {
        throw new Error(data.error || 'Server returned failure');
      }
    } catch (e: any) {
      console.error('[ARIA] Chat API error:', e);
      const fallback = "I lost connection to the agents. Please try again.";
      setAgentResponse(fallback);
      await speakText(fallback);
    } finally {
      setLoading(false);
      pendingCommandRef.current = false;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted) cancelCurrentAudio();
  };

  // Self-dismissal hook: close HUD overlay if idle for 6 seconds
  useEffect(() => {
    if (!isOpen) return;
    if (!isListening && !isSpeaking && !loading) {
      const t = setTimeout(() => {
        setIsOpen(false);
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [isOpen, isListening, isSpeaking, loading]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: '90%',
        maxWidth: 520,
        borderRadius: 24,
        background: 'rgba(10, 6, 26, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-xl), var(--glow-violet)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        fontFamily: 'var(--font-body)',
        animation: 'vxFadeUp 0.3s var(--ease-out) both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isSpeaking ? 'var(--danger-400)' : isListening ? 'var(--cyan-400)' : 'var(--mist-400)',
              boxShadow: isSpeaking ? '0 0 10px var(--danger-400)' : isListening ? '0 0 10px var(--cyan-400)' : 'none',
              animation: isListening || isSpeaking ? 'vxDotBlink 1.4s ease-in-out infinite' : 'none',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: 'var(--ls-wide)',
              textTransform: 'uppercase',
              color: isSpeaking ? 'var(--danger-400)' : isListening ? 'var(--cyan-400)' : 'var(--text-muted)',
            }}
          >
            {isSpeaking ? 'ARIA TRANSMITTING' : isListening ? 'ARIA LISTENING' : 'ARIA STANDBY'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggleMute}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: 4,
            }}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              stopListening();
              cancelCurrentAudio();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: 4,
            }}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {transcript && (
          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>
            &ldquo;{transcript}&rdquo;
          </div>
        )}
        
        {loading && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Loader2 size={12} className="animate-spin text-neon-purple" />
            <span style={{ fontSize: 11, color: 'var(--violet-200)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
              COORDINATING SPECIALIST AGENTS...
            </span>
          </div>
        )}

        {errorMsg && (
          <div style={{ fontSize: 12, color: 'var(--danger-400)', fontFamily: 'var(--font-mono)' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {agentResponse && (
          <div
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-strong)',
              lineHeight: 1.45,
              borderLeft: '2px solid var(--violet-400)',
              paddingLeft: 12,
              marginTop: 4,
            }}
          >
            {agentResponse}
          </div>
        )}
      </div>
    </div>
  );
}
