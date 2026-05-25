import React from 'react';

interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

const Label: React.FC<LabelProps> = ({ children, className = '' }) => (
  <span className={`text-xs font-semibold text-black ${className}`}>{children}</span>
);

export default Label;
