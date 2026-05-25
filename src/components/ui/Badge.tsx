import React from 'react';

type BadgeVariant = 'neutral' | 'blue' | 'success' | 'warning' | 'danger' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  neutral: {
    background: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
  },
  blue: {
    background: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
  },
  success: {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0',
  },
  warning: {
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a',
  },
  danger: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
  },
  purple: {
    background: '#f3f0ff',
    color: '#6d28d9',
    border: '1px solid #ddd6fe',
  },
};

const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, style }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 8px', gap: '4px',
    fontSize: '11px', fontWeight: 600,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    borderRadius: '6px',
    lineHeight: 1.4,
    whiteSpace: 'nowrap',
    ...variantStyles[variant],
    ...style,
  }}>
    {children}
  </span>
);

export default Badge;
