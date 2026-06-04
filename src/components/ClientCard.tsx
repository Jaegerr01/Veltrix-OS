import React from 'react';
import { Client } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { Briefcase, Mail, Phone, ExternalLink, DollarSign, Calendar } from 'lucide-react';

interface ClientCardProps {
  client: Client;
}

export default function ClientCard({ client }: ClientCardProps) {
  return (
    <div className="glass-panel border border-white/5 rounded-xl bg-cyber-bg/30 p-5 flex flex-col justify-between hover:border-neon-cyan/20">
      <div>
        {/* Name Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2 text-neon-cyan">
            <Briefcase size={16} />
            <h4 className="text-sm font-semibold text-foreground truncate max-w-[150px]">{client.business_name}</h4>
          </div>
          <StatusBadge status={client.status} />
        </div>

        {/* Contact info */}
        <div className="space-y-1 text-[11px] text-muted-foreground my-3 font-sans">
          {client.contact_name && <p className="font-semibold text-foreground">Contact: {client.contact_name}</p>}
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center space-x-1 hover:text-foreground">
              <Mail size={11} />
              <span className="truncate">{client.email}</span>
            </a>
          )}
          {client.phone && (
            <div className="flex items-center space-x-1">
              <Phone size={11} />
              <span>{client.phone}</span>
            </div>
          )}
          {client.website && (
            <a
              href={client.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1 hover:text-neon-cyan font-mono text-[10px]"
            >
              <ExternalLink size={11} />
              <span className="truncate">{client.website.replace(/^https?:\/\/(www\.)?/, '')}</span>
            </a>
          )}
        </div>

        {/* Purchased deliverables */}
        <div className="my-2 p-2 bg-white/2 rounded border border-white/5 text-xs text-foreground font-sans">
          <span className="text-[9px] text-muted-foreground block uppercase font-mono tracking-wider">Service Purchased:</span>
          <span className="font-medium">{client.service_purchased || 'Technology Integrations'}</span>
        </div>
      </div>

      {/* Finance totals footer */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5 mt-4 font-mono text-[11px]">
        <div className="p-2 bg-neon-green/5 border border-neon-green/10 rounded">
          <span className="text-[9px] text-muted-foreground block uppercase">Total value</span>
          <div className="flex items-center text-neon-green font-bold">
            <DollarSign size={11} />
            <span>{client.total_value.toLocaleString()}</span>
          </div>
        </div>
        <div className="p-2 bg-neon-purple/5 border border-neon-purple/10 rounded">
          <span className="text-[9px] text-muted-foreground block uppercase">Monthly Retainer</span>
          <div className="flex items-center text-neon-purple font-bold">
            <DollarSign size={11} />
            <span>{client.monthly_retainer > 0 ? `${client.monthly_retainer}/mo` : '$0'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
