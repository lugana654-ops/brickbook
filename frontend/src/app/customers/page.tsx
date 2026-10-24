'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, UserPlus, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import CustomerCard from '@/components/customers/CustomerCard';
import CustomerModal, { CustomerFormData } from '@/components/customers/CustomerModal';
import { useBrickBook } from '@/context/BrickBookContext';

export default function CustomersPage() {
  const { customers, addCustomer } = useBrickBook();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter customers by name, phone, or place
  const filteredCustomers = customers.filter((cust) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      cust.name.toLowerCase().includes(q) ||
      cust.phone.includes(q) ||
      cust.place.toLowerCase().includes(q)
    );
  });

  const handleAddSubmit = (data: CustomerFormData) => {
    const res = addCustomer({
      name: data.name,
      phone: data.phone,
      place: data.place,
      openingBalance: 0,
    });

    if (!res.success) {
      return { success: false, error: res.error || 'Failed to add customer.' };
    }

    setIsAddModalOpen(false);
    return { success: true };
  };

  return (
    <div className="flex flex-col min-h-full relative">
      {/* Dark Navy Header matching Screenshot 3 */}
      <Header title="Customers" />

      <div className="px-5 pt-4 pb-20 flex-1 flex flex-col">
        {/* Search Bar matching Screenshot 3 */}
        <div className="relative mb-4">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            id="search-customers-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, or place"
            className="w-full rounded-2xl border border-gray-400/80 bg-white py-3.5 pl-10 pr-4 text-xs text-[#111827] placeholder:text-gray-500 shadow-xs focus:border-[#d97706] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Customer List or Empty State */}
        {filteredCustomers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-gray-400 mb-3">
              <Search size={24} />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              {searchQuery ? 'No matching customers' : 'No Customers Yet'}
            </p>
            <p className="text-xs text-gray-400 mt-1 max-w-[240px]">
              {searchQuery
                ? `No customer matches "${searchQuery}"`
                : 'Tap "Add Customer" below to create your first customer ledger account.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((cust) => (
              <CustomerCard key={cust.id} customer={cust} />
            ))}
          </div>
        )}
      </div>

      {/* Amber Floating Action Button matching Screenshot 3 */}
      <div className="fixed bottom-20 left-0 right-0 mx-auto w-full max-w-[400px] px-4 pointer-events-none z-30">
        <div className="flex justify-end pointer-events-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            id="btn-add-customer-fab"
            className="flex items-center space-x-2 rounded-2xl bg-[#d97706] px-5 py-3.5 text-xs font-bold text-white shadow-xl hover:bg-[#b45309] active:scale-95 transition-all"
          >
            <UserPlus size={18} className="stroke-[2.5]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Add Customer Modal */}
      <CustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
      />
    </div>
  );
}
