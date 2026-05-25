import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: { value: string; positive: boolean };
  style?: React.CSSProperties;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, style }) => (
  <div style={{
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    minWidth: 0,
    ...style,
  }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 500,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          {label}
        </p>
        <p style={{
          margin: '4px 0 0', fontSize: '24px', fontWeight: 700,
          color: '#0f172a', lineHeight: 1.1,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          {value}
        </p>
        {trend && (
          <p style={{
            margin: '4px 0 0', fontSize: '12px',
            color: trend.positive ? '#16a34a' : '#dc2626',
            fontWeight: 500,
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </div>
      {icon && (
        <div style={{ fontSize: '24px', lineHeight: 1, flexShrink: 0 }}>{icon}</div>
      )}
    </div>
  </div>
);

export default StatCard;
