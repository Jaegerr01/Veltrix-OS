'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, MoreHorizontal, Bell } from 'lucide-react';
import { Task } from '@/lib/types';

interface Props {
  task: Task;
  onApprove: () => void;
  onDismiss: () => void;
}

export default function PendingCard({ task, onApprove, onDismiss }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative p-4 rounded-2xl bg-[rgba(13,13,22,0.6)] border border-white/[0.07] hover:border-white/[0.12] transition-all duration-200 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-xl bg-neon-purple/10">
          <Cpu size={13} className="text-neon-purple" />
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="p-1 rounded-lg hover:bg-white/5 text-white/25 hover:text-white/60 transition-colors cursor-pointer"
        >
          <MoreHorizontal size={14} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="absolute top-10 right-3 z-20 bg-[#0e0e1a] border border-white/[0.1] rounded-xl py-1 min-w-[110px] shadow-xl"
            >
              <button
                onClick={() => { onApprove(); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-[11px] font-mono text-neon-green hover:bg-neon-green/8 transition-colors cursor-pointer"
              >
                Approve
              </button>
              <button
                onClick={() => { onDismiss(); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-[11px] font-mono text-white/40 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div>
        <h4 className="text-[13px] font-semibold text-white leading-snug line-clamp-2">{task.title}</h4>
        {task.description && (
          <p className="text-[11px] text-white/35 mt-1 line-clamp-2 font-sans">{task.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-[10px] font-mono text-white/28 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
          {task.due_date ?? 'Today'}
        </span>
        <Bell size={11} className="text-white/20" />
      </div>
    </div>
  );
}
