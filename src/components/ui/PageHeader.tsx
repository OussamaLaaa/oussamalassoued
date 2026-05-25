import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions, backButton, className = '' }) => (
  <div className={`flex items-start justify-between gap-4 flex-wrap min-w-0 ${className}`}>
    <div className="flex items-center gap-3 min-w-0">
      {backButton}
      <div className="min-w-0">
        <h1 className="m-0 text-lg font-semibold text-black leading-tight">{title}</h1>
        {description && (
          <p className="m-0 mt-0.5 text-xs text-neutral-500 leading-relaxed break-words">
            {description}
          </p>
        )}
      </div>
    </div>
    {actions && (
      <div className="flex items-center gap-2 shrink-0">{actions}</div>
    )}
  </div>
);

export default PageHeader;
