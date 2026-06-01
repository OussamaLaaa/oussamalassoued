import React from 'react';
import { getDirectionalTextProps } from '../utils/textDirection';

export interface DirectionalTextProps {
  text: string;
  as?: React.ElementType;
  className?: string;
  preserveWhitespace?: boolean;
  maxLines?: number;
}

const DirectionalText: React.FC<DirectionalTextProps> = ({
  text,
  as: Component = 'div',
  className = '',
  preserveWhitespace = false,
  maxLines,
}) => {
  const { dir, className: dirClassName } = getDirectionalTextProps(text, className);
  
  const style: React.CSSProperties = {};
  if (preserveWhitespace) {
    style.whiteSpace = 'pre-wrap';
  }
  if (maxLines) {
    style.display = '-webkit-box';
    style.WebkitLineClamp = maxLines;
    style.WebkitBoxOrient = 'vertical';
    style.overflow = 'hidden';
  }

  return (
    <Component 
      dir={dir} 
      className={`${dirClassName} min-w-0 break-words`} 
      style={Object.keys(style).length > 0 ? style : undefined}
    >
      {text}
    </Component>
  );
};

export default DirectionalText;