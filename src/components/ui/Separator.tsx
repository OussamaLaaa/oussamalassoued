import React from 'react';

interface SeparatorProps {
  className?: string;
}

const Separator: React.FC<SeparatorProps> = ({ className = '' }) => (
  <hr className={`border-t border-neutral-200 my-0 ${className}`} />
);

export default Separator;
