import React from 'react';
import { Lead } from '@/lib/types';
import LeadScoreBadge from './LeadScoreBadge';
import StatusBadge from './StatusBadge';
import { ExternalLink, Star, Send, FileText, Trash2, RefreshCw } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
  onScoreLead: (leadId: string) => void;
  onDraftOutreach: (leadId: string) => void;
  onDraftProposal: (leadId: string) => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: Lead['status']) => void;
  onCreateFollowup: (leadId: string) => void;
  scoringMap: Record<string, boolean>;
  draftingMap: Record<string, boolean>;
  proposalMap: Record<string, boolean>;
}

export default function LeadTable({
  leads,
  onScoreLead,
  onDraftOutreach,
  onDraftProposal,
  onDeleteLead,
  onUpdateStatus,
  onCreateFollowup,
  scoringMap,
  draftingMap,
  proposalMap
}: LeadTableProps) {
  return (
    <div className="overflow-x-auto glass-panel border border-white/5 rounded-xl bg-cyber-bg/20">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-cyber-border bg-white/5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            <th className="px-6 py-4 font-bold">Business Name</th>
            <th className="px-6 py-4 font-bold">Industry / Location</th>
            <th className="px-6 py-4 font-bold">Website</th>
            <th className="px-6 py-4 font-bold">AI Score</th>
            <th className="px-6 py-4 font-bold">Status</th>
            <th className="px-6 py-4 font-bold">Source</th>
            <th className="px-6 py-4 font-bold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-white/2 transition">
              {/* Business details */}
              <td className="px-6 py-4 font-sans font-medium text-foreground">
                <div>
                  <span className="font-semibold text-sm block">{lead.business_name}</span>
                  {lead.contact_name && (
                    <span className="text-[10px] text-muted-foreground block">Contact: {lead.contact_name}</span>
                  )}
                  <span className="text-muted-foreground text-[10px] block mt-0.5 line-clamp-1 max-w-xs" title={lead.pain_point}>
                    ⚠️ {lead.pain_point || 'No pain point registered'}
                  </span>
                  {lead.notes && (
                    <span className="text-[9px] text-muted-foreground/60 italic block max-w-xs truncate">Notes: {lead.notes}</span>
                  )}
                </div>
              </td>

              {/* Industry & location */}
              <td className="px-6 py-4 font-sans">
                <div>
                  <span className="block font-medium text-foreground">{lead.industry || 'N/A'}</span>
                  <span className="text-muted-foreground text-[10px] block mt-0.5">{lead.location || 'Remote'}</span>
                </div>
              </td>

              {/* Website */}
              <td className="px-6 py-4 font-mono text-neon-cyan">
                {lead.website ? (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center space-x-1 hover:underline cursor-pointer"
                  >
                    <span>{lead.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </td>

              {/* Lead score */}
              <td className="px-6 py-4">
                {lead.lead_score > 0 ? (
                  <LeadScoreBadge score={lead.lead_score} />
                ) : (
                  <button
                    onClick={() => onScoreLead(lead.id)}
                    disabled={scoringMap[lead.id]}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded bg-neon-purple/10 hover:bg-neon-purple/20 border border-neon-purple/20 text-neon-purple font-mono text-[10px] transition cursor-pointer disabled:opacity-50"
                  >
                    <Star size={11} className={scoringMap[lead.id] ? 'animate-spin' : ''} />
                    <span>{scoringMap[lead.id] ? 'FINDING...' : 'FIND BEST MATCH'}</span>
                  </button>
                )}
              </td>

              {/* Status */}
              <td className="px-6 py-4 space-y-1.5">
                <StatusBadge status={lead.status} />
                <div className="pt-0.5">
                  <select
                    value={lead.status}
                    onChange={(e) => onUpdateStatus(lead.id, e.target.value as any)}
                    className="bg-cyber-bg border border-white/10 rounded text-[9px] text-foreground font-mono focus:outline-none focus:border-neon-cyan p-1 w-full max-w-[120px]"
                  >
                    <option value="New">New</option>
                    <option value="Researched">Researched</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Replied">Replied</option>
                    <option value="Call Booked">Call Booked</option>
                    <option value="Proposal Sent">Proposal Sent</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                  <div className="flex items-center space-x-1 mt-1">
                    <button
                      onClick={() => onUpdateStatus(lead.id, 'Contacted')}
                      title="Mark Contacted"
                      className="px-1 py-0.5 rounded bg-white/5 hover:bg-neon-cyan/20 border border-white/5 text-[7px] font-mono text-muted-foreground hover:text-neon-cyan cursor-pointer"
                    >
                      CNT
                    </button>
                    <button
                      onClick={() => onUpdateStatus(lead.id, 'Replied')}
                      title="Mark Replied"
                      className="px-1 py-0.5 rounded bg-white/5 hover:bg-neon-purple/20 border border-white/5 text-[7px] font-mono text-muted-foreground hover:text-neon-purple cursor-pointer"
                    >
                      REP
                    </button>
                    <button
                      onClick={() => onUpdateStatus(lead.id, 'Call Booked')}
                      title="Mark Call Booked"
                      className="px-1 py-0.5 rounded bg-white/5 hover:bg-neon-pink/20 border border-white/5 text-[7px] font-mono text-muted-foreground hover:text-neon-pink cursor-pointer"
                    >
                      BKD
                    </button>
                    <button
                      onClick={() => onUpdateStatus(lead.id, 'Won')}
                      title="Mark Won"
                      className="px-1 py-0.5 rounded bg-white/5 hover:bg-neon-green/20 border border-white/5 text-[7px] font-mono text-muted-foreground hover:text-neon-green cursor-pointer"
                    >
                      WON
                    </button>
                    <button
                      onClick={() => onUpdateStatus(lead.id, 'Lost')}
                      title="Mark Lost"
                      className="px-1 py-0.5 rounded bg-white/5 hover:bg-red-500/20 border border-white/5 text-[7px] font-mono text-muted-foreground hover:text-red-400 cursor-pointer"
                    >
                      LST
                    </button>
                  </div>
                </div>
              </td>

              {/* Source */}
              <td className="px-6 py-4 text-muted-foreground font-mono uppercase tracking-wider text-[10px]">
                {lead.source || 'Direct'}
              </td>

              {/* CRM Action Buttons */}
              <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                {/* Score Button (if score already exists but user wants to recalculate) */}
                {lead.lead_score > 0 && (
                  <button
                    onClick={() => onScoreLead(lead.id)}
                    disabled={scoringMap[lead.id]}
                    title="Score with AI"
                    className="p-1.5 rounded bg-white/5 hover:bg-neon-purple/10 border border-white/5 hover:border-neon-purple/25 text-muted-foreground hover:text-neon-purple transition cursor-pointer inline-flex items-center"
                  >
                    <Star size={13} className={scoringMap[lead.id] ? 'animate-spin' : ''} />
                  </button>
                )}

                {/* Draft Outreach */}
                <button
                  onClick={() => onDraftOutreach(lead.id)}
                  disabled={draftingMap[lead.id]}
                  title="Generate Outreach"
                  className="px-2 py-1 rounded bg-white/5 hover:bg-neon-cyan/15 border border-white/5 hover:border-neon-cyan/30 text-muted-foreground hover:text-neon-cyan transition font-mono text-[9px] inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <Send size={11} className={draftingMap[lead.id] ? 'animate-pulse' : ''} />
                  <span>{draftingMap[lead.id] ? 'AI OUTREACH...' : 'AI OUTREACH'}</span>
                </button>

                {/* Create Follow-up */}
                <button
                  onClick={() => onCreateFollowup(lead.id)}
                  title="Create Follow-up"
                  className="px-2 py-1 rounded bg-white/5 hover:bg-neon-purple/15 border border-white/5 hover:border-neon-purple/30 text-muted-foreground hover:text-neon-purple transition font-mono text-[9px] inline-flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw size={11} />
                  <span>AI FUP</span>
                </button>

                {/* Draft Proposal */}
                <button
                  onClick={() => onDraftProposal(lead.id)}
                  disabled={proposalMap[lead.id]}
                  title="Generate Proposal"
                  className="px-2 py-1 rounded bg-white/5 hover:bg-neon-green/15 border border-white/5 hover:border-neon-green/30 text-muted-foreground hover:text-neon-green transition font-mono text-[9px] inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <FileText size={11} className={proposalMap[lead.id] ? 'animate-pulse' : ''} />
                  <span>{proposalMap[lead.id] ? 'AI PROP...' : 'AI PROP'}</span>
                </button>

                {/* Delete Lead */}
                <button
                  onClick={() => onDeleteLead(lead.id)}
                  title="Remove Lead"
                  className="p-1 rounded bg-white/5 hover:bg-neon-pink/10 border border-white/5 hover:border-neon-pink/20 text-muted-foreground hover:text-neon-pink transition inline-flex items-center cursor-pointer"
                >
                  <Trash2 size={11} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
