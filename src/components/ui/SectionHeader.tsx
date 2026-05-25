import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description, action, style }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    gap: '12px', flexWrap: 'wrap', minWidth: 0,
    ...style,
  }}>
    <div style={{ minWidth: 0 }}>
      <h2 style={{
        margin: 0, fontSize: '14px', fontWeight: 600, color: '#0f172a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {title}
      </h2>
      {description && (
        <p style={{
          margin: '2px 0 0', fontSize: '12px', color: '#64748b',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          {description}
        </p>
      )}
    </div>
    {action && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {action}
      </div>
    )}
  </div>
);

export default SectionHeader;
