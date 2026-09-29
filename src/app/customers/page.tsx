"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  Factory,
  Users,
  Search,
  UserPlus,
  MapPin,
  Phone,
  ChevronRight,
} from "lucide-react";
import { useCustomers, Customer } from "@/context/CustomersContext";
import CustomerModal from "@/components/CustomerModal";

export default function CustomersPage() {
  const router = useRouter();
  const { customers, addCustomer } = useCustomers();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.place.toLowerCase().includes(q)
    );
  });

  const handleSaveCustomer = (entry: Omit<Customer, "id">) => {
    const newId = addCustomer(entry);
    setIsModalOpen(false);
    router.push(`/customers/${newId}`);
  };

  return (
    <div className="bg-[#e5e7eb] min-h-screen">
      {/* Root Mobile Wrapper */}
      <div className="min-h-screen bg-[#f3f4f6] max-w-[400px] mx-auto flex flex-col relative pb-28 font-sans shadow-xl">
        {/* Header Bar */}
        <div className="bg-[#213547] text-white px-4 py-4 flex items-center justify-center shadow-sm">
          <h1 className="text-lg font-bold tracking-wide text-white">
            Customers
          </h1>
        </div>

        {/* Content Area */}
        <main className="flex-1 flex flex-col">
          {/* Search Bar Section */}
          <div className="p-4 bg-white shadow-sm border-b border-slate-200">
            <div className="w-full bg-[#f3f4f6] rounded-2xl px-4 py-3 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder=""
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none pr-2"
              />
            </div>
          </div>

          {/* Customers List */}
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            {filteredCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center min-h-[300px]">
                <p className="text-sm font-semibold text-slate-500">
                  {searchQuery
                    ? "No customers found."
                    : "No customers yet. Add one!"}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredCustomers.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/customers/${customer.id}`}
                    className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all cursor-pointer active:scale-[0.98] w-full"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#fde8d0]/60 border border-amber-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 text-[#d97706]" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-base font-bold text-[#111827]">
                          {customer.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-[11px] font-medium text-slate-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {customer.countryCode} {customer.phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {customer.place}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Floating Add Customer Button (positioned above bottom nav) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="absolute bottom-24 right-4 bg-[#d97706] text-white p-4 rounded-full shadow-lg hover:bg-[#b45309] transition-all flex items-center justify-center cursor-pointer z-40 active:scale-95"
          aria-label="Add Customer"
        >
          <UserPlus className="w-6 h-6" />
        </button>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] bg-[#fde8d0] py-3 px-6 flex justify-around items-center z-50 border-t border-orange-100">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
          >
            <Home className="w-5 h-5 text-[#78350f]" />
            <span className="text-xs font-medium text-[#78350f]">
              Dashboard
            </span>
          </Link>

          <Link
            href="/production"
            className="flex flex-col items-center gap-1 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
          >
            <Factory className="w-5 h-5 text-[#78350f]" />
            <span className="text-xs font-medium text-[#78350f]">
              Production
            </span>
          </Link>

          <Link
            href="/customers"
            className="flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className="bg-[#fcd34d]/60 rounded-full px-5 py-1 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#451a03]" />
            </div>
            <span className="text-xs font-bold text-[#451a03]">
              Customers
            </span>
          </Link>
        </nav>
      </div>

      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
      />
    </div>
  );
}
