import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-neutral-900 disabled:bg-neutral-200 disabled:text-neutral-400',
  secondary:
    'bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300 hover:text-neutral-900 active:bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200',
  outline:
    'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 active:bg-neutral-100 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200',
  ghost:
    'bg-transparent text-neutral-500 border border-transparent hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200 disabled:text-neutral-400',
  danger:
    'bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:text-red-700 active:bg-red-100 disabled:text-neutral-400 disabled:border-neutral-200',
  success:
    'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100 disabled:text-neutral-400 disabled:border-neutral-200',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-3.5 py-2 text-sm rounded-md',
  lg: 'px-5 py-2.5 text-sm rounded-xl',
};

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center gap-1.5 font-medium leading-tight cursor-pointer transition-all duration-150 select-none whitespace-nowrap';
  return (
    <button
      className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
