import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'white' | 'accent' | 'outlined';
  children: React.ReactNode;
  className?: string;
}

export function Card({
  variant = 'white',
  children,
  className = '',
  ...props
}: CardProps) {
  const variantStyles = {
    white: 'bg-white border-slate-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
    accent: 'bg-[#f7ebe1] border-amber-200/80 shadow-xs',
    outlined: 'bg-white border-slate-200 shadow-none',
  };

  return (
    <div
      className={`rounded-2xl p-4 border transition-all ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
