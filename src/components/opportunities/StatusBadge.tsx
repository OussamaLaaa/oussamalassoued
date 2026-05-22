import React from 'react';

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const bg =
    status === 'prospect'
      ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
      : status === 'contacted'
      ? 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]'
      : status === 'qualified'
      ? 'bg-[#dcfce7] text-[#166534] border-[#bbf7d0]'
      : status === 'customer'
      ? 'bg-[#e0e7ff] text-[#3730a3] border-[#c7d2fe]'
      : status === 'lost'
      ? 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]'
      : 'bg-[#f1f5f9] text-[#334155] border-[#cbd5e1]';

  return <span className={`inline-flex items-center px-2 py-1 rounded text-xs border ${bg}`}>{status ?? 'unknown'}</span>;
};

export default StatusBadge;
