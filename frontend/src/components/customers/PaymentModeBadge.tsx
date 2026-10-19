import React from 'react';
import { PaymentMode } from '@/types';

export interface PaymentModeBadgeProps {
  mode: PaymentMode;
  className?: string;
}

export function PaymentModeBadge({ mode, className = '' }: PaymentModeBadgeProps) {
  const modeStyles: Record<PaymentMode, { bg: string; text: string; label: string }> = {
    CASH: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cash' },
    UPI: { bg: 'bg-[#e0e7ff]', text: 'text-[#4f46e5]', label: 'UPI' },
    BANK: { bg: 'bg-[#f3e8ff]', text: 'text-[#7e22ce]', label: 'Bank Transfer' },
  };

  const current = modeStyles[mode] || modeStyles.CASH;

  return (
    <span
      className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-bold ${current.bg} ${current.text} ${className}`}
    >
      {current.label}
    </span>
  );
}

export default PaymentModeBadge;
