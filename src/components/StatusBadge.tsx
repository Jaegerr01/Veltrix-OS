import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStyle = () => {
    const s = status.toLowerCase();
    switch (s) {
      // Won / Completed / Active
      case 'won':
      case 'completed':
      case 'active':
      case 'paid':
      case 'approved':
        return 'bg-neon-green/10 text-neon-green border-neon-green/30';
      
      // In Progress / Draft / Expected / Researched
      case 'in progress':
      case 'researched':
      case 'replied':
      case 'draft':
      case 'drafted':
      case 'expected':
      case 'invoiced':
      case 'scheduled':
        return 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/30';
      
      // Pending / Call Booked / Proposal Sent / Discovery / New
      case 'pending':
      case 'new':
      case 'qualified':
      case 'call booked':
      case 'proposal sent':
      case 'discovery':
      case 'requirements':
      case 'design':
      case 'development':
      case 'review':
      case 'revision':
      case 'delivered':
        return 'bg-neon-purple/10 text-neon-purple border-neon-purple/30';
      
      // Urgent / Critical / Blocked / Overdue
      case 'blocked':
      case 'overdue':
      case 'rejected':
      case 'failed':
      case 'needs approval':
      case 'needs revision':
      case 'critical':
      case 'high':
        return 'bg-neon-pink/10 text-neon-pink border-neon-pink/30';

      // Lost / Cancelled / Abandoned / Low
      case 'lost':
      case 'cancelled':
      case 'abandoned':
      case 'skipped':
      case 'inactive':
      case 'low':
      case 'medium':
        return 'bg-white/5 text-muted-foreground border-white/10';
      
      default:
        return 'bg-white/5 text-foreground border-white/10';
    }
  };

  return (
    <span className={`px-2 py-0.5 text-[10px] font-mono border rounded uppercase tracking-wider ${getStyle()}`}>
      {status}
    </span>
  );
}
