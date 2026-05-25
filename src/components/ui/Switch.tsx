import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, className = '' }) => (
  <label className={`flex items-center gap-2 cursor-pointer select-none ${className}`}>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-300
        ${checked ? 'bg-black' : 'bg-neutral-300'}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200
          ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
    {label && (
      <span className="text-sm text-black leading-tight">{label}</span>
    )}
  </label>
);

export default Switch;
