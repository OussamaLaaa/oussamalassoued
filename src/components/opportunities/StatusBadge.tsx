import React from 'react';
import Badge from '../ui/Badge';

const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  return <Badge variant="neutral">{status ?? 'unknown'}</Badge>;
};

export default StatusBadge;
