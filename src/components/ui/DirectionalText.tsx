import React from 'react';
import { detectTextDirection, getDirectionClass } from '../../utils/textDirection';

interface DirectionalTextProps {
  text: string | number | null | undefined;
  className?: string;
  as?: 'span' | 'div';
  preserveWhitespace?: boolean;
  maxLines?: number;
}

export default function DirectionalText({ text, className = '', as: Component = 'span', preserveWhitespace, maxLines }: DirectionalTextProps) {
  const str = String(text ?? '');
  if (!str) return null;
  const dir = detectTextDirection(str);
  const dirClass = getDirectionClass(str);
  const extra = preserveWhitespace ? 'whitespace-pre-wrap' : '';
  const baseClass = `${dirClass} min-w-0 ${extra} ${className}`.trim();

  return (
    <Component
      dir={dir}
      className={baseClass}
      style={maxLines ? { display: '-webkit-box', WebkitLineClamp: maxLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties : undefined}
    >
      {str}
    </Component>
  );
}
