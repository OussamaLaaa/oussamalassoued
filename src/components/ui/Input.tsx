import React from 'react';
import { getDirectionalTextProps } from '../../utils/textDirection';
import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  autoDirection?: boolean;
}

const Input: React.FC<InputProps> = ({ label, error, autoDirection, className = '', ...props }) => {
  let dirProps = { dir: undefined as string | undefined, className: '' };
  
  if (autoDirection) {
    const val = String(props.value || props.defaultValue || '');
    if (val.trim()) {
      dirProps = getDirectionalTextProps(val);
    } else {
      try {
        // use fallback if empty
        const { language } = usePersonalLanguage();
        dirProps.dir = language === 'ar' ? 'rtl' : 'ltr';
        dirProps.className = language === 'ar' ? 'text-right' : 'text-left';
      } catch (e) {
        dirProps.dir = 'ltr';
        dirProps.className = 'text-left';
      }
    }
  }

  return (
    <div className="flex flex-col gap-1 min-w-0">
      {label && (
        <label className="text-xs font-semibold text-black">{label}</label>
      )}
      <input
        dir={dirProps.dir}
        className={`h-10 px-3 text-sm rounded-lg border bg-white text-neutral-900 placeholder-neutral-400 outline-none transition-colors min-w-0 w-full box-border
          ${error ? 'border-red-400' : 'border-neutral-200 focus:border-neutral-400'}
          ${dirProps.className} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
};

export default Input;
