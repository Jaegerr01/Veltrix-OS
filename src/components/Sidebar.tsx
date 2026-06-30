'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthGate';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Terminal, DollarSign, Users, Send, RefreshCw,
  FileText, Briefcase, FolderGit2, CheckSquare, BrainCircuit,
  FileCode, ClipboardList, Settings, LogOut, Activity
} from 'lucide-react';
import Image from 'next/image';

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { label: 'Dashboard',       icon: LayoutDashboard, path: '/'               },
      { label: 'Command Center',  icon: Terminal,        path: '/command-center' },
      { label: 'Revenue',         icon: DollarSign,      path: '/revenue'        },
    ],
  },
  {
    label: 'CRM',
    items: [
      { label: 'Leads',           icon: Users,           path: '/leads'          },
      { label: 'Clients',         icon: Briefcase,       path: '/clients'        },
      { label: 'Outreach',        icon: Send,            path: '/outreach'       },
      { label: 'Follow-ups',      icon: RefreshCw,       path: '/follow-ups'     },
      { label: 'Proposals',       icon: FileText,        path: '/proposals'      },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { label: 'Projects',        icon: FolderGit2,      path: '/projects'       },
      { label: 'Tasks',           icon: CheckSquare,     path: '/tasks'          },
      { label: 'Memory',          icon: BrainCircuit,    path: '/memory'         },
      { label: 'Content',         icon: FileCode,        path: '/content'        },
      { label: 'Reports',         icon: ClipboardList,   path: '/reports'        },
      { label: 'System Status',   icon: Activity,        path: '/health'         },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <aside className="w-64 border-r border-white/[0.07] bg-[#06060d]/92 backdrop-blur-3xl flex flex-col h-screen fixed left-0 top-0 z-20" style={{ boxShadow: '1px 0 0 0 rgba(168,85,247,0.06), 4px 0 24px rgba(0,0,0,0.4)' }}>

      {/* Brand Header */}
      <div className="h-16 border-b border-white/[0.06] flex items-center px-4 flex-shrink-0">
        <div className="relative flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-[0_0_18px_rgba(168,85,247,0.35)]">
            <Image
              src="/veltrix-logo.jpeg"
              alt="VELTRIX"
              width={40}
              height={40}
              className="w-full h-full object-cover"
              priority
            />
          </div>
          <p className="text-[9px] font-mono text-neon-purple/60 tracking-[0.2em] uppercase">Command OS</p>
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-6' : ''}>
            {group.label && (
              <p className="px-5 mb-1.5 text-[9px] font-mono font-semibold text-white/20 uppercase tracking-[0.22em]">
                {group.label}
              </p>
            )}
            <div className="px-3 space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <motion.div key={item.path} whileTap={{ scale: 0.97 }} className="relative">
                    <Link
                      href={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 group relative overflow-hidden ${
                        isActive ? 'text-white' : 'text-white/38 hover:text-white/75'
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNavBg"
                          className="absolute inset-0 rounded-xl border border-neon-purple/20"
                          style={{
                            background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(168,85,247,0.05) 100%)',
                            boxShadow: '0 0 12px rgba(168,85,247,0.1), inset 0 1px 0 rgba(255,255,255,0.07)',
                          }}
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <item.icon
                        size={15}
                        className={`flex-shrink-0 relative z-10 transition-colors duration-200 ${
                          isActive ? 'text-neon-purple' : 'text-white/28 group-hover:text-white/55'
                        }`}
                      />
                      <span className="truncate relative z-10 font-sans font-normal">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1 h-1 rounded-full bg-neon-purple relative z-10 flex-shrink-0" />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Settings — always at bottom of nav */}
        <div className="mt-6 px-3">
          <div className="h-px bg-white/[0.05] mb-4 mx-2" />
          <motion.div whileTap={{ scale: 0.97 }}>
            <Link
              href="/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-200 group relative overflow-hidden ${
                pathname === '/settings' ? 'text-white' : 'text-white/38 hover:text-white/75'
              }`}
            >
              {pathname === '/settings' && (
                <motion.div
                  layoutId="activeNavBg"
                  className="absolute inset-0 rounded-xl border border-neon-purple/20"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(168,85,247,0.05) 100%)',
                    boxShadow: '0 0 12px rgba(168,85,247,0.1), inset 0 1px 0 rgba(255,255,255,0.07)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <Settings
                size={15}
                className={`flex-shrink-0 relative z-10 ${pathname === '/settings' ? 'text-neon-purple' : 'text-white/28 group-hover:text-white/55'}`}
              />
              <span className="truncate relative z-10 font-sans font-normal">Settings</span>
              {pathname === '/settings' && (
                <span className="ml-auto w-1 h-1 rounded-full bg-neon-purple relative z-10 flex-shrink-0" />
              )}
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* User Profile */}
      {user && (
        <div className="p-4 border-t border-white/[0.06] space-y-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple/50 to-neon-cyan/50 border border-white/10 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {user.email?.[0]?.toUpperCase() ?? 'B'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white/85 truncate">Barry</p>
              <p className="text-[9px] text-white/28 font-mono truncate">{user.email}</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] hover:border-neon-orange/25 bg-transparent hover:bg-neon-orange/5 text-white/28 hover:text-neon-orange transition-all duration-300 cursor-pointer text-[11px] font-mono"
          >
            <LogOut size={11} />
            <span>Sign Out</span>
          </motion.button>
        </div>
      )}

      {/* System status */}
      <div className="px-5 py-3 border-t border-white/[0.04] flex items-center justify-between flex-shrink-0">
        <span className="text-[9px] font-mono text-white/18 uppercase tracking-[0.18em]">System</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse-glow" />
          <span className="text-[9px] font-mono text-neon-green font-semibold">Online</span>
        </span>
      </div>
    </aside>
  );
}
