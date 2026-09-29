"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  ChevronDown,
  Check,
  Lock,
  CheckCircle2,
  X,
} from "lucide-react";
import DatePickerModal from "@/components/DatePickerModal";
import { useProduction } from "@/context/ProductionContext";

export default function AddProductionPage() {
  const router = useRouter();
  const { records, addRecord } = useProduction();

  const [brickType, setBrickType] = useState<"4 inch" | "6 inch">("6 inch");
  const [steps, setSteps] = useState<number | "">("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Success Toast Message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Custom Dropdown Menu Open state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split("T")[0];
  const [prodDateStr, setProdDateStr] = useState<string>(todayStr);

  // Auto-dismiss toast after 3.5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Close custom dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Normalize duplicate check against existing production records
  const is6InchLogged = records.some(
    (r) => r.productionDate === prodDateStr && r.brickType === "6 inch"
  );
  const is4InchLogged = records.some(
    (r) => r.productionDate === prodDateStr && r.brickType === "4 inch"
  );

  // Auto-select the available brick type if one is already logged for the chosen date
  useEffect(() => {
    if (brickType === "6 inch" && is6InchLogged && !is4InchLogged) {
      setBrickType("4 inch");
    } else if (brickType === "4 inch" && is4InchLogged && !is6InchLogged) {
      setBrickType("6 inch");
    }
  }, [prodDateStr, is6InchLogged, is4InchLogged]);

  const isDuplicate = records.some(
    (r) => r.productionDate === prodDateStr && r.brickType === brickType
  );

  const stepCount = typeof steps === "number" && steps > 0 ? steps : 0;
  const multiplier = brickType === "4 inch" ? 8 : 5;
  const brickCount = stepCount * multiplier;

  const currentProdDate = new Date(prodDateStr || todayStr);
  const readyDateObj = new Date(currentProdDate);
  readyDateObj.setDate(readyDateObj.getDate() + 14);

  // Build goodDate string (YYYY-MM-DD)
  const goodDateStr = (() => {
    const yyyy = readyDateObj.getFullYear();
    const mm = String(readyDateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(readyDateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const formatDate = (d: Date) =>
    `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`;

  const handleSave = () => {
    if (isDuplicate) {
      alert(`⚠️ ${brickType} production for ${formatDate(currentProdDate)} is already logged!`);
      return;
    }

    if (!steps || brickCount <= 0) {
      alert("Please enter a valid number of steps.");
      return;
    }

    const savedType = brickType;
    const savedQty = brickCount;

    addRecord({
      brickType,
      stepCount,
      quantity: brickCount,
      productionDate: prodDateStr,
      goodDate: goodDateStr,
    });

    // Reset steps input field so form is ready for next entry
    setSteps("");

    // Display clean success toast without redirecting
    setSuccessMessage(`✅ Production for ${savedType} (${savedQty} bricks) saved successfully!`);
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] max-w-[400px] mx-auto flex flex-col relative pb-10 font-sans shadow-xl">
      {/* Header */}
      <div className="bg-[#213547] text-white px-4 py-4 flex items-center justify-between shadow-sm">
        <Link href="/production">
          <ArrowLeft className="w-5 h-5 text-white cursor-pointer hover:opacity-80 transition-opacity" />
        </Link>
        <h1 className="text-lg font-bold tracking-wide text-white flex-1 text-center pr-5">
          Add Production
        </h1>
      </div>

      {/* Main Card */}
      <div className="m-4 p-5 bg-[#fde8d0]/60 rounded-3xl border border-amber-100/50 shadow-sm flex flex-col gap-4">
        {/* Success Toast Notification */}
        {successMessage && (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-950 shadow-sm animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-emerald-900 leading-snug">
                {successMessage}
              </span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-950 text-xs font-bold shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Soft Warm Amber Info Banner for Duplicates */}
        {isDuplicate && (
          <div className="bg-amber-50/95 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 text-amber-950 shadow-xs animate-in fade-in zoom-in-95">
            <Calendar className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-0.5">
              <h4 className="text-xs font-bold text-amber-950 tracking-wide">
                {is6InchLogged && is4InchLogged
                  ? "All Entries Completed"
                  : "Entry Already Added"}
              </h4>
              <p className="text-xs font-medium text-amber-900/90 leading-relaxed">
                {is6InchLogged && is4InchLogged
                  ? "You have already entered both 6 inch and 4 inch production for this date. To add missed production for earlier days, simply change the date below."
                  : `You have already entered the ${brickType} production for ${
                      prodDateStr === todayStr ? "today" : formatDate(currentProdDate)
                    }. To add missed production for earlier days, simply change the date below.`}
              </p>
            </div>
          </div>
        )}

        {/* Refined Single Custom Select Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
            Brick Type
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`w-full bg-white border-2 rounded-2xl px-4 py-3 flex items-center justify-between text-sm font-extrabold text-[#213547] outline-none transition-all cursor-pointer shadow-xs ${
              isDropdownOpen
                ? "border-amber-500 ring-2 ring-amber-500/20"
                : "border-slate-300 hover:border-amber-400"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{brickType}</span>
              {isDuplicate && (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                  <Lock className="w-3 h-3 text-amber-700" />
                  Already Logged
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-600 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180 text-amber-600" : ""
              }`}
            />
          </button>

          {/* Floating Rounded Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-amber-200/90 rounded-2xl p-1.5 shadow-xl flex flex-col gap-1 animate-in fade-in-50 zoom-in-95">
              {/* Option 6 inch */}
              <button
                type="button"
                disabled={is6InchLogged}
                onClick={() => {
                  if (!is6InchLogged) {
                    setBrickType("6 inch");
                    setIsDropdownOpen(false);
                  }
                }}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition-colors ${
                  is6InchLogged
                    ? "text-slate-400 bg-slate-50 cursor-not-allowed opacity-80"
                    : brickType === "6 inch"
                    ? "bg-[#213547] text-white"
                    : "text-[#213547] hover:bg-amber-50 cursor-pointer"
                }`}
              >
                <span>6 inch</span>
                {is6InchLogged ? (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300 shrink-0">
                    <Lock className="w-3 h-3 text-amber-700" />
                    Already Logged
                  </span>
                ) : brickType === "6 inch" ? (
                  <Check className="w-4 h-4 text-amber-400 stroke-[3] shrink-0" />
                ) : null}
              </button>

              {/* Option 4 inch */}
              <button
                type="button"
                disabled={is4InchLogged}
                onClick={() => {
                  if (!is4InchLogged) {
                    setBrickType("4 inch");
                    setIsDropdownOpen(false);
                  }
                }}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition-colors ${
                  is4InchLogged
                    ? "text-slate-400 bg-slate-50 cursor-not-allowed opacity-80"
                    : brickType === "4 inch"
                    ? "bg-[#213547] text-white"
                    : "text-[#213547] hover:bg-amber-50 cursor-pointer"
                }`}
              >
                <span>4 inch</span>
                {is4InchLogged ? (
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300 shrink-0">
                    <Lock className="w-3 h-3 text-amber-700" />
                    Already Logged
                  </span>
                ) : brickType === "4 inch" ? (
                  <Check className="w-4 h-4 text-amber-400 stroke-[3] shrink-0" />
                ) : null}
              </button>
            </div>
          )}
        </div>

        {/* Steps Input */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">
            Number of Steps
          </label>
          <input
            type="number"
            placeholder="Enter steps count"
            value={steps}
            onChange={(e) =>
              setSteps(e.target.value === "" ? "" : Number(e.target.value))
            }
            disabled={isDuplicate}
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100 disabled:text-slate-400"
          />
        </div>

        {/* Production Date Field */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">
            Production Date
          </label>
          <div
            onClick={() => setIsPickerOpen(true)}
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-amber-500 transition-colors"
          >
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700">
                Production Date
              </span>
              <span className="text-xs font-medium text-slate-500">
                {formatDate(currentProdDate)}
              </span>
            </div>
            <Calendar className="w-5 h-5 text-slate-600" />
          </div>
        </div>

        {/* Calculation Summary Box */}
        <div className="bg-[#fef3c7]/80 rounded-2xl p-4 flex flex-col gap-1 text-xs font-semibold text-amber-950 mt-1">
          <div>
            Brick Count:{" "}
            <span className="font-bold text-amber-900">{brickCount}</span>
          </div>
          <div>
            Ready Days: <span className="font-bold">14</span>
          </div>
          <div>
            Ready Date:{" "}
            <span className="font-bold">{formatDate(readyDateObj)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSave}
          disabled={isDuplicate}
          className={`w-full font-bold py-3.5 rounded-full shadow-md text-sm transition-all mt-2 ${
            isDuplicate
              ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
              : "bg-[#d97706] hover:bg-[#b45309] active:scale-[0.99] text-white cursor-pointer"
          }`}
        >
          Save Production
        </button>
      </div>

      {/* Custom Material UI DatePickerModal */}
      <DatePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        selectedDate={prodDateStr}
        onSelectDate={(newDate) => setProdDateStr(newDate)}
        maxDate={todayStr}
      />
    </div>
  );
}
