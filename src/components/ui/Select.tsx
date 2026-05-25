import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select: React.FC<SelectProps> = ({ label, error, options, className = '', ...props }) => (
  <div className="flex flex-col gap-1 min-w-0">
    {label && (
      <label className="text-xs font-semibold text-black">{label}</label>
    )}
    <select
      className={`h-9 px-3 text-sm rounded-md border bg-white text-neutral-900 outline-none transition-colors min-w-0 w-full box-border cursor-pointer
        ${error ? 'border-red-400' : 'border-neutral-200 focus:border-neutral-400'}
        ${className}`}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
);

export default Select;
