import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  let colorClasses = 'bg-slate-100 text-slate-800 border-slate-300';

  switch (status) {
    case 'ASSIGNED':
    case 'REQUESTED':
    case 'DRAFT':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'IN_PROGRESS':
    case 'DISPATCHED':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'COMPLETED':
    case 'RECEIVED':
    case 'CONFIRMED':
    case 'RESERVED':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'CANCELLED':
    case 'RELEASED':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}>
      {status}
    </span>
  );
};
