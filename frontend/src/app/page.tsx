'use client';

import React from 'react';
import { Factory, Package, CheckCircle2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import { useBrickBook } from '@/context/BrickBookContext';

export default function DashboardPage() {
  const { getStockSummary, isLoaded } = useBrickBook();

  // Real-time calculated stock metrics
  const stock4 = getStockSummary('4inch');
  const stock6 = getStockSummary('6inch');

  return (
    <div className="flex flex-col min-h-full">
      {/* Dark Navy Header matching Screenshot 1 */}
      <Header title="BrickBook Dashboard" showMenu={true} />

      <div className="px-5 pt-5 pb-6">
        {/* Welcome Heading & Subtitle matching Screenshot 1 */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-[#1a2b3c]">Welcome to BrickBook</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your live business summary</p>
        </div>

        {/* 6 KPI Cards Grid (2 cols x 3 rows) matching Screenshot 1 */}
        <div className="grid grid-cols-2 gap-3.5" id="kpi-cards-grid">
          {/* Card 1: Today 4inch */}
          <div className="rounded-3xl bg-white p-4.5 border border-slate-100 shadow-xs flex flex-col justify-between min-h-[136px]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fef3c7]">
              <Factory size={22} className="text-[#d97706]" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-[#1a2b3c] block">
                {isLoaded ? stock4.todayProduced : 0}
              </span>
              <span className="text-xs font-medium text-gray-500 mt-0.5 block">Today 4inch</span>
            </div>
          </div>

          {/* Card 2: Today 6inch */}
          <div className="rounded-3xl bg-white p-4.5 border border-slate-100 shadow-xs flex flex-col justify-between min-h-[136px]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fef3c7]">
              <Factory size={22} className="text-[#d97706]" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-[#1a2b3c] block">
                {isLoaded ? stock6.todayProduced : 0}
              </span>
              <span className="text-xs font-medium text-gray-500 mt-0.5 block">Today 6inch</span>
            </div>
          </div>

          {/* Card 3: Total 4inch */}
          <div className="rounded-3xl bg-white p-4.5 border border-slate-100 shadow-xs flex flex-col justify-between min-h-[136px]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fef3c7]">
              <Package size={22} className="text-[#d97706]" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-[#1a2b3c] block">
                {isLoaded ? stock4.totalProduced : 0}
              </span>
              <span className="text-xs font-medium text-gray-500 mt-0.5 block">Total 4inch</span>
            </div>
          </div>

          {/* Card 4: Total 6inch */}
          <div className="rounded-3xl bg-white p-4.5 border border-slate-100 shadow-xs flex flex-col justify-between min-h-[136px]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fef3c7]">
              <Package size={22} className="text-[#d97706]" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-[#1a2b3c] block">
                {isLoaded ? stock6.totalProduced : 0}
              </span>
              <span className="text-xs font-medium text-gray-500 mt-0.5 block">Total 6inch</span>
            </div>
          </div>

          {/* Card 5: Good 4inch (Ready stock) */}
          <div className="rounded-3xl bg-white p-4.5 border border-slate-100 shadow-xs flex flex-col justify-between min-h-[136px]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fef3c7]">
              <CheckCircle2 size={22} className="text-[#d97706]" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-[#1a2b3c] block">
                {isLoaded ? stock4.readyStock : 0}
              </span>
              <span className="text-xs font-medium text-gray-500 mt-0.5 block">Good 4inch</span>
            </div>
          </div>

          {/* Card 6: Good 6inch (Ready stock) */}
          <div className="rounded-3xl bg-white p-4.5 border border-slate-100 shadow-xs flex flex-col justify-between min-h-[136px]">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#fef3c7]">
              <CheckCircle2 size={22} className="text-[#d97706]" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-[#1a2b3c] block">
                {isLoaded ? stock6.readyStock : 0}
              </span>
              <span className="text-xs font-medium text-gray-500 mt-0.5 block">Good 6inch</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
