import React from 'react';

export const toolbarRoot = 'flex flex-wrap items-center gap-3';
export const toolbarSearch = 'relative min-w-[220px] flex-1';
export const toolbarSearchInput = 'h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400';
export const toolbarSearchIcon = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400';
export const toolbarSelect = 'h-10 text-sm rounded-lg border border-neutral-200 bg-white';
export const toolbarButton = 'h-10';
export const toolbarCount = 'h-10 flex items-center text-sm text-neutral-500 whitespace-nowrap';

export const ToolbarSearch: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Search...' }) => (
  <div className={toolbarSearch}>
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={toolbarSearchIcon}
    >
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={toolbarSearchInput}
    />
  </div>
);
