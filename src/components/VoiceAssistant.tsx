'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  Terminal, 
  Volume,
  Compass,
  Cpu,
  ChevronRight,
  AlertTriangle,
  HelpCircle
} from 'lucide-react';

interface CustomStatusEvent extends Event {
  detail?: {
    isListening: boolean;
    isSpeaking: boolean;
  };
}

export default function VoiceAssistant() {
  const router = useRouter();
  
  // UI states
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Dialog log
  const [transcript, setTranscript] = useState('');
  const [agentResponse, setAgentResponse] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // Speech Recognition and Synthesis references
  const recognitionRef = useRef<any>(null);
  const isListeningActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const shouldResumeRef = useRef(false);
  const isActuallyRunningRef = useRef(false);
  const selectedVoiceNameRef = useRef<string | null>(null);

  // Sync state refs to avoid closure stale state in callbacks
  useEffect(() => {
    isListeningActiveRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  // Dispatch state updates to Topbar
  useEffect(() => {
    const event = new CustomEvent('veltrix-voice-status', {
      detail: { isListening, isSpeaking }
    });
    window.dispatchEvent(event);
  }, [isListening, isSpeaking]);

  // Initialize SpeechRecognition on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg('Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setErrorMsg(null);
      isActuallyRunningRef.current = true;
    };

    rec.onresult = async (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setTranscript(speechToText);
      setAgentResponse('');
      await handleVoiceCommand(speechToText);
    };

    rec.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setErrorMsg('Microphone permission blocked. Please check your browser privacy settings.');
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        // Silent timeout, we can ignore this since onend will restart it if active
      } else {
        setErrorMsg(`Voice input error: ${event.error}`);
      }
    };

    rec.onend = () => {
      isActuallyRunningRef.current = false;
      // Loop: restart if we are still active and NOT currently speaking output
      if (isListeningActiveRef.current && !isSpeakingRef.current) {
        try {
          if (!isActuallyRunningRef.current) {
            rec.start();
          }
        } catch (e) {
          console.error('Failed to restart recognition:', e);
        }
      }
    };

    recognitionRef.current = rec;

    // Handle global toggle event from Topbar
    const handleGlobalToggle = () => {
      if (isListeningActiveRef.current) {
        stopListening();
      } else {
        startListening();
      }
    };

    window.addEventListener('veltrix-toggle-voice', handleGlobalToggle);

    // Warm up TTS voices loading
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }

    return () => {
      window.removeEventListener('veltrix-toggle-voice', handleGlobalToggle);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    setIsListening(true);
    setIsOpen(true); // Open the HUD to show active status
    setErrorMsg(null);
    try {
      if (!isActuallyRunningRef.current) {
        recognitionRef.current.start();
      }
    } catch (e) {
      console.error('Error starting recognition:', e);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  // Text-To-Speech Output
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || isMuted) return;

    // Pause recognition to prevent mic picking up system audio feedback loop
    if (recognitionRef.current && isListeningActiveRef.current) {
      shouldResumeRef.current = true;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    window.speechSynthesis.cancel();

    // Clean markdown structures from AI outputs for natural spoken word
    const cleanedText = text
      .replace(/\*+/g, '')
      .replace(/#+/g, '')
      .replace(/`+/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[-*+]\s+/g, '')
      .replace(/⚠️|💡|📊|💰|🎯|✍️/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanedText);

    // Select suitable voice
    const voices = window.speechSynthesis.getVoices();
    let voice = null;
    
    if (selectedVoiceNameRef.current) {
      voice = voices.find(v => v.name === selectedVoiceNameRef.current);
    }
    
    if (!voice) {
      const englishVoices = voices.filter(v => v.lang.startsWith('en'));
      voice = 
        // 1. Edge Natural Online Female voices (Jenny, Aria, etc.)
        englishVoices.find(v => v.name.includes('Natural') && (v.name.includes('Jenny') || v.name.includes('Aria') || v.name.includes('Female'))) ||
        // 2. Google US/UK English (usually high-quality female)
        englishVoices.find(v => v.name.includes('Google US English') || v.name.includes('Google UK English Female')) ||
        // 3. Apple Samantha (macOS default natural-ish female)
        englishVoices.find(v => v.name.includes('Samantha')) ||
        // 4. Microsoft Zira (Windows default offline female)
        englishVoices.find(v => v.name.includes('Zira')) ||
        // 5. Any voice explicitly stating "female"
        englishVoices.find(v => v.name.toLowerCase().includes('female')) ||
        // 6. Fallback to any online voice (which sounds natural) that is not male
        englishVoices.find(v => v.name.includes('Google') || v.name.includes('Online') && !v.name.toLowerCase().includes('male')) ||
        // 7. Fallback to any English voice that is not Microsoft David (male)
        englishVoices.find(v => !v.name.includes('David') && !v.name.toLowerCase().includes('male')) ||
        // 8. Hard fallback
        englishVoices[0] || 
        voices[0];
        
      if (voice) {
        selectedVoiceNameRef.current = voice.name;
      }
    }

    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.05; // Friendly, natural female pitch

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      // Resume listening if we were listening before TTS started
      if (shouldResumeRef.current) {
        shouldResumeRef.current = false;
        if (isListeningActiveRef.current && recognitionRef.current) {
          try {
            if (!isActuallyRunningRef.current) {
              recognitionRef.current.start();
            }
          } catch (e) {
            console.error('Failed to resume voice listening:', e);
          }
        }
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      if (shouldResumeRef.current) {
        shouldResumeRef.current = false;
        if (isListeningActiveRef.current && recognitionRef.current) {
          try {
            if (!isActuallyRunningRef.current) {
              recognitionRef.current.start();
            }
          } catch (e) {}
        }
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Parse Voice Commands
  const handleVoiceCommand = async (command: string) => {
    const text = command.toLowerCase().trim();

    // 1. System status check
    if (text.includes('system status') || text.includes('system checklist') || text.includes('status report')) {
      const msg = 'FRIDAY command center status is optimal. Local databases are online. All operations check out.';
      setAgentResponse(msg);
      speakText(msg);
      return;
    }

    // 2. Navigation Commands matching
    const navRoutes = [
      { keys: ['potential client', 'leads', 'lead list'], path: '/leads', reply: 'Opening potential clients and leads directory.' },
      { keys: ['money', 'revenue', 'earnings', 'cash', 'finance'], path: '/revenue', reply: 'Loading monthly earnings and financial tracker.' },
      { keys: ['outbox', 'outreach', 'messages', 'email', 'send message'], path: '/outreach', reply: 'Opening sent outreach history.' },
      { keys: ['reminder', 'follow up', 'followup'], path: '/follow-ups', reply: 'Loading follow-up reminders list.' },
      { keys: ['proposal', 'quote', 'estimate', 'price'], path: '/proposals', reply: 'Opening clients proposals and pricing quotes.' },
      { keys: ['client list', 'my client', 'customers'], path: '/clients', reply: 'Navigating to client directory.' },
      { keys: ['project checklist', 'projects', 'milestone'], path: '/projects', reply: 'Loading active project milestones.' },
      { keys: ['to do list', 'todo', 'tasks', 'task list'], path: '/tasks', reply: 'Opening tasks execution board.' },
      { keys: ['notes', 'memory', 'brain', 'vault', 'saved notes'], path: '/memory', reply: 'Opening memory vault and saved business facts.' },
      { keys: ['writer', 'social writer', 'content', 'posts'], path: '/content', reply: 'Accessing AI social content writer.' },
      { keys: ['reports', 'summaries', 'daily summary'], path: '/reports', reply: 'Navigating to daily executive summaries.' },
      { keys: ['settings', 'option', 'config', 'keys'], path: '/settings', reply: 'Opening system settings console.' },
      { keys: ['chat with ai', 'assistant', 'chat box', 'command center'], path: '/command-center', reply: 'Connecting to AI Chat terminal.' },
      { keys: ['dashboard', 'home', 'main page'], path: '/', reply: 'Returning to core command dashboard.' }
    ];

    for (const route of navRoutes) {
      if (route.keys.some(key => text.includes(key))) {
        setAgentResponse(route.reply);
        speakText(route.reply);
        router.push(route.path);
        return;
      }
    }

    // 3. Fallback: Query autonomous AI chat
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: command })
      });
      const data = await res.json();
      if (data.success) {
        const reply = data.message.message;
        setAgentResponse(reply);
        speakText(reply);
      } else {
        throw new Error(data.error || 'Server returned failure');
      }
    } catch (e: any) {
      console.error('Error fetching voice assistant reply:', e);
      const errText = 'Connection failed. I am unable to query your active AI agents right now.';
      setAgentResponse(errText);
      speakText(errText);
    } finally {
      setLoading(false);
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (newMuted && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const triggerManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!transcript.trim() || loading) return;
    setAgentResponse('');
    handleVoiceCommand(transcript);
  };

  const suggestions = [
    'Go to potential clients',
    'Show money',
    'Open to-do list',
    'Open saved notes',
    'System status',
    'What should I do today to reach $6k?'
  ];

  return (
    <>
      {/* Floating Microphone Activation Orb */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center justify-center">
        {!isOpen && (
          <button
            onClick={() => {
              setIsOpen(true);
              startListening();
            }}
            className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer border border-neon-purple/30 bg-cyber-bg/85 backdrop-blur-md transition-all duration-300 relative ${
              isListening ? 'animate-orb-pulse border-neon-cyan/80' : 'hover:scale-105 hover:border-neon-purple/70 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
            }`}
            title="Open Jarvis Voice Console"
          >
            {/* Animated rotating outer rings for Jarvis feel */}
            {isListening && (
              <>
                <div className="absolute inset-0 rounded-full border border-dashed border-neon-cyan/40 animate-spin-slow" />
                <div className="absolute -inset-2 rounded-full border border-dotted border-neon-purple/30 animate-spin-reverse" />
              </>
            )}
            
            <div className={`p-3 rounded-full relative z-10 ${isListening ? 'text-neon-cyan' : 'text-neon-purple'}`}>
              <Mic size={22} className={isListening ? 'animate-pulse' : ''} />
            </div>
            
            {/* Listening small ping */}
            {isListening && (
              <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-neon-cyan"></span>
              </span>
            )}
          </button>
        )}
      </div>

      {/* Expanded Jarvis HUD Console Overlay */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-[420px] bg-cyber-bg/95 border-l border-cyber-border z-40 shadow-2xl flex flex-col backdrop-blur-lg scanlines font-mono">
          {/* Header */}
          <div className="p-4 border-b border-cyber-border bg-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
              <span className="text-xs font-bold uppercase tracking-widest text-neon-cyan">FRIDAY CORE ASSISTANT</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Voice Mute Toggle */}
              <button
                onClick={toggleMute}
                className={`p-1.5 rounded border transition-colors cursor-pointer ${
                  isMuted 
                    ? 'border-neon-pink/20 bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20' 
                    : 'border-white/5 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
                }`}
                title={isMuted ? 'Unmute voice feedback' : 'Mute voice feedback'}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded border border-white/5 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimize Console"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Central Radial Visualization Sphere */}
          <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white/3 to-transparent relative border-b border-white/5 overflow-hidden">
            {/* Sci-Fi Background grid circles */}
            <div className="absolute w-64 h-64 rounded-full border border-white/[0.02]" />
            <div className="absolute w-48 h-48 rounded-full border border-white/[0.03]" />
            
            {/* Glowing Orb */}
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
              {/* Outer spinning dash borders */}
              <div className={`absolute inset-1.5 rounded-full border border-dashed animate-spin-slow ${
                isSpeaking ? 'border-neon-pink/30' : isListening ? 'border-neon-cyan/30' : 'border-neon-purple/10'
              }`} />
              
              <div className={`absolute inset-4 rounded-full border border-dotted animate-spin-reverse ${
                isSpeaking ? 'border-neon-pink/20' : isListening ? 'border-neon-cyan/20' : 'border-neon-purple/10'
              }`} />

              <div className={`relative z-10 transition-colors duration-300 ${
                isSpeaking ? 'text-neon-pink' : isListening ? 'text-neon-cyan' : 'text-neon-purple/60'
              }`}>
                {isListening ? (
                  <Mic size={36} className="animate-pulse" />
                ) : (
                  <MicOff size={36} />
                )}
              </div>
              
              <span className={`text-[9px] mt-2 font-mono tracking-widest relative z-10 font-bold ${
                isSpeaking ? 'text-neon-pink' : isListening ? 'text-neon-cyan' : 'text-neon-purple/55'
              }`}>
                {isSpeaking ? 'TALKING' : isListening ? 'LISTENING' : 'OFFLINE'}
              </span>
            </div>

            {/* Live equalizer visualizer bars */}
            <div className="h-8 flex items-center justify-center mt-6">
              {isListening ? (
                <div className="flex items-end h-6">
                  <span className="sound-wave-bar" />
                  <span className="sound-wave-bar" />
                  <span className="sound-wave-bar" />
                  <span className="sound-wave-bar" />
                  <span className="sound-wave-bar" />
                  <span className="sound-wave-bar" />
                  <span className="sound-wave-bar" />
                </div>
              ) : isSpeaking ? (
                <div className="text-[10px] text-neon-pink animate-pulse tracking-widest font-bold flex items-center space-x-1.5">
                  <Volume size={13} />
                  <span>TRANSMITTING VOCAL FEEDBACK...</span>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground/60 tracking-wider">TAP ORB TO START VOICE ACTIVATION</span>
              )}
            </div>
          </div>

          {/* Interactive Screen Display log */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {errorMsg && (
              <div className="p-3.5 bg-neon-pink/10 border border-neon-pink/20 rounded-lg text-neon-pink text-xs flex items-start space-x-2.5">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Transcript (User speech input) */}
            <div className="space-y-1.5">
              <span className="text-[9px] text-neon-cyan font-bold tracking-widest block uppercase">VOICE CAPTURED</span>
              <div className="p-3 rounded bg-white/3 border border-white/5 min-h-[50px] text-xs leading-relaxed text-foreground/90 flex items-center">
                {transcript ? (
                  <span className="text-white select-text">"{transcript}"</span>
                ) : (
                  <span className="text-muted-foreground/50 italic">Speak a command (e.g. "go to potential clients" or ask a question)...</span>
                )}
              </div>
            </div>

            {/* Reply Log (Agent responses) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-neon-purple font-bold tracking-widest block uppercase">JARVIS SYNTHESIS</span>
                {loading && (
                  <span className="text-[9px] text-neon-purple animate-pulse font-bold">COMPUTING RESPONSE...</span>
                )}
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
                  <span className="text-muted-foreground/50 italic">AI speech telemetry idle. Waiting for vocal trigger.</span>
                )}
              </div>
            </div>

            {/* Manual voice box fallback */}
            <form onSubmit={triggerManualSubmit} className="pt-2 flex items-center space-x-2">
              <input 
                type="text" 
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Type command manual fallback..."
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

          {/* Quick Vocal Commands Reference trigger */}
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
                <div className="text-[10px] text-muted-foreground/80 leading-normal mb-2">
                  Say these phrases directly when microphone is activated:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-1.5 rounded bg-white/3 border border-white/5">
                    <span className="text-neon-cyan block font-bold">"Go to leads"</span>
                    <span className="text-muted-foreground text-[9px]">Potential Clients</span>
                  </div>
                  <div className="p-1.5 rounded bg-white/3 border border-white/5">
                    <span className="text-neon-cyan block font-bold">"Show money"</span>
                    <span className="text-muted-foreground text-[9px]">Earnings & Revenue</span>
                  </div>
                  <div className="p-1.5 rounded bg-white/3 border border-white/5">
                    <span className="text-neon-cyan block font-bold">"Open tasks"</span>
                    <span className="text-muted-foreground text-[9px]">To-Do List</span>
                  </div>
                  <div className="p-1.5 rounded bg-white/3 border border-white/5">
                    <span className="text-neon-cyan block font-bold">"Show notes"</span>
                    <span className="text-muted-foreground text-[9px]">Memory Vault</span>
                  </div>
                  <div className="p-1.5 rounded bg-white/3 border border-white/5 col-span-2">
                    <span className="text-neon-purple block font-bold">Any general business question</span>
                    <span className="text-muted-foreground text-[9px]">Calls AI Agent (e.g. "Draft proposal for dentist")</span>
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
