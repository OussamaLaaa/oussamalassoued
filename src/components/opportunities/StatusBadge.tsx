import React from 'react';
import Badge from '../ui/Badge';

const colorMap: Record<string, string> = {
  prospect: 'text-blue-700 bg-blue-50 border-blue-200',
  contacted: 'text-blue-700 bg-blue-50 border-blue-200',
  qualified: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  customer: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  lost: 'text-neutral-500 bg-neutral-50 border-neutral-200',
};

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const label = status ?? 'unknown';
  const color = colorMap[status ?? ''] ?? '';
  return (
    <Badge variant="neutral" className={color}>
      {label.replace(/_/g, ' ')}
    </Badge>
  );
};

export default StatusBadge;
