'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/db';
import { ChatMessage } from '@/lib/types';
import { Send, Terminal, Trash2, Cpu, Sparkles, BrainCircuit } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface AIChatBoxProps {
  onReportGenerated?: () => void;
  onLeadScored?: () => void;
}

export default function AIChatBox({ onReportGenerated, onLeadScored }: AIChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat messages initially
  useEffect(() => {
    async function loadMessages() {
      const msgs = await db.getChatMessages();
      setMessages([...msgs]);
    }
    loadMessages();

    // Listen for ask-agent shortcuts
    const handleAsk = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setInput(customEvent.detail);
      }
    };
    window.addEventListener('veltrix-ask-agent', handleAsk);
    return () => window.removeEventListener('veltrix-ask-agent', handleAsk);
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setLoading(true);
    setInput('');

    // Add user message locally for immediate UI update
    const userMsg: ChatMessage = {
      id: 'msg-temp-user-' + Date.now(),
      sender: 'user',
      message: textToSend,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Call API
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend })
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);

        // Triggers to refresh parent dashboards depending on what user commanded
        const lowerText = textToSend.toLowerCase();
        if (lowerText.includes('report') && onReportGenerated) {
          // If generated daily report in chat, reload
          onReportGenerated();
        }
        if (lowerText.includes('score') && onLeadScored) {
          onLeadScored();
        }
      } else {
        throw new Error(data.error || 'Chat failed');
      }
    } catch (e: any) {
      console.error(e);
      // Fallback response
      const errResponse: ChatMessage = {
        id: 'msg-temp-ai-' + Date.now(),
        sender: 'ai',
        agentName: 'System Error',
        message: `⚠️ Connection Failed.\n\nDetails: ${e.message || 'Unknown network error'}\n\nPlease check your server console, Netlify logs, or local database connections.`,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      await db.clearChatMessages();
      const msgs = await db.getChatMessages();
      setMessages([...msgs]);
    }
  };

  const handleSaveMessageToMemory = async (content: string) => {
    try {
      await db.addMemory({
        type: 'Business',
        content: content.substring(0, 500),
        tags: ['ai-saved', 'chat-helper'],
        importance: 6,
        source: 'AI Assistant Chat'
      });
      alert('Fact successfully recorded in Saved Notes (Memory Vault)!');
    } catch (e) {
      console.error(e);
      alert('Failed to save memory.');
    }
  };

  const suggestionPills = [
    { label: '📊 Generate Daily Summary', query: 'Generate my daily command report.' },
    { label: '💰 How to reach $6k?', query: 'What should I do today to reach $6k/month?' },
    { label: '🎯 Score Radiant Smiles Lead', query: 'Score this lead Radiant Smiles Dental Clinic' },
    { label: '✍️ Draft website proposal', query: 'Create a proposal for Radiant Smiles Dental Clinic with Website development offer.' }
  ];

  return (
    <div className="glass-panel border border-white/5 rounded-xl flex flex-col h-[550px] overflow-hidden bg-cyber-bg/40">
      {/* Header Header */}
      <div className="px-6 py-3 border-b border-cyber-border bg-white/5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Terminal size={18} className="text-neon-purple animate-pulse-glow" />
          <span className="text-sm font-mono tracking-wider font-bold">CHAT WITH AI ASSISTANT</span>
        </div>
        <button
          onClick={handleClear}
          title="Clear chat"
          className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-neon-pink transition cursor-pointer"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Messages viewport */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 font-sans text-sm">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          return (
            <div key={msg.id} className={`flex ${isAi ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] rounded-lg p-4 border ${
                isAi 
                  ? 'bg-neon-purple/5 border-neon-purple/20 text-foreground' 
                  : 'bg-white/5 border-white/10 text-foreground'
              }`}>
                {/* Message Header */}
                <div className="flex items-center space-x-2 mb-1.5">
                  <div className={`p-1 rounded bg-white/5 ${isAi ? 'text-neon-purple' : 'text-neon-cyan'}`}>
                    {isAi ? <Cpu size={12} /> : <Terminal size={12} />}
                  </div>
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${
                    isAi ? 'text-neon-purple' : 'text-neon-cyan'
                  }`}>
                    {isAi ? (msg.agentName === 'CEO Agent' ? 'AI Assistant' : (msg.agentName || 'AI Assistant')) : 'YOU'}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {/* Message content */}
                <p className="whitespace-pre-wrap leading-relaxed select-text font-sans text-[13px]">{msg.message}</p>
                 {isAi && msg.id !== 'msg-start-1' && (
                   <div className="mt-2.5 pt-2 border-t border-white/5 flex justify-end">
                     <button
                       onClick={() => handleSaveMessageToMemory(msg.message)}
                       className="px-2 py-1 rounded bg-white/5 hover:bg-neon-purple/25 text-muted-foreground hover:text-neon-purple border border-white/5 hover:border-neon-purple/20 transition font-mono text-[9px] flex items-center space-x-1 cursor-pointer"
                     >
                       <BrainCircuit size={10} />
                       <span>SAVE TO MEMORY</span>
                     </button>
                   </div>
                 )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-neon-purple/5 border border-neon-purple/20 rounded-lg p-4 max-w-[85%] space-y-2">
              <div className="flex items-center space-x-2">
                <Sparkles size={12} className="text-neon-purple animate-pulse-glow" />
                <span className="text-[10px] font-mono font-bold text-neon-purple uppercase tracking-widest animate-pulse-glow">
                  AI Assistant is thinking...
                </span>
              </div>
              <div className="flex space-x-1.5 pt-1">
                <div className="w-1.5 h-1.5 bg-neon-purple rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-neon-purple rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-neon-purple rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      <div className="px-6 py-2 border-t border-cyber-border bg-white/2 flex flex-wrap gap-2">
        {suggestionPills.map((pill, i) => (
          <button
            key={i}
            onClick={() => handleSend(pill.query)}
            disabled={loading}
            className="px-2.5 py-1 text-[11px] font-mono rounded bg-white/5 hover:bg-neon-purple/10 border border-white/5 hover:border-neon-purple/30 text-muted-foreground hover:text-neon-purple transition duration-200 cursor-pointer disabled:opacity-50"
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Message input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-4 border-t border-cyber-border bg-white/5 flex space-x-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          placeholder="Ask your AI Assistant (e.g. 'What should I do today?')..."
          className="flex-1 px-4 py-2.5 rounded bg-white/5 border border-white/10 hover:border-neon-purple/30 focus:border-neon-purple text-sm text-foreground focus:outline-none transition duration-200"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 rounded bg-neon-purple hover:bg-neon-purple/85 text-white flex items-center justify-center transition cursor-pointer disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
