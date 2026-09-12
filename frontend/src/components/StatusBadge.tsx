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
        return 'bg-sky-500/10 border-sky-500/30 text-sky-400 shadow-sm';
      case 'IN_PROGRESS':
      case 'REQUESTED':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-sm';
      case 'COMPLETED':
      case 'RECEIVED':
      case 'CONFIRMED':
      case 'RESERVED':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm';
      case 'DISPATCHED':
        return 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-sm';
      case 'CANCELLED':
      case 'RELEASED':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-sm';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-outfit font-bold text-[11px] tracking-wider ${getStatusStyle(
        status
      )}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {status}
    </span>
  );
};
