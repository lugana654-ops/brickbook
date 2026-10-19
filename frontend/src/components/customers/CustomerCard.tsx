import React from 'react';
import Link from 'next/link';
import { User, Phone, MapPin, ChevronRight } from 'lucide-react';
import { Customer } from '@/types';

export interface CustomerCardProps {
  customer: Customer;
}

export function CustomerCard({ customer }: CustomerCardProps) {
  const balance =
    typeof customer.currentBalance === 'number' && !isNaN(customer.currentBalance)
      ? customer.currentBalance
      : Number(customer.openingBalance) || 0;
  const isSettled = balance === 0;
  const hasDue = balance > 0;

  return (
    <Link
      href={`/customers/${customer.id}`}
      className="flex items-center justify-between rounded-3xl bg-white p-4.5 border border-slate-100 shadow-xs hover:border-amber-200 active:scale-[0.99] transition-all group"
    >
      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fef3c7] text-[#d97706]">
          <User size={20} />
        </div>

        <div className="min-w-0 flex-1 pr-2">
          <h3 className="text-sm font-bold text-[#1a2b3c] truncate group-hover:text-[#d97706] transition-colors">
            {customer.name}
          </h3>
          <div className="flex items-center text-xs text-gray-500 space-x-2 mt-0.5 truncate">
            {customer.phone && (
              <span className="flex items-center">
                <Phone size={12} className="mr-1 text-gray-400" />
                {customer.phone}
              </span>
            )}
            {customer.phone && customer.place && <span>•</span>}
            {customer.place && (
              <span className="flex items-center truncate">
                <MapPin size={12} className="mr-1 text-gray-400" />
                {customer.place}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
            {isSettled ? 'Settled' : 'Balance Due'}
          </p>
          <p
            className={`text-xs font-bold ${
              isSettled
                ? 'text-[#059669]'
                : hasDue
                ? 'text-[#d97706]'
                : 'text-gray-800'
            }`}
          >
            ₹ {balance.toLocaleString('en-IN')}
          </p>
        </div>
        <ChevronRight size={18} className="text-gray-400 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}

export default CustomerCard;
