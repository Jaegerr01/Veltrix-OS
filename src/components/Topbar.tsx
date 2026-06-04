'use client';

import React, { useEffect, useState } from 'react';
import { db, isSupabaseConfigured } from '@/lib/db';
import { BusinessProfile } from '@/lib/types';
import { ShieldCheck, Database, RefreshCcw, Mic, MicOff, Volume2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Topbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [permissionLevel, setPermissionLevel] = useState<string>('Level 4: Approval Required');
  
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const bp = await db.getBusinessProfile();
        setProfile(bp);
      } catch (e) {
        console.error(e);
      }
    }
    loadProfile();
  }, [pathname]); // Refresh stats when user navigates pages

  useEffect(() => {
    const handleStatus = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setIsListening(customEvent.detail.isListening);
        setIsSpeaking(customEvent.detail.isSpeaking);
      }
    };
    window.addEventListener('veltrix-voice-status', handleStatus);
    return () => window.removeEventListener('veltrix-voice-status', handleStatus);
  }, []);

  // Map route path to page header title
  const getPageTitle = () => {
    switch (pathname) {
      case '/': return 'Home Dashboard';
      case '/command-center': return 'Chat with AI Assistant';
      case '/revenue': return 'Money & Earnings';
      case '/leads': return 'Potential Clients (Leads)';
      case '/outreach': return 'Outbox (Messages)';
      case '/follow-ups': return 'Follow-up Reminders';
      case '/proposals': return 'Price Quotes & Proposals';
      case '/clients': return 'My Clients';
      case '/projects': return 'Projects Checklist';
      case '/tasks': return 'To-Do List';
      case '/memory': return 'Saved Notes';
      case '/content': return 'Social Writer';
      case '/reports': return 'Daily Summaries';
      case '/settings': return 'Settings & Keys';
      default: return 'VELTRIX CMD';
    }
  };

  const closedRevenue = profile?.current_monthly_revenue || 0;
  const targetRevenue = profile?.target_monthly_revenue || 6000;
  const revenueGap = Math.max(0, targetRevenue - closedRevenue);

  return (
    <header className="h-16 border-b border-cyber-border bg-cyber-bg/85 backdrop-blur-md flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10">
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold font-mono text-foreground tracking-wider uppercase">{getPageTitle()}</h1>
      </div>

      {/* KPI Stats & Security Level */}
      <div className="flex items-center space-x-6">
        {/* Dynamic mini-KPIs */}
        {profile && (
          <div className="hidden lg:flex items-center space-x-4 text-xs font-mono border-r border-cyber-border pr-6">
            <div>
              <span className="text-muted-foreground block text-[10px]">EARNED</span>
              <span className="text-neon-cyan font-bold">${closedRevenue.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">LEFT TO GO</span>
              <span className="text-neon-pink font-bold">${revenueGap.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">GOAL</span>
              <span className="text-foreground font-bold">${targetRevenue.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Database Connection Indicator */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-white/5 border border-white/5 text-[11px] font-mono">
          <Database size={13} className={isSupabaseConfigured ? 'text-neon-green' : 'text-neon-orange'} />
          <span className="text-muted-foreground">DB:</span>
          <span className={isSupabaseConfigured ? 'text-neon-green' : 'text-neon-orange font-semibold'}>
            {isSupabaseConfigured ? 'ONLINE DATABASE' : 'LOCAL STORAGE'}
          </span>
        </div>

        {/* Voice Assistant Toggle Badge */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('veltrix-toggle-voice'))}
          className={`flex items-center space-x-2 px-2.5 py-1 rounded border text-[11px] font-mono transition-all duration-300 cursor-pointer ${
            isSpeaking
              ? 'bg-neon-pink/10 border-neon-pink/30 text-neon-pink hover:bg-neon-pink/20 hover:border-neon-pink/50'
              : isListening
                ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan animate-pulse hover:bg-neon-cyan/20 hover:border-neon-cyan/50'
                : 'bg-white/5 border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
          }`}
          title={isListening ? "Voice active. Click to deactivate voice command system." : "Voice offline. Click to start voice command system."}
        >
          {isSpeaking ? (
            <Volume2 size={13} className="animate-bounce" />
          ) : isListening ? (
            <Mic size={13} className="animate-pulse" />
          ) : (
            <MicOff size={13} />
          )}
          <span>VOICE:</span>
          <span className="font-bold uppercase">
            {isSpeaking ? 'SPEAKING' : isListening ? 'LISTENING' : 'OFFLINE'}
          </span>
        </button>

        {/* Permission Level badge */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-neon-purple/10 border border-neon-purple/20 text-[11px] font-mono text-neon-purple">
          <ShieldCheck size={13} />
          <span>APPROVAL REQUIRED</span>
        </div>
      </div>
    </header>
  );
}
