"use client";

import Link from "next/link";
import {
  MoreVertical,
  Factory,
  Package,
  CheckCircle2,
  Home,
  Users,
} from "lucide-react";
import { useProduction } from "@/context/ProductionContext";

export default function DashboardPage() {
  const { stats } = useProduction();

  const metricCards = [
    {
      id: "today-4inch",
      icon: <Factory className="w-5 h-5 text-[#d97706] fill-[#d97706]" />,
      value: stats.today4inch,
      label: "Today 4inch",
    },
    {
      id: "today-6inch",
      icon: <Factory className="w-5 h-5 text-[#d97706] fill-[#d97706]" />,
      value: stats.today6inch,
      label: "Today 6inch",
    },
    {
      id: "total-4inch",
      icon: <Package className="w-5 h-5 text-[#d97706] fill-[#d97706]" />,
      value: stats.total4inch,
      label: "Total 4inch",
      subtext: `Curing: ${stats.curing4inch.toLocaleString()}`,
    },
    {
      id: "total-6inch",
      icon: <Package className="w-5 h-5 text-[#d97706] fill-[#d97706]" />,
      value: stats.total6inch,
      label: "Total 6inch",
      subtext: `Curing: ${stats.curing6inch.toLocaleString()}`,
    },
    {
      id: "good-4inch",
      icon: <CheckCircle2 className="w-5 h-5 text-[#d97706] fill-[#d97706]" />,
      value: stats.good4inch,
      label: "Good 4inch",
      subtext: "Ready to dispatch",
    },
    {
      id: "good-6inch",
      icon: <CheckCircle2 className="w-5 h-5 text-[#d97706] fill-[#d97706]" />,
      value: stats.good6inch,
      label: "Good 6inch",
      subtext: "Ready to dispatch",
    },
  ];

  return (
    <div className="bg-[#e5e7eb] min-h-screen">
      {/* Root Mobile Wrapper */}
      <div className="min-h-screen bg-[#f3f4f6] max-w-[400px] mx-auto flex flex-col relative pb-28 font-sans shadow-xl">
        {/* Header Bar */}
        <div className="bg-[#213547] text-white px-4 py-4 flex items-center justify-between shadow-sm">
          <MoreVertical className="w-5 h-5 text-slate-200 cursor-pointer" />
          <h1 className="text-lg font-bold tracking-wide text-white flex-1 text-center pr-2">
            BrickBook Dashboard
          </h1>
          {/* spacer to balance the left icon */}
          <div className="w-5 h-5" />
        </div>

        {/* Content Area */}
        <main className="flex-1">
          {/* Welcome Text Section */}
          <div className="px-5 pt-5 pb-2">
            <h2 className="text-2xl font-extrabold text-[#1a2b3c] tracking-tight">
              Welcome to BrickBook
            </h2>
            <p className="text-xs font-medium text-slate-400 mt-1">
              Your live business summary
            </p>
          </div>

          {/* Metrics Cards Grid (2x3 Grid) */}
          <div className="grid grid-cols-2 gap-4 px-4 mt-3">
            {metricCards.map((card) => (
              <div
                key={card.id}
                id={`card-${card.id}`}
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-[155px]"
              >
                <div className="w-10 h-10 rounded-full bg-[#fef3c7] flex items-center justify-center mb-1">
                  {card.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-extrabold text-[#111827] my-0.5">
                    {card.value.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {card.label}
                  </span>
                  {card.subtext && (
                    <span className="text-[10px] font-semibold text-amber-700 mt-0.5">
                      {card.subtext}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] bg-[#fde8d0] py-3 px-6 flex justify-around items-center z-50 border-t border-orange-100">
          {/* Dashboard Tab (Active) */}
          <Link
            href="/"
            className="flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className="bg-[#fcd34d]/60 rounded-full px-5 py-1 flex items-center justify-center">
              <Home className="w-5 h-5 text-[#451a03] fill-[#451a03]" />
            </div>
            <span className="text-xs font-bold text-[#451a03]">
              Dashboard
            </span>
          </Link>

          {/* Production Tab */}
          <Link
            href="/production"
            className="flex flex-col items-center gap-1 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
          >
            <Factory className="w-5 h-5 text-[#78350f]" />
            <span className="text-xs font-medium text-[#78350f]">
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
