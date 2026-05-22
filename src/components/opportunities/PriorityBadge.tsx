import React from 'react';

const PriorityBadge: React.FC<{ priority?: 'low' | 'medium' | 'high' }> = ({ priority }) => {
  const cls =
    priority === 'high'
      ? 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]'
      : priority === 'medium'
      ? 'bg-[#fef3c7] text-[#92400e] border-[#fde68a]'
      : 'bg-[#f1f5f9] text-[#334155] border-[#cbd5e1]';
  return <span className={`inline-flex items-center px-2 py-1 rounded text-xs border ${cls}`}>{priority ?? 'n/a'}</span>;
};

export default PriorityBadge;
