import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-1 min-w-0">
    {label && (
      <label className="text-xs font-semibold text-black">{label}</label>
    )}
    <input
      className={`px-3 py-2 text-sm rounded-lg border bg-white text-black placeholder-neutral-400 outline-none transition-colors duration-150 min-w-0 w-full box-border
        ${error ? 'border-red-400' : 'border-neutral-300 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200'}
        ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
);

export default Input;
