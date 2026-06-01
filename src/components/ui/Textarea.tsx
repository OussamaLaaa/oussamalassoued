import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, error, className = '', ...props }) => (
  <div className="flex flex-col gap-1 min-w-0">
    {label && (
      <label className="text-xs font-semibold text-black">{label}</label>
    )}
    <textarea
      className={`px-3 py-2 text-sm rounded-md border bg-white text-neutral-900 placeholder-neutral-400 outline-none transition-colors resize-y min-w-0 w-full box-border leading-relaxed
        ${error ? 'border-red-400' : 'border-neutral-200 focus:border-neutral-400'}
        ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
);

export default Textarea;
