import React from 'react';

interface PersonalOSLogoProps {
  className?: string;
  size?: number;
}

const PersonalOSLogo: React.FC<PersonalOSLogoProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="2" y="2" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <path d="M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z" fill="currentColor" />
  </svg>
);

export default PersonalOSLogo;
