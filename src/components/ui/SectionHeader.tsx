import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description, action, actions, className = '' }) => (
  <div className={`flex items-start justify-between gap-3 flex-wrap min-w-0 ${className}`}>
    <div className="min-w-0">
      <h2 className="m-0 text-sm font-semibold text-black">{title}</h2>
      {description && (
        <p className="m-0 mt-0.5 text-xs text-neutral-500">{description}</p>
      )}
    </div>
    {actions ? (
      <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>
    ) : action ? (
      <div className="flex items-center gap-2 shrink-0">{action}</div>
    ) : null}
  </div>
);

export default SectionHeader;
