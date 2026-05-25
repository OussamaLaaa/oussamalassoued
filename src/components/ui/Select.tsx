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
      className={`px-3 py-2 text-sm rounded-lg border bg-white text-black outline-none transition-colors duration-150 min-w-0 w-full box-border cursor-pointer
        ${error ? 'border-red-400' : 'border-neutral-300 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200'}
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
