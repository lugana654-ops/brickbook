'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ShieldCheck, ArrowRight, User } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useBrickBook } from '@/context/BrickBookContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, updateUser } = useBrickBook();

  const [name, setName] = useState(user.name);
  const [plantName, setPlantName] = useState(user.plantName);
  const [location, setLocation] = useState(user.location);
  const [phone, setPhone] = useState(user.phone);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({
      name,
      plantName,
      location,
      phone,
      isLoggedIn: true,
    });
    router.push('/');
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Plant Settings" showBack={true} backHref="/" />

      <div className="px-5 py-6 space-y-5">
        <div className="rounded-3xl bg-white p-6 border border-slate-100 shadow-xs text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fef3c7] text-[#d97706] mb-3">
            <Building2 size={28} />
          </div>
          <h2 className="text-base font-bold text-[#1a2b3c]">Manufacturing Unit Profile</h2>
          <p className="text-xs text-gray-500 mt-1">
            Configure your brick yard branding for PDF statements and invoices.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-xs space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Plant / Enterprise Name
              </label>
              <input
                type="text"
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-[#111827] focus:border-[#d97706] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Manager / Operator Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Plant Location / District
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Official Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-[#d97706] py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#b45309] active:scale-[0.99]"
          >
            <span>Save Profile &amp; Continue</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
