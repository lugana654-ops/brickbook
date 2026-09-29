"use client";

import React, { useState, useEffect } from "react";
import { Calendar, X } from "lucide-react";
import { Sale } from "@/context/CustomersContext";
import { useProduction } from "@/context/ProductionContext";
import DatePickerModal from "@/components/DatePickerModal";
import { formatVehicleNumber } from "@/lib/formatters";

interface EditSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onSave: (saleId: string, updatedEntry: Omit<Sale, "id" | "totalBill">) => void;
}

export default function EditSaleModal({
  isOpen,
  onClose,
  sale,
  onSave,
}: EditSaleModalProps) {
  const { getAvailableStock } = useProduction();
  const [brickType, setBrickType] = useState<"4 inch" | "6 inch">("6 inch");
  const [brickCount, setBrickCount] = useState<number | "">("");
  const [ratePerBrick, setRatePerBrick] = useState<number | "">("");
  const [totalPayment, setTotalPayment] = useState<number | "">("");
  const [offerAmount, setOfferAmount] = useState<number | "">("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [saleDateStr, setSaleDateStr] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [error, setError] = useState("");

  const { totalStock, goodStock } = getAvailableStock(brickType);
  const adjustedTotal = totalStock + (sale && sale.brickType === brickType ? sale.brickCount : 0);
  const adjustedGood = goodStock + (sale && sale.brickType === brickType ? sale.brickCount : 0);
  const numCount = typeof brickCount === "number" ? brickCount : 0;
  const isOverGoodStock = numCount > adjustedGood && numCount <= adjustedTotal;

  useEffect(() => {
    if (isOpen && sale) {
      setBrickType(sale.brickType);
      setBrickCount(sale.brickCount);
      setRatePerBrick(sale.ratePerBrick);
      setTotalPayment(sale.totalPayment);
      setOfferAmount(sale.offerAmount || 0);
      setVehicleNumber(formatVehicleNumber(sale.vehicleNumber || ""));
      setSaleDateStr(sale.date);
      setPaymentMode(sale.paymentMode || (sale.totalPayment > 0 ? "Cash" : "Credit / Bill"));
      setError("");
    }
  }, [isOpen, sale]);

  if (!isOpen || !sale) return null;

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parseInt(parts[2])}-${parseInt(parts[1])}-${parts[0]}`;
    }
    return dateStr;
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatVehicleNumber(e.target.value);
    setVehicleNumber(formatted);
  };

  const handleTotalPaymentChange = (val: number | "") => {
    setTotalPayment(val);
    if (val === 0 || val === "") {
      setPaymentMode("Credit / Bill");
    } else if (paymentMode === "Credit / Bill") {
      setPaymentMode("Cash");
    }
  };

  const handleSave = () => {
    if (!brickCount || Number(brickCount) <= 0) {
      setError("Please enter a valid brick count.");
      return;
    }
    if (numCount > adjustedTotal) {
      setError(`Insufficient total yard stock. Available for ${brickType}: ${adjustedTotal.toLocaleString()} bricks.`);
      return;
    }
    if (!ratePerBrick || Number(ratePerBrick) <= 0) {
      setError("Please enter a valid rate per brick.");
      return;
    }
    if (totalPayment === "" || Number(totalPayment) < 0) {
      setError("Please enter total payment amount (can be 0).");
      return;
    }
    if (Number(totalPayment) > 0 && paymentMode === "Credit / Bill") {
      setError("Please select Cash, GPay / UPI, or Bank Transfer / Cheque when amount received is greater than 0.");
      return;
    }

    if (vehicleNumber.trim() !== "") {
      const vRegex = /^[A-Z]{2}-[0-9]{1,2}(-[A-Z]{1,2})?-[0-9]{1,4}$/;
      if (!vRegex.test(vehicleNumber.trim())) {
        setError("Invalid Kerala Vehicle Registration format (e.g. KL-07-AB-1234).");
        return;
      }
    }

    onSave(sale.id, {
      customerId: sale.customerId,
      brickType,
      brickCount: Number(brickCount),
      ratePerBrick: Number(ratePerBrick),
      totalPayment: Number(totalPayment),
      offerAmount: Number(offerAmount) || 0,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      date: saleDateStr,
      paymentMode: Number(totalPayment) === 0 ? "Credit / Bill" : paymentMode,
    });
    onClose();
  };

  const count = typeof brickCount === "number" ? brickCount : 0;
  const rate = typeof ratePerBrick === "number" ? ratePerBrick : 0;
  const offer = typeof offerAmount === "number" ? offerAmount : 0;
  const totalBill = count * rate - offer;
  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-xs">
      <div className="w-full max-w-[370px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 p-5 flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-800">Edit Sale Details</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-xs font-bold text-red-600 text-center bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}

        {isOverGoodStock && (
          <div className="bg-amber-100/90 border border-amber-300 rounded-xl p-3 flex items-start gap-2 text-amber-950 text-xs font-medium">
            <span className="leading-relaxed">
              ⚠️ Note: Dispatching <strong className="font-extrabold">{(numCount - adjustedGood).toLocaleString()}</strong> bricks still in curing phase ({adjustedGood.toLocaleString()} fully cured available).
            </span>
          </div>
        )}

        {/* Brick Type Select */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">
            Brick Type
          </label>
          <select
            value={brickType}
            onChange={(e) => setBrickType(e.target.value as "4 inch" | "6 inch")}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="6 inch">6 inch</option>
            <option value="4 inch">4 inch</option>
          </select>
        </div>

        {/* Date Field */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">
            Sale Date
          </label>
          <div
            onClick={() => setIsPickerOpen(true)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer hover:border-amber-500 transition-colors"
          >
            <span className="text-sm font-medium text-slate-700">
              {formatDate(saleDateStr)}
            </span>
            <Calendar className="w-4 h-4 text-slate-600" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Brick Count Input */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">
              Total Bricks
            </label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={brickCount}
              onChange={(e) =>
                setBrickCount(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Rate per Brick Input */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">
              Rate/Brick (₹)
            </label>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 45.5"
              value={ratePerBrick}
              onChange={(e) =>
                setRatePerBrick(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Amount Received Input */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">
              Amount Received
            </label>
            <input
              type="number"
              placeholder="e.g. 20000"
              value={totalPayment}
              onChange={(e) =>
                handleTotalPaymentChange(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Offer Amount Input */}
          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">
              Discount (Optional)
            </label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={offerAmount}
              onChange={(e) =>
                setOfferAmount(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Payment Mode Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">
            Payment Mode
          </label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="Cash">Cash</option>
            <option value="GPay / UPI">GPay / UPI</option>
            <option value="Bank Transfer / Cheque">Bank Transfer / Cheque</option>
            <option value="Credit / Bill">Credit / Bill</option>
          </select>
        </div>

        {/* Vehicle Number */}
        <div>
          <label className="text-xs font-semibold text-slate-500 mb-1 block">
            Vehicle Number (Optional)
          </label>
          <input
            type="text"
            placeholder="KL-07-AB-1234"
            value={vehicleNumber}
            onChange={handleVehicleChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 uppercase"
          />
        </div>

        {/* Calculation Summary Box */}
        <div className="bg-amber-50/80 rounded-2xl p-3 flex flex-col gap-1 text-xs font-semibold text-amber-950 shadow-xs border border-amber-200/80">
          <div className="flex justify-between items-center text-amber-900/80">
            <span>Subtotal ({count} × {rate}):</span>
            <span>₹{(count * rate).toLocaleString()}</span>
          </div>
          {offer > 0 && (
            <div className="flex justify-between items-center text-green-700">
              <span>Discount:</span>
              <span>- ₹{offer.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-extrabold text-amber-950 border-t border-amber-200/80 pt-1.5 mt-0.5">
            <span>Total Bill:</span>
            <span>₹{totalBill.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-1">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-full font-bold text-slate-600 hover:bg-slate-100 transition-colors text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-full font-bold bg-[#d97706] text-white hover:bg-[#b45309] transition-colors text-xs shadow-md cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>

      <DatePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        selectedDate={saleDateStr}
        onSelectDate={(newDate) => setSaleDateStr(newDate)}
        maxDate={todayStr}
      />
    </div>
  );
}
