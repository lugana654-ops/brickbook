'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, UserPlus, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import CustomerCard from '@/components/customers/CustomerCard';
import { useBrickBook } from '@/context/BrickBookContext';

export default function CustomersPage() {
  const { customers, addCustomer } = useBrickBook();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Add Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number | string>(0);
  const [formError, setFormError] = useState<string | null>(null);

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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter a customer name.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Please enter a phone number.');
      return;
    }

    const res = addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      place: place.trim() || 'Kerala',
      openingBalance: Number(openingBalance) || 0,
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to add customer.');
      return;
    }

    // Reset & close
    setName('');
    setPhone('');
    setPlace('');
    setOpeningBalance(0);
    setIsAddModalOpen(false);
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
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[360px] overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#213547] px-5 py-4 text-white">
              <div className="flex items-center space-x-2">
                <UserPlus size={18} className="text-[#fcd34d]" />
                <h3 className="font-semibold text-sm">Add New Customer</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-1 text-white/80 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-3.5">
              {formError && (
                <div className="rounded-xl bg-red-50 p-2.5 text-xs font-medium text-red-600">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Customer / Contractor Name *
                </label>
                <input
                  type="text"
                  id="input-customer-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vipin Builders"
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="input-customer-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 9847123456"
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Place / Delivery Site
                </label>
                <input
                  type="text"
                  id="input-customer-place"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  placeholder="e.g. Taliparamba, Kannur"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Opening Balance (₹)
                </label>
                <input
                  type="number"
                  id="input-customer-opening-balance"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-[#111827] focus:border-[#d97706] focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Enter existing unpaid balance or 0 for fresh accounts.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-save-customer"
                  className="w-full rounded-2xl bg-[#d97706] py-3 text-xs font-bold text-white shadow-md hover:bg-[#b45309] active:scale-[0.99]"
                >
                  Save Customer Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
