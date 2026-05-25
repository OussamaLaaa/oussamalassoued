import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-12 px-6 text-center min-w-0 ${className}`}>
    {icon && (
      <div className="text-3xl mb-4 leading-none">{icon}</div>
    )}
    <h3 className="m-0 text-base font-semibold text-black">{title}</h3>
    {description && (
      <p className="mt-2 text-sm text-neutral-500 leading-relaxed max-w-xs">{description}</p>
    )}
    {action && (
      <div className="mt-5">{action}</div>
    )}
  </div>
);

export default EmptyState;
