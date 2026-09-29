"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RotateCcw,
  Search,
  Calendar,
  Package,
  CheckCircle2,
  Clock,
} from "lucide-react";
import DatePickerModal from "@/components/DatePickerModal";
import { useProduction } from "@/context/ProductionContext";

export default function ProductionHistoryPage() {
  const { enrichedRecords } = useProduction();

  // Sort descending by productionDate (newest first)
  const sortedRecords = [...enrichedRecords].sort((a, b) =>
    b.productionDate.localeCompare(a.productionDate)
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split("T")[0];

  const handleDateSelect = (selectedDate: string) => {
    if (selectedDate) {
      const [year, month, day] = selectedDate.split("-");
      setSearchQuery(`${parseInt(day)}-${parseInt(month)}-${year}`);
    }
  };

  const handleRefresh = () => {
    setSearchQuery("");
  };

  // Filter records by search query (date or brick type)
  const filteredRecords = sortedRecords.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    // productionDate is YYYY-MM-DD; also match the formatted D-M-YYYY display
    const [yyyy, mm, dd] = r.productionDate.split("-");
    const displayDate = `${parseInt(dd)}-${parseInt(mm)}-${yyyy}`;
    return (
      r.brickType.toLowerCase().includes(q) ||
      r.productionDate.includes(q) ||
      displayDate.includes(q)
    );
  });

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parseInt(parts[2])}-${parseInt(parts[1])}-${parts[0]}`;
    }
    return dateStr;
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] max-w-[400px] mx-auto flex flex-col relative font-sans shadow-xl">
      {/* Header */}
      <div className="bg-[#213547] text-white px-4 py-4 flex items-center justify-between shadow-sm">
        <Link href="/production">
          <ArrowLeft className="w-5 h-5 text-white cursor-pointer hover:opacity-80 transition-opacity" />
        </Link>
        <h1 className="text-lg font-bold tracking-wide text-white flex-1 text-center pl-6">
          Production History
        </h1>
        <button
          onClick={handleRefresh}
          aria-label="Clear filter"
          className="hover:opacity-80 transition-opacity cursor-pointer"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Search & Filter Bar Section */}
      <div className="p-4 flex flex-col gap-2">
        <div className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm relative">
          <Search className="w-5 h-5 text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search date or brick type"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400 pr-8"
          />
          <button
            type="button"
            onClick={() => setIsPickerOpen(true)}
            aria-label="Open date picker"
            className="shrink-0 flex items-center justify-center text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center justify-between px-1 mt-1">
          <p className="text-xs font-semibold text-slate-500">
            Records: {filteredRecords.length}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-amber-700 font-semibold hover:underline cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Records List Display */}
      <div className="flex-1 px-4 pb-10 flex flex-col gap-3">
        {filteredRecords.length === 0 ? (
          <div className="flex-1 flex items-center justify-center min-h-[300px] text-center px-6">
            <p className="text-sm font-semibold text-slate-500">
              {searchQuery
                ? "No records match your search."
                : "No production records yet. Add one!"}
            </p>
          </div>
        ) : (
          filteredRecords.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-100/80 flex items-center justify-center">
                    <Package className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {item.brickType}
                    </h3>
                    <p className="text-xs font-semibold text-amber-800">
                      {item.quantity} Bricks
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      {item.stepCount} steps
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                    item.isGood
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {item.isGood ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                  )}
                  {item.isGood ? "Ready" : `${item.daysRemaining} days left`}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-xs text-slate-500 font-medium">
                <div>
                  Prod Date:{" "}
                  <span className="font-semibold text-slate-700">
                    {formatDate(item.productionDate)}
                  </span>
                </div>
                <div>
                  Ready Date:{" "}
                  <span className="font-semibold text-slate-700">
                    {formatDate(item.goodDate)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DatePickerModal Popup */}
      <DatePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        selectedDate={todayStr}
        onSelectDate={handleDateSelect}
      />
    </div>
  );
}
