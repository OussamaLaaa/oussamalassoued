import React from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, style }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '48px 24px', textAlign: 'center',
    minWidth: 0,
    ...style,
  }}>
    {icon && (
      <div style={{ fontSize: '36px', marginBottom: '16px', lineHeight: 1 }}>
        {icon}
      </div>
    )}
    <h3 style={{
      margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {title}
    </h3>
    {description && (
      <p style={{
        margin: '8px 0 0', fontSize: '13px', color: '#64748b',
        lineHeight: 1.5, maxWidth: '320px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {description}
      </p>
    )}
    {action && (
      <div style={{ marginTop: '20px' }}>{action}</div>
    )}
  </div>
);

export default EmptyState;
