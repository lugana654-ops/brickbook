"use client";

import Link from "next/link";
import {
  Home,
  Factory,
  Users,
  Plus,
  History,
  ChevronRight,
} from "lucide-react";

export default function ProductionPage() {
  return (
    <div className="bg-[#e5e7eb] min-h-screen">
      {/* Root Mobile Wrapper */}
      <div className="min-h-screen bg-[#f3f4f6] max-w-[400px] mx-auto flex flex-col relative pb-28 font-sans shadow-xl">
        {/* Header Bar */}
        <div className="bg-[#213547] text-white px-4 py-4 flex items-center justify-center shadow-sm">
          <h1 className="text-lg font-bold tracking-wide text-white">
            Production
          </h1>
        </div>

        {/* Content Area */}
        <main className="flex-1">
          {/* Page Header Section */}
          <div className="px-5 pt-5 pb-3">
            <h2 className="text-2xl font-extrabold text-[#1a2b3c] tracking-tight">
              Production Management
            </h2>
            <p className="text-xs font-medium text-slate-400 mt-1">
              Add production and check old production records
            </p>
          </div>

          {/* Option Cards Stack (Vertical Stack) */}
          <div className="flex flex-col gap-4 px-4 mt-3">
            {/* Card 1: Add Today Production */}
            <Link
              href="/production/add"
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#fef3c7] flex items-center justify-center flex-shrink-0">
                  <Plus className="w-6 h-6 text-[#d97706]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    Add Today Production
                  </h3>
                  <p className="text-xs font-medium text-slate-400 mt-0.5">
                    Enter brick production for today or past dates
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
            </Link>

            {/* Card 2: Production History */}
            <Link
              href="/production/history"
              className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200/70 flex items-center justify-center flex-shrink-0">
                  <History className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827]">
                    Production History
                  </h3>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    View date-wise brick production records
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" />
            </Link>
          </div>
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] bg-[#fde8d0] py-3 px-6 flex justify-around items-center z-50 border-t border-orange-100">
          {/* Dashboard Tab */}
          <Link
            href="/"
            className="flex flex-col items-center gap-1 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
          >
            <Home className="w-5 h-5 text-[#78350f]" />
            <span className="text-xs font-medium text-[#78350f]">
              Dashboard
            </span>
          </Link>

          {/* Production Tab (Active) */}
          <Link
            href="/production"
            className="flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className="bg-[#fcd34d]/60 rounded-full px-5 py-1 flex items-center justify-center">
              <Factory className="w-5 h-5 text-[#451a03]" />
            </div>
            <span className="text-xs font-bold text-[#451a03]">
              Production
            </span>
          </Link>

          {/* Customers Tab */}
          <Link
            href="/customers"
            className="flex flex-col items-center gap-1 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
          >
            <Users className="w-5 h-5 text-[#78350f]" />
            <span className="text-xs font-medium text-[#78350f]">
              Customers
            </span>
          </Link>
        </nav>
      </div>
    </div>
  );
}
