import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

interface ApprovalBadgeProps {
  status: 'Pending Approval' | 'Approved' | 'Rejected' | string;
}

export default function ApprovalBadge({ status }: ApprovalBadgeProps) {
  const getStyle = () => {
    switch (status) {
      case 'Approved':
        return {
          classes: 'bg-neon-green/10 text-neon-green border-neon-green/30',
          icon: ShieldCheck
        };
      case 'Rejected':
        return {
          classes: 'bg-neon-pink/10 text-neon-pink border-neon-pink/30',
          icon: ShieldAlert
        };
      case 'Pending Approval':
      default:
        return {
          classes: 'bg-neon-purple/10 text-neon-purple border-neon-purple/30 animate-pulse-glow',
          icon: Shield
        };
    }
  };

  const config = getStyle();
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-mono border rounded uppercase tracking-wider ${config.classes}`}>
      <Icon size={12} />
      <span>{status}</span>
    </span>
  );
}
