import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: string;
  trendPositive?: boolean;
  borderAccent?: 'purple' | 'cyan' | 'pink' | 'green' | 'orange';
}

export default function DashboardCard({
  title,
  value,
  icon,
  description,
  trend,
  trendPositive = true,
  borderAccent = 'purple'
}: DashboardCardProps) {
  const getBorderColor = () => {
    switch (borderAccent) {
      case 'cyan': return 'hover:border-neon-cyan/40';
      case 'pink': return 'hover:border-neon-pink/40';
      case 'green': return 'hover:border-neon-green/40';
      case 'orange': return 'hover:border-neon-orange/40';
      default: return 'hover:border-neon-purple/40';
    }
  };

  const getIconColor = () => {
    switch (borderAccent) {
      case 'cyan': return 'text-neon-cyan bg-neon-cyan/10';
      case 'pink': return 'text-neon-pink bg-neon-pink/10';
      case 'green': return 'text-neon-green bg-neon-green/10';
      case 'orange': return 'text-neon-orange bg-neon-orange/10';
      default: return 'text-neon-purple bg-neon-purple/10';
    }
  };

  return (
    <div className={`p-6 glass-panel border border-white/5 rounded-xl flex flex-col justify-between h-36 ${getBorderColor()}`}>
      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider block mb-1">{title}</span>
          <span className="text-2xl font-bold font-mono tracking-tight">{value}</span>
        </div>
        <div className={`p-2.5 rounded-lg ${getIconColor()}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs mt-2">
        <span className="text-muted-foreground truncate max-w-[70%]">{description}</span>
        {trend && (
          <span className={`font-mono font-medium ${trendPositive ? 'text-neon-green' : 'text-neon-pink'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
