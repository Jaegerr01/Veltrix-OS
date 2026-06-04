'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, ArrowLeft, Lock, Database, RefreshCw, CheckSquare } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto py-4">
      {/* Back button */}
      <div className="flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center space-x-1.5 text-xs font-mono text-neon-cyan hover:underline cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>BACK TO DASHBOARD</span>
        </Link>
        <span className="text-[10px] font-mono text-muted-foreground uppercase">Last updated: June 2, 2026</span>
      </div>

      {/* Main Glass Panel */}
      <div className="glass-panel p-8 border border-white/5 rounded-xl bg-cyber-bg/30 space-y-8">
        
        {/* Header Block */}
        <div className="flex items-start space-x-4 border-b border-white/5 pb-6">
          <div className="p-3 bg-neon-purple/10 text-neon-purple rounded-xl border border-neon-purple/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
              PRIVACY POLICY
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono text-neon-cyan">
              VELTRIX COMMAND OS DATA GOVERNANCE
            </p>
          </div>
        </div>

        {/* Intro */}
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Welcome to <span className="font-semibold text-foreground">VELTRIX COMMAND OS</span>. We are committed to maintaining the confidentiality and integrity of your corporate information, client logs, and operational pipeline. 
          </p>
          <p>
            This Privacy Policy describes how we handle, process, and protect information when you run the VELTRIX COMMAND OS dashboard, connect database layers (Supabase/LocalStorage), and query AI reasoning services (Gemini API).
          </p>
        </div>

        {/* Key Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          <div className="p-5 bg-white/2 border border-white/5 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-neon-cyan font-mono text-xs font-bold uppercase">
              <Database size={16} />
              <span>1. Data Ownership & Storage</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              VELTRIX operates on a decentralized storage paradigm. Your data (leads, client profiles, revenue metrics, memory vaults, task logs) resides either in your browser's local sandbox (LocalStorage) or is securely written to your private, self-hosted Supabase database. We do not host or store your database credentials.
            </p>
          </div>

          <div className="p-5 bg-white/2 border border-white/5 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-neon-purple font-mono text-xs font-bold uppercase">
              <Lock size={16} />
              <span>2. API Keys & AI Processing</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              To power the Chief of Staff chatbot and autonomous agent routing, queries are processed using Google Gemini API endpoints. Your personal API keys are loaded via secure environment variables or environment configs. AI prompts carry only the contextual facts necessary to execute requested actions (like scoring a lead or drafting outreach).
            </p>
          </div>

          <div className="p-5 bg-white/2 border border-white/5 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-neon-pink font-mono text-xs font-bold uppercase">
              <RefreshCw size={16} />
              <span>3. Control & Purge Mechanisms</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Under our settings panel, you maintain absolute control over database slates. You can trigger a full workspace purge at any time using the "Reset to Clean Slate" option, which instantly removes all local leads, transactions, and system parameters from active memory storage.
            </p>
          </div>

          <div className="p-5 bg-white/2 border border-white/5 rounded-lg space-y-2">
            <div className="flex items-center space-x-2 text-neon-green font-mono text-xs font-bold uppercase">
              <CheckSquare size={16} />
              <span>4. Safety Gates & Outbox</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Outbound dispatches (emails, proposal pitches, automated DMs) utilize a strict verification system. No data is sent to external contacts without explicit user review and manual validation from the Outbox Safety Gate.
            </p>
          </div>

        </div>

        {/* Detailed Sections */}
        <div className="space-y-6 pt-4 border-t border-white/5 text-xs text-muted-foreground">
          
          <div className="space-y-2">
            <h3 className="font-mono font-bold text-foreground uppercase tracking-wider text-xs">
              Information We Process
            </h3>
            <p className="leading-relaxed">
              When configuring your workspace, we read: (a) Business Metadata (revenue targets, catalog packages); (b) CRM Pipelines (business names, locations, contact notes); (c) Earnings Details (setup and recurring fee values); (d) Content Outlines (social media themes). None of this tracking metadata is shared with or processed by VELTRIX servers.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-mono font-bold text-foreground uppercase tracking-wider text-xs">
              Consent & Environmental Configs
            </h3>
            <p className="leading-relaxed">
              By connecting your Supabase project keys and Google Gemini API key to this application instance, you authorize the workspace code to communicate with those respective platforms on your behalf.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-mono font-bold text-foreground uppercase tracking-wider text-xs">
              Contact & Inquiries
            </h3>
            <p className="leading-relaxed">
              For questions regarding the command framework or configuration security, please get in touch with our team at: 
              <span className="text-neon-cyan font-mono block mt-1">security@veltrix.ai</span>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
