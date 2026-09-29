"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import DatePickerModal from "@/components/DatePickerModal";
import { useCustomers, Customer } from "@/context/CustomersContext";
import { useProduction } from "@/context/ProductionContext";
import { formatVehicleNumber } from "@/lib/formatters";

export default function AddSalePage() {
  const router = useRouter();
  const params = useParams();
  const { customers, addSale } = useCustomers();
  const { getAvailableStock } = useProduction();

  const customerId = params?.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const found = customers.find((c) => c.id === customerId);
    if (found) {
      setCustomer(found);
    } else {
      router.replace("/customers");
    }
  }, [customers, customerId, router]);

  const [brickType, setBrickType] = useState<"4 inch" | "6 inch">("6 inch");
  const [brickCount, setBrickCount] = useState<number | "">("");
  const [ratePerBrick, setRatePerBrick] = useState<number | "">("");
  const [totalPayment, setTotalPayment] = useState<number | "">("");
  const [offerAmount, setOfferAmount] = useState<number | "">("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [paymentMode, setPaymentMode] = useState<string>("Cash");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [error, setError] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const [saleDateStr, setSaleDateStr] = useState<string>(todayStr);

  const { totalStock, goodStock } = getAvailableStock(brickType);
  const numCount = typeof brickCount === "number" ? brickCount : 0;
  const isOverGoodStock = numCount > goodStock && numCount <= totalStock;

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parseInt(parts[2])}-${parseInt(parts[1])}-${parts[0]}`;
    }
    return dateStr;
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
    if (!brickCount || brickCount <= 0) {
      setError("Please enter a valid brick count.");
      return;
    }
    if (numCount > totalStock) {
      setError(`Insufficient total yard stock. Total available for ${brickType}: ${totalStock.toLocaleString()} bricks.`);
      return;
    }
    if (!ratePerBrick || ratePerBrick <= 0) {
      setError("Please enter a valid rate per brick.");
      return;
    }
    if (totalPayment === "" || totalPayment < 0) {
      setError("Please enter total payment amount (can be 0).");
      return;
    }
    if (Number(totalPayment) > 0 && paymentMode === "Credit / Bill") {
      setError("Please select Cash, GPay / UPI, or Bank Transfer / Cheque when amount received is greater than 0.");
      return;
    }

    // Vehicle validation: Kerala format KL-07-AB-1234 or KL-07-A-5070
    if (vehicleNumber.trim() !== "") {
      const vRegex = /^[A-Z]{2}-[0-9]{1,2}(-[A-Z]{1,2})?-[0-9]{1,4}$/;
      if (!vRegex.test(vehicleNumber.trim())) {
        setError("Invalid Kerala Vehicle Registration format (e.g. KL-07-AB-1234).");
        return;
      }
    }

    addSale({
      customerId,
      brickType,
      brickCount: Number(brickCount),
      ratePerBrick: Number(ratePerBrick),
      totalPayment: Number(totalPayment),
      offerAmount: Number(offerAmount) || 0,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      date: saleDateStr,
      paymentMode: Number(totalPayment) === 0 ? "Credit / Bill" : paymentMode,
    });

    router.push(`/customers/${customerId}`);
  };

  const count = typeof brickCount === "number" ? brickCount : 0;
  const rate = typeof ratePerBrick === "number" ? ratePerBrick : 0;
  const offer = typeof offerAmount === "number" ? offerAmount : 0;
  const totalBill = count * rate - offer;

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-[#f3f4f6] max-w-[400px] mx-auto flex flex-col relative pb-10 font-sans shadow-xl">
      {/* Header */}
      <div className="bg-[#213547] text-white px-4 py-4 flex items-center justify-between shadow-sm">
        <Link href={`/customers/${customerId}`}>
          <ArrowLeft className="w-5 h-5 text-white cursor-pointer hover:opacity-80 transition-opacity" />
        </Link>
        <h1 className="text-lg font-bold tracking-wide text-white flex-1 text-center pr-5">
          New Sale
        </h1>
      </div>

      {/* Main Form Card */}
      <div className="m-4 p-5 bg-[#fde8d0]/60 rounded-3xl border border-amber-100/50 shadow-sm flex flex-col gap-4">
        
        <div className="text-center mb-1">
          <h2 className="text-base font-bold text-slate-800">For {customer.name}</h2>
        </div>

        {error && <p className="text-xs font-bold text-red-600 text-center bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}

        {/* Stock Info Pill */}
        <div className="bg-white/80 rounded-xl p-2.5 border border-slate-200 text-xs font-semibold flex justify-between items-center text-slate-700">
          <span>Yard Stock Available ({brickType}):</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-900 font-extrabold">{totalStock.toLocaleString()} Total</span>
            <span className="text-emerald-700 font-bold">({goodStock.toLocaleString()} Cured)</span>
          </div>
        </div>

        {isOverGoodStock && (
          <div className="bg-amber-100/90 border border-amber-300 rounded-xl p-3 flex items-start gap-2 text-amber-950 text-xs font-medium">
            <span className="leading-relaxed">
              ⚠️ Note: Dispatching <strong className="font-extrabold">{(numCount - goodStock).toLocaleString()}</strong> bricks still in curing phase ({goodStock.toLocaleString()} fully cured available).
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
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:border-amber-500 transition-colors"
          >
            <span className="text-sm font-medium text-slate-700">
              {formatDate(saleDateStr)}
            </span>
            <Calendar className="w-5 h-5 text-slate-600" />
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
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
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
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Total Payment Input */}
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
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
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
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
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
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
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
            onChange={(e) => setVehicleNumber(formatVehicleNumber(e.target.value))}
            className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-amber-500 uppercase"
          />
        </div>

        {/* Calculation Summary Box */}
        <div className="bg-[#fef3c7]/80 rounded-2xl p-4 flex flex-col gap-1 text-xs font-semibold text-amber-950 mt-1 shadow-sm border border-amber-200">
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
          <div className="flex justify-between items-center text-sm font-extrabold text-amber-950 border-t border-amber-200/60 pt-2 mt-1">
            <span>Total Bill:</span>
            <span>₹{totalBill.toLocaleString()}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSave}
          className="w-full bg-[#d97706] hover:bg-[#b45309] active:scale-[0.99] text-white font-bold py-3.5 rounded-full shadow-md text-sm transition-all mt-2 cursor-pointer"
        >
          Confirm Sale
        </button>
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
