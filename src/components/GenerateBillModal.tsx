"use client";

import React, { useState, useEffect } from "react";
import { Calendar, FileText, Share2, Download, X, AlertCircle } from "lucide-react";
import { Customer, Sale, PaymentRecord } from "@/context/CustomersContext";
import { generateCustomerBillPDF, formatDateDMY, formatRate, getRateDisplay } from "@/lib/pdfGenerator";
import DatePickerModal from "@/components/DatePickerModal";

interface GenerateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  sales: Sale[];
  payments: PaymentRecord[];
}

export function getSundayToSaturdayRange(refDate: Date = new Date()) {
  const d = new Date(refDate);
  const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday

  const sunday = new Date(d);
  sunday.setDate(d.getDate() - dayOfWeek);

  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);

  const toYMD = (date: Date) => date.toISOString().split("T")[0];

  return {
    startDate: toYMD(sunday),
    endDate: toYMD(saturday),
  };
}

export function getPreviousSundayToSaturdayRange() {
  const today = new Date();
  const currentSunday = new Date(today);
  currentSunday.setDate(today.getDate() - today.getDay());

  const prevSunday = new Date(currentSunday);
  prevSunday.setDate(currentSunday.getDate() - 7);

  const prevSaturday = new Date(prevSunday);
  prevSaturday.setDate(prevSunday.getDate() + 6);

  const toYMD = (date: Date) => date.toISOString().split("T")[0];

  return {
    startDate: toYMD(prevSunday),
    endDate: toYMD(prevSaturday),
  };
}

