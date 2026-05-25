import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select: React.FC<SelectProps> = ({ label, error, options, style, ...props }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
    {label && (
      <label style={{
        fontSize: '12px', fontWeight: 600, color: '#0f172a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {label}
      </label>
    )}
    <select
      style={{
        padding: '8px 12px',
        fontSize: '13px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: '8px',
        border: error ? '1px solid #dc2626' : '1px solid #e5e7eb',
        background: '#ffffff',
        color: '#0f172a',
        outline: 'none',
        transition: 'border-color 0.15s ease',
        minWidth: 0,
        width: '100%',
        boxSizing: 'border-box',
        cursor: 'pointer',
        ...style,
      }}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && (
      <span style={{ fontSize: '11px', color: '#dc2626' }}>{error}</span>
    )}
  </div>
);

export default Select;
