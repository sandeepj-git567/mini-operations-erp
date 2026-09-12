'use client';

import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyle = (s: string) => {
    switch (s.toUpperCase()) {
      case 'ASSIGNED':
      case 'DRAFT':
        return 'bg-cyber-cyan/10 border-cyber-cyan/50 text-cyber-cyan shadow-[0_0_10px_rgba(0,243,255,0.2)]';
      case 'IN_PROGRESS':
      case 'REQUESTED':
        return 'bg-cyber-yellow/10 border-cyber-yellow/50 text-cyber-yellow shadow-[0_0_10px_rgba(255,170,0,0.2)]';
      case 'COMPLETED':
      case 'RECEIVED':
      case 'CONFIRMED':
      case 'RESERVED':
        return 'bg-cyber-green/10 border-cyber-green/50 text-cyber-green shadow-[0_0_10px_rgba(0,255,102,0.2)]';
      case 'DISPATCHED':
        return 'bg-cyber-purple/10 border-cyber-purple/50 text-cyber-purple shadow-[0_0_10px_rgba(157,78,221,0.2)]';
      case 'CANCELLED':
      case 'RELEASED':
        return 'bg-cyber-pink/10 border-cyber-pink/50 text-cyber-pink shadow-[0_0_10px_rgba(255,0,85,0.2)]';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-orbitron font-bold text-[10px] uppercase tracking-wider ${getStatusStyle(
        status
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {status}
    </span>
  );
};
