import React from 'react';
import Badge from '../ui/Badge';

const PriorityBadge: React.FC<{ priority?: 'low' | 'medium' | 'high' }> = ({ priority }) => {
  const variant =
    priority === 'high' ? 'danger'
    : priority === 'medium' ? 'warning'
    : 'neutral';

  return <Badge variant={variant}>{priority ?? 'n/a'}</Badge>;
};

export default PriorityBadge;
