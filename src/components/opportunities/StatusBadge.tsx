import React from 'react';
import Badge from '../ui/Badge';

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  const variant =
    status === 'prospect' ? 'warning'
    : status === 'contacted' ? 'blue'
    : status === 'qualified' ? 'success'
    : status === 'customer' ? 'purple'
    : status === 'lost' ? 'danger'
    : 'neutral';

  return <Badge variant={variant}>{status ?? 'unknown'}</Badge>;
};

export default StatusBadge;
