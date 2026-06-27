'use client';

import React from 'react';
import { Plus, Search, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

const PAGE_TITLES: Record<string, string> = {
  '/command-center': 'Command Center',
  '/revenue':        'Revenue',
  '/leads':          'Leads',
  '/outreach':       'Outreach',
  '/follow-ups':     'Follow-ups',
  '/proposals':      'Proposals',
  '/clients':        'Clients',
  '/projects':       'Projects',
  '/tasks':          'Tasks',
  '/memory':         'Memory',
  '/content':        'Content',
  '/reports':        'Reports',
  '/settings':       'Settings',
};


export default function Topbar() {
  const pathname = usePathname();

  const isHome   = pathname === '/';
  const pageTitle = PAGE_TITLES[pathname] ?? 'VELTRIX';

  return (
    <header className="h-16 border-b border-white/[0.06] bg-[#08080f]/80 backdrop-blur-2xl flex items-center px-8 fixed top-0 right-0 left-64 z-10 gap-4">

      {/* Left: greeting on home, title elsewhere */}
      <div className="flex-1 min-w-0">
        {isHome ? (
          <>
            <h1 className="text-[16px] font-bold text-white tracking-tight leading-snug">Welcome Back!</h1>
          </>
        ) : (
          <h1 className="text-[14px] font-bold text-white tracking-wide truncate">{pageTitle}</h1>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* + Create */}
        <Link href="/command-center">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-neon-purple/12 border border-neon-purple/25 hover:bg-neon-purple/22 text-neon-purple text-[11px] font-mono font-bold transition-all duration-200 cursor-pointer"
          >
            <Plus size={12} />
            <span>Create</span>
          </motion.div>
        </Link>

        {/* Search */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 rounded-xl border border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/35 hover:text-white/70 transition-all duration-200 cursor-pointer"
        >
          <Search size={13} />
        </motion.button>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 rounded-xl border border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-white/35 hover:text-white/70 transition-all duration-200 cursor-pointer relative"
        >
          <Bell size={13} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-neon-pink shadow-[0_0_6px_rgba(236,72,153,0.6)]" />
        </motion.button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-neon-cyan flex items-center justify-center text-[11px] font-bold text-white shadow-[0_0_14px_rgba(168,85,247,0.35)] cursor-pointer select-none flex-shrink-0">
          B
        </div>
      </div>
    </header>
  );
}
