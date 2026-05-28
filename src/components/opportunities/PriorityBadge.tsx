import React from 'react';
import Badge from '../ui/Badge';

const variantMap: Record<string, 'neutral' | 'warning' | 'danger'> = {
  high: 'warning',
  medium: 'neutral',
  low: 'neutral',
};

const colorMap: Record<string, string> = {
  high: 'text-amber-700 bg-amber-50 border-amber-200',
  medium: 'text-neutral-700 bg-neutral-100 border-neutral-300',
  low: 'text-neutral-500 bg-neutral-50 border-neutral-200',
};

const PriorityBadge: React.FC<{ priority?: 'low' | 'medium' | 'high' }> = ({ priority }) => {
  const label = priority ?? 'n/a';
  const variant = variantMap[priority ?? ''] ?? 'neutral';
  const color = colorMap[priority ?? ''] ?? '';
  return (
    <Badge variant={variant} className={color}>
      {label}
    </Badge>
  );
};

export default PriorityBadge;
