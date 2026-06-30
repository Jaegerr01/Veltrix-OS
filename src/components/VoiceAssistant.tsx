'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch } from '@/lib/authFetch';
import { Mic, MicOff, Volume2, VolumeX, X, Volume, ChevronRight, AlertTriangle, HelpCircle } from 'lucide-react';

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
  const [showGuide, setShowGuide] = useState(false);

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
        setErrorMsg('Microphone permission blocked. Check browser privacy settings.');
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
      if (isListeningActiveRef.current) stopListening();
      else startListening();
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
        en.find(v => /natural/i.test(v.name) && /jenny|aria|female/i.test(v.name)) ||
        en.find(v => /Google US English|Google UK English Female/i.test(v.name)) ||
        en.find(v => /Samantha|Zira/i.test(v.name)) ||
        en.find(v => /female/i.test(v.name)) ||
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

      // Proxy unavailable — log and fall through to browser TTS
      const errData = await res.json().catch(() => ({}));
      console.warn('[ARIA] TTS proxy unavailable:', errData.error || res.status);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError' || err?.name === 'TimeoutError';
      if (!isAbort) console.warn('[ARIA] TTS fetch failed:', err?.message);
      setIsSpeaking(false);
      isSpeakingRef.current = false;
    }

    // Browser TTS fallback (Voicebox offline)
    speakBrowserTTS(spokenText);
  };

  const handleVoiceCommand = async (command: string) => {
    // Prevent double-processing overlapping recognitions
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
      const fallback = "Lost contact with the agents for a moment. Try again.";
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

  const triggerManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!transcript.trim() || loading) return;
    setAgentResponse('');
    handleVoiceCommand(transcript);
  };

  return (
    <>
      {/* Floating Mic Orb */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
        {!isOpen && (
          <button
            onClick={() => { setIsOpen(true); startListening(); }}
            className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer border border-neon-purple/30 bg-cyber-bg/85 backdrop-blur-md transition-all duration-300 relative ${
              isListening ? 'animate-orb-pulse border-neon-cyan/80' : 'hover:scale-105 hover:border-neon-purple/70 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
            }`}
            title="Open ARIA Voice Console"
          >
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full border border-dashed border-neon-cyan/40 animate-spin-slow" />
                <div className="absolute -inset-2 rounded-full border border-dotted border-neon-purple/30 animate-spin-reverse" />
              </>
            )}
            <div className={`p-3 rounded-full relative z-10 ${isListening ? 'text-neon-cyan' : 'text-neon-purple'}`}>
              <Mic size={22} className={isListening ? 'animate-pulse' : ''} />
            </div>
            {isListening && (
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-neon-cyan" />
              </span>
            )}
          </button>
        )}
      </div>

      {/* ARIA HUD Console */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-[420px] bg-cyber-bg/95 border-l border-cyber-border z-40 shadow-2xl flex flex-col backdrop-blur-lg scanlines font-mono">
          {/* Header */}
          <div className="p-4 border-b border-cyber-border bg-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
              <span className="text-xs font-bold uppercase tracking-widest text-neon-cyan">ARIA — VELTRIX ASSISTANT</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className={`p-1.5 rounded border transition-colors cursor-pointer ${isMuted ? 'border-neon-pink/20 bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20' : 'border-white/5 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'}`}
                title={isMuted ? 'Unmute ARIA' : 'Mute ARIA'}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded border border-white/5 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimize"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Orb Visualization */}
          <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white/3 to-transparent relative border-b border-white/5 overflow-hidden">
            <div className="absolute w-64 h-64 rounded-full border border-white/[0.02]" />
            <div className="absolute w-48 h-48 rounded-full border border-white/[0.03]" />
            <div
              onClick={isListening ? stopListening : startListening}
              className={`w-36 h-36 rounded-full flex flex-col items-center justify-center cursor-pointer relative transition-all duration-500 bg-black/60 shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border ${
                isSpeaking
                  ? 'border-neon-pink/50 shadow-[0_0_30px_rgba(236,72,153,0.3)]'
                  : isListening
                    ? 'border-neon-cyan/50 shadow-[0_0_35px_rgba(6,182,212,0.4)] animate-orb-pulse'
                    : 'border-neon-purple/30 hover:border-neon-purple/70 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]'
              }`}
            >
              <div className={`absolute inset-1.5 rounded-full border border-dashed animate-spin-slow ${isSpeaking ? 'border-neon-pink/30' : isListening ? 'border-neon-cyan/30' : 'border-neon-purple/10'}`} />
              <div className={`absolute inset-4 rounded-full border border-dotted animate-spin-reverse ${isSpeaking ? 'border-neon-pink/20' : isListening ? 'border-neon-cyan/20' : 'border-neon-purple/10'}`} />
              <div className={`relative z-10 transition-colors duration-300 ${isSpeaking ? 'text-neon-pink' : isListening ? 'text-neon-cyan' : 'text-neon-purple/60'}`}>
                {isListening ? <Mic size={36} className="animate-pulse" /> : <MicOff size={36} />}
              </div>
              <span className={`text-[9px] mt-2 font-mono tracking-widest relative z-10 font-bold ${isSpeaking ? 'text-neon-pink' : isListening ? 'text-neon-cyan' : 'text-neon-purple/55'}`}>
                {isSpeaking ? 'ARIA SPEAKING' : isListening ? 'LISTENING' : 'STANDBY'}
              </span>
            </div>

            <div className="h-8 flex items-center justify-center mt-6">
              {isListening ? (
                <div className="flex items-end h-6">
                  {[...Array(7)].map((_, i) => <span key={i} className="sound-wave-bar" />)}
                </div>
              ) : isSpeaking ? (
                <div className="text-[10px] text-neon-pink animate-pulse tracking-widest font-bold flex items-center space-x-1.5">
                  <Volume size={13} />
                  <span>ARIA TRANSMITTING...</span>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground/60 tracking-wider">TAP ORB TO ACTIVATE ARIA</span>
              )}
            </div>
          </div>

          {/* Log Display */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {errorMsg && (
              <div className="p-3.5 bg-neon-pink/10 border border-neon-pink/20 rounded-lg text-neon-pink text-xs flex items-start space-x-2.5">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <span className="text-[9px] text-neon-cyan font-bold tracking-widest block uppercase">Voice Captured</span>
              <div className="p-3 rounded bg-white/3 border border-white/5 min-h-[50px] text-xs leading-relaxed flex items-center">
                {transcript
                  ? <span className="text-white select-text">"{transcript}"</span>
                  : <span className="text-muted-foreground/50 italic">Speak a command or ask ARIA a question...</span>}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-neon-purple font-bold tracking-widest block uppercase">ARIA Response</span>
                {loading && <span className="text-[9px] text-neon-purple animate-pulse font-bold">COMPUTING...</span>}
              </div>
              <div className="p-3.5 rounded bg-neon-purple/5 border border-neon-purple/10 min-h-[90px] text-xs leading-relaxed text-foreground select-text relative">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-2 w-3/4 bg-neon-purple/10 rounded animate-pulse" />
                    <div className="h-2 w-5/6 bg-neon-purple/10 rounded animate-pulse" />
                    <div className="h-2 w-1/2 bg-neon-purple/10 rounded animate-pulse" />
                  </div>
                ) : agentResponse ? (
                  <p className="whitespace-pre-wrap text-[13px]">{agentResponse}</p>
                ) : (
                  <span className="text-muted-foreground/50 italic">Waiting for vocal trigger...</span>
                )}
              </div>
            </div>

            {/* Manual text fallback */}
            <form onSubmit={triggerManualSubmit} className="pt-2 flex items-center space-x-2">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Type command..."
                className="flex-1 px-3 py-2 bg-white/3 border border-white/10 hover:border-neon-purple/30 focus:border-neon-purple rounded text-xs focus:outline-none text-foreground font-mono"
              />
              <button
                type="submit"
                disabled={loading || !transcript.trim()}
                className="px-3 py-2 rounded bg-neon-purple hover:bg-neon-purple/80 text-white text-xs transition cursor-pointer disabled:opacity-50"
              >
                EXECUTE
              </button>
            </form>
          </div>

          {/* Quick Commands */}
          <div className="border-t border-cyber-border bg-white/2">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full px-5 py-3 text-left text-xs font-bold text-muted-foreground hover:text-neon-cyan transition flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center space-x-2">
                <HelpCircle size={14} />
                <span>VOCAL TRIGGER SHORTCUTS</span>
              </span>
              <ChevronRight size={14} className={`transition-transform duration-200 ${showGuide ? 'rotate-90 text-neon-cyan' : ''}`} />
            </button>

            {showGuide && (
              <div className="px-5 pb-4 pt-1 space-y-2.5 max-h-48 overflow-y-auto border-t border-white/5 bg-black/40">
                <div className="text-[10px] text-muted-foreground/80 leading-normal mb-2">Say these phrases when the mic is active:</div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { cmd: '"Go to leads"', desc: 'Potential Clients' },
                    { cmd: '"Show revenue"', desc: 'Earnings & Finance' },
                    { cmd: '"Open tasks"', desc: 'To-Do List' },
                    { cmd: '"Show notes"', desc: 'Memory Vault' },
                  ].map(({ cmd, desc }) => (
                    <div key={cmd} className="p-1.5 rounded bg-white/3 border border-white/5">
                      <span className="text-neon-cyan block font-bold">{cmd}</span>
                      <span className="text-muted-foreground text-[9px]">{desc}</span>
                    </div>
                  ))}
                  <div className="p-1.5 rounded bg-white/3 border border-white/5 col-span-2">
                    <span className="text-neon-purple block font-bold">Any business question</span>
                    <span className="text-muted-foreground text-[9px]">ARIA routes to the right agent — e.g. "Draft a proposal for a dentist"</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
