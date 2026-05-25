import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  backButton?: React.ReactNode;
  style?: React.CSSProperties;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions, backButton, style }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '16px', flexWrap: 'wrap', minWidth: 0,
    ...style,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
      {backButton}
      <div style={{ minWidth: 0 }}>
        <h1 style={{
          margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          lineHeight: 1.3,
        }}>
          {title}
        </h1>
        {description && (
          <p style={{
            margin: '2px 0 0', fontSize: '12px', color: '#64748b',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: 1.4, wordBreak: 'break-word',
          }}>
            {description}
          </p>
        )}
      </div>
    </div>
    {actions && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {actions}
      </div>
    )}
  </div>
);

export default PageHeader;
