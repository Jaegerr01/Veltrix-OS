'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Terminal, 
  DollarSign, 
  Users, 
  Send, 
  RefreshCw, 
  FileText, 
  Briefcase, 
  FolderGit2, 
  CheckSquare, 
  BrainCircuit, 
  FileCode, 
  ClipboardList, 
  Settings,
  Cpu
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Chat with AI', icon: Terminal, path: '/command-center' },
    { label: 'AI Business Agents', icon: Cpu, path: '/command-center?tab=agents' },
    { label: 'Money & Earnings', icon: DollarSign, path: '/revenue' },
    { label: 'Potential Clients', icon: Users, path: '/leads' },
    { label: 'Outbox (Messages)', icon: Send, path: '/outreach' },
    { label: 'Reminders', icon: RefreshCw, path: '/follow-ups' },
    { label: 'Price Quotes', icon: FileText, path: '/proposals' },
    { label: 'My Clients', icon: Briefcase, path: '/clients' },
    { label: 'Projects Checklist', icon: FolderGit2, path: '/projects' },
    { label: 'To-Do List', icon: CheckSquare, path: '/tasks' },
    { label: 'Saved Notes', icon: BrainCircuit, path: '/memory' },
    { label: 'Social Writer', icon: FileCode, path: '/content' },
    { label: 'Daily Summaries', icon: ClipboardList, path: '/reports' },
    { label: 'Settings', icon: Settings, path: '/settings' }
  ];

  return (
    <aside className="w-64 border-r border-cyber-border bg-cyber-bg/95 flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* Brand Logo Header */}
      <div className="h-16 border-b border-cyber-border flex items-center px-5 space-x-3">
        <img 
          src="/logo.png" 
          alt="VELTRIX Logo" 
          className="h-10 w-10 object-contain select-none" 
        />
        <div className="flex flex-col">
          <span className="text-xs font-bold tracking-widest text-foreground font-mono">VELTRIX</span>
          <span className="text-[9px] font-mono text-neon-purple tracking-widest uppercase font-bold">COMMAND OS</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group font-sans ${
                isActive 
                  ? 'bg-neon-purple/10 text-neon-purple border-l-2 border-neon-purple font-medium shadow-[inset_0_0_8px_rgba(168,85,247,0.05)]' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
            >
              <item.icon 
                size={18} 
                className={`transition-colors duration-200 ${
                  isActive ? 'text-neon-purple' : 'text-muted-foreground group-hover:text-neon-cyan'
                }`} 
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / System Level Indicator */}
      <div className="p-4 border-t border-cyber-border bg-cyber-bg/50">
        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>SYSTEM STATUS</span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse-glow" />
            <span className="text-neon-green">ONLINE</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
