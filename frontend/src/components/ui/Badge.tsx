import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

export type BadgeVariant = 'curing' | 'ready' | 'upi' | 'bank' | 'cash' | 'warning' | 'danger';

export interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  icon?: boolean;
  className?: string;
}

export function Badge({
  variant,
  children,
  icon = true,
  className = '',
}: BadgeProps) {
  const badgeStyles: Record<BadgeVariant, string> = {
    curing: 'bg-[#fef3c7] text-[#b45309]',
    ready: 'bg-[#d1fae5] text-[#059669]',
    upi: 'bg-[#e0e7ff] text-[#4f46e5]',
    bank: 'bg-[#f3e8ff] text-[#7e22ce]',
    cash: 'bg-[#e5e7eb] text-[#1f2937]',
    warning: 'bg-amber-100 text-[#b45309]',
    danger: 'bg-red-100 text-[#dc2626]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeStyles[variant]} ${className}`}
    >
      {icon && variant === 'curing' && <Clock size={12} className="stroke-[2.2]" />}
      {icon && variant === 'ready' && <CheckCircle2 size={12} className="stroke-[2.2]" />}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
