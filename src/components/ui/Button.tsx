import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: '#2563eb',
    color: '#ffffff',
    border: '1px solid transparent',
  },
  secondary: {
    background: '#ffffff',
    color: '#0f172a',
    border: '1px solid #e5e7eb',
  },
  ghost: {
    background: 'transparent',
    color: '#64748b',
    border: '1px solid transparent',
  },
  danger: {
    background: '#dc2626',
    color: '#ffffff',
    border: '1px solid transparent',
  },
  success: {
    background: '#16a34a',
    color: '#ffffff',
    border: '1px solid transparent',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: '4px 10px',
    fontSize: '12px',
    borderRadius: '6px',
  },
  md: {
    padding: '6px 14px',
    fontSize: '13px',
    borderRadius: '8px',
  },
  lg: {
    padding: '10px 20px',
    fontSize: '14px',
    borderRadius: '10px',
  },
};

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  fontWeight: 500,
  lineHeight: 1.4,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  whiteSpace: 'nowrap',
  textDecoration: 'none',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  style,
  children,
  ...props
}) => {
  const [hovered, setHovered] = React.useState(false);

  const hoverOverrides: React.CSSProperties = hovered
    ? variant === 'primary'
      ? { background: '#1d4ed8' }
      : variant === 'danger'
        ? { background: '#b91c1c' }
        : variant === 'success'
          ? { background: '#15803d' }
          : variant === 'secondary'
            ? { background: '#f8fafc' }
            : { background: 'rgba(0,0,0,0.04)' }
    : {};

  return (
    <button
      style={{
        ...baseStyle,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...hoverOverrides,
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
