"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  RotateCcw,
  Search,
  Calendar,
  Package,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import DatePickerModal from "@/components/DatePickerModal";
import { useProduction, ProductionRecord } from "@/context/ProductionContext";

function ProductionHistoryContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") || "";

  const { enrichedRecords, updateRecord, deleteRecord } = useProduction();

  // Sort descending by productionDate (newest first)
  const sortedRecords = [...enrichedRecords].sort((a, b) =>
    b.productionDate.localeCompare(a.productionDate)
  );

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isFilterPickerOpen, setIsFilterPickerOpen] = useState(false);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<ProductionRecord | null>(null);
  const [editSteps, setEditSteps] = useState<number | "">("");
  const [editBrickType, setEditBrickType] = useState<"4 inch" | "6 inch">("6 inch");
  const [editDateStr, setEditDateStr] = useState<string>("");
  const [isEditPickerOpen, setIsEditPickerOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split("T")[0];

  const handleDateSelect = (selectedDate: string) => {
    if (selectedDate) {
      setSearchQuery(selectedDate);
    }
  };

  const handleRefresh = () => {
    setSearchQuery("");
  };

  const startEdit = (item: ProductionRecord) => {
    setEditingRecord(item);
    setEditSteps(item.stepCount);
    setEditBrickType(item.brickType);
    setEditDateStr(item.productionDate);
  };

  const handleSaveEdit = () => {
    if (!editingRecord) return;
    const stepsNum = typeof editSteps === "number" && editSteps > 0 ? editSteps : 0;
    if (stepsNum <= 0) {
      alert("Please enter a valid step count.");
      return;
    }

    const multiplier = editBrickType === "4 inch" ? 8 : 5;
    const quantity = stepsNum * multiplier;

    const prodDate = new Date(editDateStr || todayStr);
    const readyDate = new Date(prodDate);
    readyDate.setDate(readyDate.getDate() + 13);
    const goodDateStr = readyDate.toISOString().split("T")[0];

    updateRecord(editingRecord.id, {
      brickType: editBrickType,
      stepCount: stepsNum,
      quantity,
      productionDate: editDateStr,
      goodDate: goodDateStr,
    });

    setEditingRecord(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this production entry?")) {
      deleteRecord(id);
    }
  };

  // Filter records by search query (date or brick type)
  const filteredRecords = sortedRecords.filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
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
            onClick={() => setIsFilterPickerOpen(true)}
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
          filteredRecords.map((item) => {
            const isSoldOut = item.remainingQuantity === 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {item.brickType}
                      </h3>
                      <p className="text-xs font-medium text-slate-600 mt-0.5">
                        Quantity: <span className="font-bold text-slate-900">{item.quantity.toLocaleString()} Bricks</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                        isSoldOut
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : item.isGood
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isSoldOut ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                      ) : item.isGood ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                      )}
                      {isSoldOut ? "Dispatched" : item.isGood ? "Ready" : `${item.daysRemaining} days left`}
                    </span>

                    <div className="flex items-center gap-1 mt-0.5">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs text-slate-500 font-medium">
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
            );
          })
        )}
      </div>

      {/* DatePickerModal Popup for Filter */}
      <DatePickerModal
        isOpen={isFilterPickerOpen}
        onClose={() => setIsFilterPickerOpen(false)}
        selectedDate={todayStr}
        onSelectDate={handleDateSelect}
      />

      {/* Edit Entry Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-[360px] shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">Edit Production Entry</h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Brick Type</label>
              <select
                value={editBrickType}
                onChange={(e) => setEditBrickType(e.target.value as "4 inch" | "6 inch")}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
              >
                <option value="6 inch">6 inch</option>
                <option value="4 inch">4 inch</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Step Count</label>
              <input
                type="number"
                value={editSteps}
                onChange={(e) => setEditSteps(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Production Date</label>
              <div
                onClick={() => setIsEditPickerOpen(true)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer hover:border-amber-500"
              >
                <span className="text-xs font-semibold text-slate-700">{formatDate(editDateStr)}</span>
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setEditingRecord(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>

          <DatePickerModal
            isOpen={isEditPickerOpen}
            onClose={() => setIsEditPickerOpen(false)}
            selectedDate={editDateStr || todayStr}
            onSelectDate={(d) => setEditDateStr(d)}
            maxDate={todayStr}
          />
        </div>
      )}
    </div>
  );
}

export default function ProductionHistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f4f6] max-w-[400px] mx-auto p-6">Loading...</div>}>
      <ProductionHistoryContent />
    </Suspense>
  );
}
