'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, History, ChevronRight } from 'lucide-react';
import Header from '@/components/layout/Header';

export default function ProductionHubPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Dark Navy Header matching Screenshot 2 */}
      <Header title="Production" />

      <div className="px-5 pt-6 pb-6">
        {/* Heading & Subtitle matching Screenshot 2 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-[#1a2b3c]">
            Production Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Add production and check old production records
          </p>
        </div>

        {/* The Two Vertically Stacked Option Cards matching Screenshot 2 */}
        <div className="space-y-4">
          {/* Card 1: Add Today Production */}
          <Link
            href="/production/add"
            id="btn-add-today-production"
            className="flex items-center rounded-3xl bg-white p-5 border border-slate-100 shadow-xs hover:border-amber-200 active:scale-[0.99] transition-all group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fef3c7] mr-4">
              <Plus size={24} className="text-[#d97706] stroke-[2.5]" />
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-base font-bold text-[#1a2b3c] group-hover:text-[#d97706] transition-colors">
                Add Today Production
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                Enter brick production for today or past dates
              </p>
            </div>

            <ChevronRight size={20} className="text-gray-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Card 2: Production History */}
          <Link
            href="/production/history"
            id="btn-production-history"
            className="flex items-center rounded-3xl bg-white p-5 border border-slate-100 shadow-xs hover:border-slate-300 active:scale-[0.99] transition-all group"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e2e8f0]/70 mr-4">
              <History size={22} className="text-[#475569]" />
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-base font-bold text-[#1a2b3c] group-hover:text-[#213547] transition-colors">
                Production History
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                View date-wise brick production records
              </p>
            </div>

            <ChevronRight size={20} className="text-gray-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
