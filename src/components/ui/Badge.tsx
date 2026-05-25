import React from 'react';

type BadgeVariant = 'neutral' | 'blue' | 'success' | 'warning' | 'danger' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
};

const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className = '' }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 gap-1 text-xs font-semibold rounded-md leading-normal whitespace-nowrap border ${variantStyles[variant]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
