import React from 'react';

interface CheckboxProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ label, checked, onChange, className = '' }) => (
  <label className={`flex items-center gap-2 cursor-pointer select-none ${className}`}>
    <div className="relative flex items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <div className={`w-4 h-4 rounded border transition-colors duration-150 flex items-center justify-center
        ${checked ? 'bg-black border-black' : 'bg-white border-neutral-300'}
        peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-neutral-300`}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </div>
    {label && (
      <span className="text-sm text-black leading-tight">{label}</span>
    )}
  </label>
);

export default Checkbox;
