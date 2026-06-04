'use client';

import React, { useState } from 'react';
import { Proposal } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { FileText, Calendar, DollarSign, ArrowRight, Eye, Check, X, FileEdit } from 'lucide-react';

interface ProposalCardProps {
  proposal: Proposal;
  onUpdateStatus: (id: string, status: Proposal['status']) => void;
  onViewDetails?: (proposal: Proposal) => void;
}

export default function ProposalCard({ proposal, onUpdateStatus, onViewDetails }: ProposalCardProps) {
  const [showFullSolution, setShowFullSolution] = useState(false);

  return (
    <div className="glass-panel border border-white/5 rounded-xl bg-cyber-bg/30 p-6 flex flex-col justify-between hover:border-neon-green/20">
      <div>
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2 text-neon-cyan">
            <FileText size={18} />
            <h4 className="text-sm font-mono font-bold uppercase tracking-wider">{proposal.title}</h4>
          </div>
          <StatusBadge status={proposal.status} />
        </div>

        {/* Financial info */}
        <div className="grid grid-cols-2 gap-4 py-2 border-y border-white/5 my-3 font-mono text-[11px]">
          <div className="flex items-center space-x-1">
            <DollarSign size={13} className="text-neon-green" />
            <span className="text-muted-foreground uppercase">Budget:</span>
            <span className="font-bold text-foreground">${proposal.price.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar size={13} className="text-neon-purple" />
            <span className="text-muted-foreground uppercase">Timeline:</span>
            <span className="font-semibold text-foreground">{proposal.timeline || 'N/A'}</span>
          </div>
        </div>

        {/* Overview of deliverables */}
        <div className="my-3">
          <span className="text-[10px] text-muted-foreground block font-mono uppercase tracking-wider mb-1">Scope Deliverables:</span>
          <div className="flex flex-wrap gap-1.5">
            {proposal.deliverables.map((del, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] text-foreground">
                {del}
              </span>
            ))}
          </div>
        </div>

        {/* Problem statement */}
        {proposal.problem && (
          <div className="my-3 text-xs bg-white/2 p-2.5 rounded border border-white/5">
            <span className="text-[10px] text-neon-pink font-mono uppercase tracking-widest block mb-0.5">Prospect Pain Point:</span>
            <p className="text-muted-foreground select-text">{proposal.problem}</p>
          </div>
        )}

        {/* Solution summary toggle */}
        {proposal.solution && (
          <div className="mt-3">
            <button
              onClick={() => setShowFullSolution(!showFullSolution)}
              className="text-[10px] font-mono text-neon-cyan hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <Eye size={12} />
              <span>{showFullSolution ? 'HIDE DETAILED BLUEPRINT' : 'VIEW DETAILED BLUEPRINT'}</span>
            </button>
            
            {showFullSolution && (
              <div className="mt-2.5 p-3 rounded bg-cyber-bg/80 border border-cyber-border text-xs text-muted-foreground max-h-60 overflow-y-auto whitespace-pre-wrap select-text font-sans">
                {proposal.solution}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex justify-between items-center mt-5 pt-4 border-t border-white/5">
        <div className="text-[9px] font-mono text-muted-foreground">
          CREATED: {new Date(proposal.created_at).toLocaleDateString()}
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Detailed view callback if provided */}
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(proposal)}
              className="p-1.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition cursor-pointer"
              title="Full Screen View"
            >
              <FileEdit size={13} />
            </button>
          )}

          {/* Accept Proposal */}
          {proposal.status !== 'Accepted' && (
            <button
              onClick={() => onUpdateStatus(proposal.id, 'Accepted')}
              className="px-2.5 py-1.5 rounded bg-neon-green/10 hover:bg-neon-green/20 border border-neon-green/20 text-neon-green font-mono text-[10px] transition inline-flex items-center space-x-1 cursor-pointer"
              title="Mark as Accepted"
            >
              <Check size={11} />
              <span>ACCEPT</span>
            </button>
          )}

          {/* Decline Proposal */}
          {['Draft', 'Sent', 'Viewed'].includes(proposal.status) && (
            <button
              onClick={() => onUpdateStatus(proposal.id, 'Rejected')}
              className="px-2.5 py-1.5 rounded bg-neon-pink/10 hover:bg-neon-pink/20 border border-neon-pink/20 text-neon-pink font-mono text-[10px] transition inline-flex items-center space-x-1 cursor-pointer"
              title="Mark as Rejected"
            >
              <X size={11} />
              <span>DECLINE</span>
            </button>
          )}

          {/* Mark Sent */}
          {proposal.status === 'Draft' && (
            <button
              onClick={() => onUpdateStatus(proposal.id, 'Sent')}
              className="px-2.5 py-1.5 rounded bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/20 text-neon-purple font-mono text-[10px] transition inline-flex items-center space-x-1 cursor-pointer"
              title="Send to client"
            >
              <span>SEND</span>
              <ArrowRight size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
