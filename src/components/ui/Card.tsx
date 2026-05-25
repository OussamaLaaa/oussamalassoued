import React from 'react';

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
  overflow: 'hidden',
};

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, style, className }) => (
  <div className={className} style={{ ...cardStyle, ...style }}>{children}</div>
);

export const CardHeader: React.FC<CardProps> = ({ children, style }) => (
  <div style={{ padding: '20px 20px 0', ...style }}>{children}</div>
);

export const CardTitle: React.FC<CardProps> = ({ children, style }) => (
  <h3 style={{
    margin: 0, fontSize: '16px', fontWeight: 600, color: '#0f172a',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    ...style,
  }}>{children}</h3>
);

export const CardDescription: React.FC<CardProps> = ({ children, style }) => (
  <p style={{
    margin: '4px 0 0', fontSize: '13px', color: '#64748b', lineHeight: 1.5,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    ...style,
  }}>{children}</p>
);

export const CardContent: React.FC<CardProps> = ({ children, style }) => (
  <div style={{ padding: '20px', ...style }}>{children}</div>
);

export const CardFooter: React.FC<CardProps> = ({ children, style }) => (
  <div style={{
    padding: '12px 20px 20px',
    display: 'flex', alignItems: 'center', gap: '8px',
    ...style,
  }}>{children}</div>
);
