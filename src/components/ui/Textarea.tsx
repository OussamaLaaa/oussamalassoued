import React from 'react';
import { getDirectionalTextProps } from '../../utils/textDirection';
import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  autoDirection?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({ label, error, autoDirection, className = '', ...props }) => {
  let dirProps = { dir: undefined as string | undefined, className: '' };
  
  if (autoDirection) {
    const val = String(props.value || props.defaultValue || '');
    if (val.trim()) {
      dirProps = getDirectionalTextProps(val);
    } else {
      try {
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
      <textarea
        dir={dirProps.dir}
        className={`px-3 py-2 text-sm rounded-md border bg-white text-neutral-900 placeholder-neutral-400 outline-none transition-colors resize-y min-w-0 w-full box-border leading-relaxed
          ${error ? 'border-red-400' : 'border-neutral-200 focus:border-neutral-400'}
          ${dirProps.className} ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
};

export default Textarea;
