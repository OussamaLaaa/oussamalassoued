import React from 'react';
import Badge from '../ui/Badge';

const PriorityBadge: React.FC<{ priority?: 'low' | 'medium' | 'high' }> = ({ priority }) => {
  const label = priority ?? 'n/a';
  return <Badge variant="neutral">{label}</Badge>;
};

export default PriorityBadge;
