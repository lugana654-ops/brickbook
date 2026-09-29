"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import DatePickerModal from "@/components/DatePickerModal";
import { useProduction } from "@/context/ProductionContext";

export default function AddProductionPage() {
  const router = useRouter();
  const { addRecord } = useProduction();

  const [brickType, setBrickType] = useState<"4 inch" | "6 inch">("6 inch");
  const [steps, setSteps] = useState<number | "">("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const todayObj = new Date();
  const todayStr = todayObj.toISOString().split("T")[0];
  const [prodDateStr, setProdDateStr] = useState<string>(todayStr);

  const stepCount = typeof steps === "number" && steps > 0 ? steps : 0;
  const multiplier = brickType === "4 inch" ? 8 : 5;
  const brickCount = stepCount * multiplier;

  const currentProdDate = new Date(prodDateStr || todayStr);
  const readyDateObj = new Date(currentProdDate);
  readyDateObj.setDate(readyDateObj.getDate() + 13);

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
    if (!steps || brickCount <= 0) {
      alert("Please enter a valid number of steps.");
      return;
    }

    addRecord({
      brickType,
      stepCount,
      quantity: brickCount,
      productionDate: prodDateStr,
      goodDate: goodDateStr,
    });

    router.push("/production/history");
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
        {/* Brick Type Select */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">
            Brick Type
          </label>
          <select
            value={brickType}
            onChange={(e) => setBrickType(e.target.value as "4 inch" | "6 inch")}
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="6 inch">6 inch</option>
            <option value="4 inch">4 inch</option>
          </select>
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
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
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
            Ready Days: <span className="font-bold">13</span>
          </div>
          <div>
            Ready Date:{" "}
            <span className="font-bold">{formatDate(readyDateObj)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSave}
          className="w-full bg-[#d97706] hover:bg-[#b45309] active:scale-[0.99] text-white font-bold py-3.5 rounded-full shadow-md text-sm transition-all mt-2 cursor-pointer"
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