export default function GenerateBillModal({
  isOpen,
  onClose,
  customer,
  sales,
  payments,
}: GenerateBillModalProps) {
  const [cycleType, setCycleType] = useState<"current" | "previous" | "custom">("current");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const [activePickerTarget, setActivePickerTarget] = useState<"start" | "end" | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCycleType("current");
      const currentRange = getSundayToSaturdayRange();
      setStartDate(currentRange.startDate);
      setEndDate(currentRange.endDate);
    }
  }, [isOpen]);

  const handleCycleTypeChange = (type: "current" | "previous" | "custom") => {
    setCycleType(type);
    if (type === "current") {
      const range = getSundayToSaturdayRange();
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    } else if (type === "previous") {
      const range = getPreviousSundayToSaturdayRange();
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  };

  if (!isOpen) return null;

  // Filter Sales & Payments within [startDate, endDate] (inclusive)
  const filteredSales = sales.filter(
    (s) => s.date >= startDate && s.date <= endDate
  );

  const filteredPayments = payments.filter(
    (p) => p.date >= startDate && p.date <= endDate
  );

  // Summary Math for Preview (Gross calculations before discount)
  const totalLoads = filteredSales.length;

  const sales4Inch = filteredSales.filter((s) => s.brickType === "4 inch");
  const total4Inch = sales4Inch.reduce((sum, s) => sum + s.brickCount, 0);
  const gross4Inch = sales4Inch.reduce((sum, s) => sum + (s.brickCount * s.ratePerBrick), 0);
  const rateStr4Inch = getRateDisplay(sales4Inch);

  const sales6Inch = filteredSales.filter((s) => s.brickType === "6 inch");
  const total6Inch = sales6Inch.reduce((sum, s) => sum + s.brickCount, 0);
  const gross6Inch = sales6Inch.reduce((sum, s) => sum + (s.brickCount * s.ratePerBrick), 0);
  const rateStr6Inch = getRateDisplay(sales6Inch);

  const totalBricks = total4Inch + total6Inch;
  const grossBill = gross4Inch + gross6Inch;

  const salesAdvancePaid = filteredSales.reduce((sum, s) => sum + s.totalPayment, 0);
  const salesDiscounts = filteredSales.reduce((sum, s) => sum + (s.offerAmount || 0), 0);

  const paymentsCollected = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const paymentDiscounts = filteredPayments.reduce((sum, p) => sum + (p.offerAmount || 0), 0);

  const totalDiscounts = salesDiscounts + paymentDiscounts;
  const totalPaidReceived = salesAdvancePaid + paymentsCollected;

  const netBalanceDue = grossBill - totalPaidReceived - totalDiscounts;

  const hasNoData = filteredSales.length === 0 && filteredPayments.length === 0;

  const handleDownloadPDF = () => {
    generateCustomerBillPDF(customer, filteredSales, filteredPayments, startDate, endDate);
  };

  const handleShareWhatsApp = () => {
    const cleanPhone = customer.phone.replace(/\D/g, "");
    const fullPhone = `${customer.countryCode.replace(/\D/g, "")}${cleanPhone}`;

    const text = `Hi ${customer.name}, here is your BrickBook weekly summary for ${formatDateDMY(startDate)} to ${formatDateDMY(endDate)}:\n\nTotal Bricks: ${totalBricks.toLocaleString("en-IN")}\nGross Bill: Rs. ${grossBill.toLocaleString("en-IN")}\nPaid: Rs. ${totalPaidReceived.toLocaleString("en-IN")}\nPending Balance Due: Rs. ${Math.abs(netBalanceDue).toLocaleString("en-IN")}${netBalanceDue < 0 ? " (Credit)" : ""}\n\nPlease find the detailed PDF bill attached.`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans backdrop-blur-xs">
      <div className="w-full max-w-[390px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 p-5 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#d97706]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-800 leading-tight">
                Generate Weekly Bill
              </h2>
              <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                For {customer.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Cycle Selector */}
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1.5 block">
            Select Billing Cycle (Sun - Sat)
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold select-none">
            <button
              type="button"
              onClick={() => handleCycleTypeChange("current")}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                cycleType === "current"
                  ? "bg-[#213547] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Current Week
            </button>
            <button
              type="button"
              onClick={() => handleCycleTypeChange("previous")}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                cycleType === "previous"
                  ? "bg-[#213547] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Prior Week
            </button>
            <button
              type="button"
              onClick={() => handleCycleTypeChange("custom")}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                cycleType === "custom"
                  ? "bg-[#213547] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {/* Date Inputs (Custom Mode or Display) */}
        {cycleType === "custom" ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                Start Date
              </label>
              <div
                onClick={() => setActivePickerTarget("start")}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between cursor-pointer text-xs font-bold text-slate-700 hover:border-amber-500"
              >
                <span>{formatDateDMY(startDate)}</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                End Date
              </label>
              <div
                onClick={() => setActivePickerTarget("end")}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center justify-between cursor-pointer text-xs font-bold text-slate-700 hover:border-amber-500"
              >
                <span>{formatDateDMY(endDate)}</span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="text-slate-500 font-medium">Selected Period:</span>
            <span className="text-[#213547]">
              {formatDateDMY(startDate)} to {formatDateDMY(endDate)}
            </span>
          </div>
        )}

        {/* 2. Summary Preview Box */}
        {hasNoData ? (
          <div className="bg-amber-50/90 rounded-2xl p-4 border border-amber-200/80 flex flex-col items-center justify-center text-center gap-1.5 my-1">
            <AlertCircle className="w-7 h-7 text-amber-600" />
            <p className="text-xs font-bold text-amber-900">
              No sales or transactions found for this week
            </p>
            <p className="text-[11px] text-amber-800/80">
              Select a different date range or record a new sale for this customer.
            </p>
          </div>
        ) : (
          <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200 flex flex-col gap-2.5 text-xs font-sans shadow-xs">
            {/* Table Header */}
            <div className="grid grid-cols-12 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-2">
              <div className="col-span-3 text-left">ITEM</div>
              <div className="col-span-3 text-center">QTY</div>
              <div className="col-span-3 text-center">RATE</div>
              <div className="col-span-3 text-right">AMOUNT</div>
            </div>

            {/* Rows */}
            {total4Inch > 0 && (
              <div className="grid grid-cols-12 text-xs text-slate-700 items-center py-1.5">
                <div className="col-span-3 text-left font-bold text-slate-800 truncate pr-1">4" Bricks</div>
                <div className="col-span-3 text-center font-medium text-slate-600">{total4Inch.toLocaleString("en-IN")} pcs</div>
                <div className="col-span-3 text-center font-medium text-slate-600">
                  {rateStr4Inch}
                </div>
                <div className="col-span-3 text-right font-extrabold text-[#213547]">
                  Rs. {gross4Inch.toLocaleString("en-IN")}
                </div>
              </div>
            )}

            {total6Inch > 0 && (
              <div className="grid grid-cols-12 text-xs text-slate-700 items-center py-1.5">
                <div className="col-span-3 text-left font-bold text-slate-800 truncate pr-1">6" Bricks</div>
                <div className="col-span-3 text-center font-medium text-slate-600">{total6Inch.toLocaleString("en-IN")} pcs</div>
                <div className="col-span-3 text-center font-medium text-slate-600">
                  {rateStr6Inch}
                </div>
                <div className="col-span-3 text-right font-extrabold text-[#213547]">
                  Rs. {gross6Inch.toLocaleString("en-IN")}
                </div>
              </div>
            )}

            {/* Total Bricks Row with Divider */}
            <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-600">Total Bricks</span>
              <span className="font-bold text-slate-900">{totalBricks.toLocaleString("en-IN")} pcs</span>
            </div>

            {/* Financial Summary */}
            <div className="border-t border-slate-200 pt-2 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-600">Gross Bill</span>
                <span className="font-extrabold text-slate-900">Rs. {grossBill.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-600">Total Paid</span>
                <span className="font-bold text-emerald-600">- Rs. {totalPaidReceived.toLocaleString("en-IN")}</span>
              </div>

              {totalDiscounts > 0 && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Discount</span>
                  <span className="font-bold text-emerald-600">- Rs. {totalDiscounts.toLocaleString("en-IN")}</span>
                </div>
              )}
            </div>

            {/* NET BALANCE DUE HIGHLIGHT */}
            <div className="bg-[#d97706] text-white rounded-2xl p-3.5 flex justify-between items-center font-extrabold text-xs shadow-sm mt-1">
              <span className="tracking-wide">NET BALANCE DUE</span>
              <span className="text-sm font-black">
                Rs. {Math.abs(netBalanceDue).toLocaleString("en-IN")}{netBalanceDue < 0 && " (Credit)"}
              </span>
            </div>
          </div>
        )}

        {/* 3. Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-1">
          <button
            onClick={handleDownloadPDF}
            className="w-full bg-[#d97706] hover:bg-[#b45309] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.98] text-xs sm:text-sm"
          >
            <Download className="w-4.5 h-4.5 text-white shrink-0" />
            <span>Download PDF Statement</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.98] text-xs sm:text-sm"
          >
            <Share2 className="w-4.5 h-4.5 text-white shrink-0" />
            <span>Share Summary via WhatsApp</span>
          </button>
        </div>
      </div>

      {/* Date Pickers for Custom Mode */}
      {activePickerTarget === "start" && (
        <DatePickerModal
          isOpen={true}
          onClose={() => setActivePickerTarget(null)}
          selectedDate={startDate}
          onSelectDate={(newDate) => {
            setStartDate(newDate);
            setActivePickerTarget(null);
          }}
          maxDate={endDate || todayStr}
        />
      )}

      {activePickerTarget === "end" && (
        <DatePickerModal
          isOpen={true}
          onClose={() => setActivePickerTarget(null)}
          selectedDate={endDate}
          onSelectDate={(newDate) => {
            setEndDate(newDate);
            setActivePickerTarget(null);
          }}
          maxDate={todayStr}
        />
      )}
    </div>
  );
}
