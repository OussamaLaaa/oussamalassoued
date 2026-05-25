import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-white border border-neutral-200 rounded-xl ${className}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`px-5 pt-5 ${className}`}>{children}</div>
);

export const CardTitle: React.FC<CardProps> = ({ children, className = '' }) => (
  <h3 className={`m-0 text-base font-semibold text-black ${className}`}>{children}</h3>
);

export const CardDescription: React.FC<CardProps> = ({ children, className = '' }) => (
  <p className={`m-0 mt-1 text-xs text-neutral-500 leading-relaxed ${className}`}>
    {children}
  </p>
);

export const CardContent: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

export const CardFooter: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`px-5 pb-5 flex items-center gap-2 ${className}`}>{children}</div>
);
