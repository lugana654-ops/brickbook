"use client";

import React, { useState, useEffect } from "react";
import { Calendar, X } from "lucide-react";
import { PaymentRecord } from "@/context/CustomersContext";
import DatePickerModal from "@/components/DatePickerModal";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  pendingBalance: number;
  onSave: (payment: Omit<PaymentRecord, "id">) => void;
}

const PAYMENT_MODES = [
  "Cash",
  "GPay / UPI",
  "Bank Transfer / Cheque",
  "Other",
];

export default function AddPaymentModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  pendingBalance,
  onSave,
}: AddPaymentModalProps) {
  const [amount, setAmount] = useState<number | "">("");
  const todayStr = new Date().toISOString().split("T")[0];
  const [paymentDateStr, setPaymentDateStr] = useState<string>(todayStr);
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [offerAmount, setOfferAmount] = useState<number | "">("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount(pendingBalance > 0 ? pendingBalance : "");
      setPaymentDateStr(new Date().toISOString().split("T")[0]);
      setPaymentMode("Cash");
      setOfferAmount("");
      setError("");
    }
  }, [isOpen, pendingBalance]);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parseInt(parts[2])}-${parseInt(parts[1])}-${parts[0]}`;
    }
    return dateStr;
  };

  const numericAmount = Number(amount) || 0;
  const numericOffer = Number(offerAmount) || 0;
  const totalDeduction = numericAmount + numericOffer;

  const handleSave = () => {
    if (numericAmount <= 0 && numericOffer <= 0) {
      setError("Please enter a valid payment amount or offer discount.");
      return;
    }

    onSave({
      customerId,
      amount: numericAmount,
      date: paymentDateStr,
      paymentMode,
      offerAmount: numericOffer,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans backdrop-blur-xs">
      <div className="w-full max-w-[350px] bg-[#f7ebe1] rounded-3xl overflow-hidden shadow-2xl border border-amber-900/10 animate-in fade-in zoom-in duration-150 p-5 flex flex-col gap-3.5">
        <div className="flex items-center justify-between border-b border-amber-900/10 pb-2.5">
          <div>
            <h2 className="text-lg font-bold text-amber-950">Collect Payment</h2>
            <p className="text-xs text-amber-900/70">Customer: <span className="font-bold">{customerName}</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-amber-900/60 hover:text-amber-950 hover:bg-amber-900/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="text-xs font-bold text-red-600 text-center">{error}</p>}

        {/* Current Pending Balance Hint */}
        <div className="bg-[#fde8d0] rounded-xl p-2.5 border border-amber-900/10 flex justify-between items-center text-xs">
          <span className="font-semibold text-amber-900/80">Current Pending Due:</span>
          <span className={`font-extrabold ${pendingBalance > 0 ? "text-rose-700" : "text-emerald-700"}`}>
            ₹{pendingBalance.toLocaleString()}
          </span>
        </div>

        {/* Amount Received Input */}
        <div>
          <label className="text-xs font-semibold text-amber-900/70 mb-1 block">
            Amount Received (₹)
          </label>
          <input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full bg-white border border-amber-900/20 rounded-xl px-4 py-2.5 text-sm font-bold text-amber-950 outline-none focus:ring-2 focus:ring-[#d97706]"
          />
        </div>

        {/* Payment Date */}
        <div>
          <label className="text-xs font-semibold text-amber-900/70 mb-1 block">
            Payment Date
          </label>
          <div
            onClick={() => setIsPickerOpen(true)}
            className="w-full bg-white border border-amber-900/20 rounded-xl px-4 py-2.5 flex items-center justify-between cursor-pointer hover:border-[#d97706] transition-colors"
          >
            <span className="text-sm font-medium text-amber-950">
              {formatDate(paymentDateStr)}
            </span>
            <Calendar className="w-4 h-4 text-amber-900/70" />
          </div>
        </div>

        {/* Payment Mode */}
        <div>
          <label className="text-xs font-semibold text-amber-900/70 mb-1 block">
            Payment Mode
          </label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="w-full bg-white border border-amber-900/20 rounded-xl px-4 py-2.5 text-sm font-medium text-amber-950 outline-none focus:ring-2 focus:ring-[#d97706] cursor-pointer"
          >
            {PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        {/* Offer / Discount (Optional) */}
        <div>
          <label className="text-xs font-semibold text-amber-900/70 mb-1 block">
            Offer / Discount (₹)
          </label>
          <input
            type="number"
            placeholder="e.g. 500"
            value={offerAmount}
            onChange={(e) =>
              setOfferAmount(e.target.value === "" ? "" : Number(e.target.value))
            }
            className="w-full bg-white border border-amber-900/20 rounded-xl px-4 py-2.5 text-sm font-medium text-amber-950 outline-none focus:ring-2 focus:ring-[#d97706]"
          />
        </div>

        {/* Total Deduction Summary */}
        {numericOffer > 0 && (
          <div className="bg-[#fef3c7] rounded-xl p-2.5 border border-amber-200 text-xs font-semibold flex justify-between items-center text-amber-950">
            <span>Total Due Reduction:</span>
            <span className="font-extrabold text-emerald-700">₹{totalDeduction.toLocaleString()} (₹{numericAmount.toLocaleString()} + ₹{numericOffer.toLocaleString()} Offer)</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full font-bold text-amber-900 hover:bg-amber-900/10 transition-colors text-xs cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-full font-bold bg-[#d97706] text-white hover:bg-[#b45309] transition-colors text-xs shadow-md cursor-pointer"
          >
            Save Payment
          </button>
        </div>
      </div>

      <DatePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        selectedDate={paymentDateStr}
        onSelectDate={(newDate) => setPaymentDateStr(newDate)}
        maxDate={todayStr}
      />
    </div>
  );
}
