"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Phone,
  Package,
  Receipt,
  Car,
  Edit2,
  Trash2,
  PhoneCall,
  PlusCircle,
  Wallet,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  useCustomers,
  Customer,
  Sale,
  PaymentRecord,
} from "@/context/CustomersContext";
import CustomerModal from "@/components/CustomerModal";
import EditSaleModal from "@/components/EditSaleModal";
import AddPaymentModal from "@/components/AddPaymentModal";
import GenerateBillModal from "@/components/GenerateBillModal";

export default function CustomerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const {
    customers,
    deleteCustomer,
    updateCustomer,
    updateSale,
    getCustomerSales,
    addPayment,
    getCustomerPayments,
  } = useCustomers();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [activeTab, setActiveTab] = useState<"sales" | "balance">("sales");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSaleToEdit, setSelectedSaleToEdit] = useState<Sale | null>(null);
  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [isGenerateBillModalOpen, setIsGenerateBillModalOpen] = useState(false);

  const customerId = params?.id as string;

  useEffect(() => {
    const found = customers.find((c) => c.id === customerId);
    if (found) {
      setCustomer(found);
      setSales(getCustomerSales(customerId));
    } else {
      router.replace("/customers");
    }
  }, [customers, customerId, getCustomerSales, router]);

  if (!customer) return null;

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteCustomer(customer.id);
      router.push("/customers");
    }
  };

  const handleEditSave = (entry: Omit<Customer, "id">) => {
    updateCustomer(customer.id, entry);
    setIsEditModalOpen(false);
  };

  const handleOpenEditSale = (sale: Sale) => {
    setSelectedSaleToEdit(sale);
    setIsEditSaleModalOpen(true);
  };

  const handleSaveSale = (
    saleId: string,
    updatedEntry: Omit<Sale, "id" | "totalBill">
  ) => {
    updateSale(saleId, updatedEntry);
    setSales(getCustomerSales(customerId));
  };

  const handleSavePayment = (payment: Omit<PaymentRecord, "id">) => {
    addPayment(payment);
  };

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parseInt(parts[2])}-${parseInt(parts[1])}-${parts[0]}`;
    }
    return dateStr;
  };

  // ─────────────────────────────────────────────
  // Balance Calculations & Ledger
  // ─────────────────────────────────────────────
  const customerPayments = getCustomerPayments(customerId);

  const totalBillAmount = sales.reduce((sum, s) => sum + s.totalBill, 0);
  const totalAdvanceFromSales = sales.reduce(
    (sum, s) => sum + s.totalPayment,
    0
  );
  const totalCollectedPayments = customerPayments.reduce(
    (sum, p) => sum + p.amount + (p.offerAmount || 0),
    0
  );
  const totalPaidAmount = totalAdvanceFromSales + totalCollectedPayments;
  const outstandingBalance = totalBillAmount - totalPaidAmount;

  // Helper for Payment Mode pill badges
  const getPaymentModeBadgeClass = (mode?: string, amount: number = 0) => {
    const m = mode || (amount > 0 ? "Cash" : "Credit / Bill");
    if (m === "Credit / Bill" || amount === 0) {
      return "bg-amber-100 text-amber-900 border border-amber-300/60";
    }
    if (m.includes("GPay") || m.includes("UPI")) {
      return "bg-indigo-100 text-indigo-900 border border-indigo-300/60";
    }
    if (m.includes("Bank") || m.includes("Cheque")) {
      return "bg-purple-100 text-purple-900 border border-purple-300/60";
    }
    return "bg-emerald-100 text-emerald-900 border border-emerald-300/60";
  };

  // Build Chronological Ledger
  const rawTransactions: Array<{
    id: string;
    date: string;
    type: "SALE_ADVANCE" | "PAYMENT_COLLECTION";
    amount: number;
    offerAmount?: number;
    billAmount: number;
    loadBalanceDue: number;
    paymentMode: string;
    notes?: string;
    title: string;
  }> = [];

  sales.forEach((s) => {
    const loadBalanceDue = s.totalBill - s.totalPayment;
    const mode = s.paymentMode || (s.totalPayment > 0 ? "Cash" : "Credit / Bill");
    rawTransactions.push({
      id: `sale-${s.id}`,
      date: s.date,
      type: "SALE_ADVANCE",
      amount: s.totalPayment,
      billAmount: s.totalBill,
      loadBalanceDue,
      paymentMode: mode,
      title: `${s.brickType} (${s.brickCount} Bricks)`,
      notes: s.vehicleNumber ? `Vehicle: ${s.vehicleNumber}` : undefined,
    });
  });

  customerPayments.forEach((p) => {
    rawTransactions.push({
      id: `pay-${p.id}`,
      date: p.date,
      type: "PAYMENT_COLLECTION",
      amount: p.amount,
      offerAmount: p.offerAmount || 0,
      billAmount: 0,
      loadBalanceDue: 0,
      paymentMode: p.paymentMode || "Cash",
      title: "Payment Received",
      notes: p.notes,
    });
  });

  // Sort descending by date for UI presentation
  const displayLedger = rawTransactions.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-[#f8fafc] flex flex-col relative font-sans shadow-xl overflow-x-hidden">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[#213547] text-white px-4 py-4 flex items-center justify-between shadow-md select-none">
        <Link
          href="/customers"
          className="p-1.5 hover:bg-white/10 rounded-full transition-colors active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-white cursor-pointer" />
        </Link>
        <h1 className="text-base sm:text-lg font-bold tracking-wide text-white flex-1 text-center truncate px-2">
          {customer.name}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDelete}
            className="p-1.5 cursor-pointer hover:bg-red-900/50 rounded-full transition-colors active:scale-95"
            aria-label="Delete Customer"
          >
            <Trash2 className="w-5 h-5 text-red-400" />
          </button>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="p-4 pt-4 relative z-10 bg-white border-b border-slate-200/60">
        <div className="bg-[#f7ebe1] rounded-3xl p-4 sm:p-5 shadow-sm border border-amber-900/10 flex flex-col items-center text-center relative max-w-full">
          <div className="w-16 h-16 rounded-full bg-[#fde8d0] border-[3px] border-[#213547] shadow-sm flex items-center justify-center mb-2 shrink-0">
            <span className="text-2xl font-bold text-[#d97706]">
              {customer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#213547] mt-1 truncate max-w-full">
            {customer.name}
          </h2>

          <div className="flex flex-col items-center justify-center gap-1.5 mt-3 text-xs sm:text-sm font-semibold text-amber-950/80 w-full px-2">
            <span className="flex items-center gap-1.5 truncate max-w-full">
              <Phone className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="truncate">
                {customer.countryCode} {customer.phone}
              </span>
            </span>
            <span className="flex items-center gap-1.5 truncate max-w-full">
              <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
              <span className="truncate">{customer.place}</span>
            </span>
          </div>

          <div className="flex items-center justify-center gap-2 sm:gap-3 w-full mt-4">
            <a
              href={`tel:${customer.countryCode}${customer.phone}`}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#213547] text-white py-2.5 px-3 rounded-full font-bold text-xs sm:text-sm shadow-sm hover:bg-[#1a2a38] transition-colors active:scale-95 truncate min-h-[44px]"
            >
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span className="truncate">Call Customer</span>
            </a>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-white text-[#213547] border border-[#213547]/20 py-2.5 px-3 rounded-full font-bold text-xs sm:text-sm shadow-sm hover:bg-slate-50 transition-colors cursor-pointer active:scale-95 truncate min-h-[44px]"
            >
              <Edit2 className="w-4 h-4 shrink-0" />
              <span className="truncate">Edit Details</span>
            </button>
          </div>

          <div className="w-full mt-3 pt-3 border-t border-amber-900/10">
            <button
              onClick={() => setIsGenerateBillModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-[#d97706] hover:bg-[#b45309] text-white py-2.5 px-4 rounded-full font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer active:scale-95 border border-amber-500/20"
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Generate Weekly Bill (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 pt-4 flex-1 flex flex-col pb-36 bg-[#f8fafc]">
        {/* Toggle Tabs */}
        <div className="flex bg-slate-200/80 p-1 rounded-2xl mb-4 shadow-xs select-none">
          <button
            onClick={() => setActiveTab("sales")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "sales"
                ? "bg-[#213547] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sales History ({sales.length})
          </button>
          <button
            onClick={() => setActiveTab("balance")}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "balance"
                ? "bg-[#213547] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Balance History
          </button>
        </div>

        {/* TAB 1: Sales History */}
        {activeTab === "sales" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
                Sales Orders
              </h3>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full shrink-0">
                {sales.length} Entries
              </span>
            </div>

            {sales.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center mt-2">
                <Receipt className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-500">
                  No sales entries for this customer yet.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sales
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((sale) => {
                    const mode = sale.paymentMode || (sale.totalPayment > 0 ? "Cash" : "Credit / Bill");
                    return (
                      <div
                        key={sale.id}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-3 max-w-full"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-amber-700" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                                {sale.brickType}
                              </h4>
                              <p className="text-xs font-semibold text-amber-800 truncate">
                                {sale.brickCount} Bricks
                              </p>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5 shrink-0">
                            <div className="text-right">
                              <span className="block text-sm sm:text-base font-extrabold text-slate-800">
                                ₹{sale.totalBill.toLocaleString()}
                              </span>
                              <span className="text-[10px] sm:text-xs font-bold text-slate-400 block">
                                {formatDate(sale.date)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleOpenEditSale(sale)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                              title="Edit Sale"
                              aria-label="Edit Sale"
                            >
                              <Edit2 className="w-4 h-4 text-slate-400 hover:text-amber-700" />
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-xs border border-slate-100 gap-1">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[10px] font-medium text-slate-400 truncate">
                              Rate/Brick
                            </span>
                            <span className="font-bold text-slate-700 text-xs sm:text-sm truncate">
                              ₹{sale.ratePerBrick}
                            </span>
                          </div>
                          <div className="flex flex-col text-center min-w-0 flex-1 items-center">
                            <span className="text-[10px] font-medium text-slate-400 truncate">
                              Paid
                            </span>
                            <span className="font-bold text-slate-700 text-xs sm:text-sm truncate">
                              ₹{sale.totalPayment}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full mt-0.5 inline-block truncate max-w-full ${getPaymentModeBadgeClass(
                                mode,
                                sale.totalPayment
                              )}`}
                            >
                              {mode}
                            </span>
                          </div>
                          <div className="flex flex-col text-right min-w-0 flex-1">
                            <span className="text-[10px] font-medium text-slate-400 truncate">
                              Offer
                            </span>
                            <span className="font-bold text-amber-600 text-xs sm:text-sm truncate">
                              ₹{sale.offerAmount}
                            </span>
                          </div>
                        </div>

                        {sale.vehicleNumber && (
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 min-w-0">
                            <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="shrink-0">Vehicle:</span>
                            <span className="font-bold text-slate-700 break-all truncate font-mono">
                              {sale.vehicleNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Floating Action Button ("Add Sale") */}
            <Link
              href={`/customers/${customer.id}/add-sale`}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-[360px] bg-[#d97706] hover:bg-[#b45309] text-white py-3.5 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border-2 border-white/20 select-none font-bold tracking-wide text-sm"
            >
              <PlusCircle className="w-5 h-5 shrink-0" />
              <span>Add Sale</span>
            </Link>
          </>
        )}

        {/* TAB 2: Balance History */}
        {activeTab === "balance" && (
          <div className="flex flex-col gap-4">
            {/* Balance Summary Card */}
            <div className="bg-[#f7ebe1] rounded-3xl p-4 sm:p-5 shadow-sm border border-amber-900/10 flex flex-col gap-3 relative max-w-full">
              <div className="flex justify-between items-start border-b border-amber-900/10 pb-3 gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] sm:text-xs font-bold text-amber-900/60 uppercase tracking-wider block truncate">
                    Outstanding Balance (Due)
                  </span>
                  <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 min-w-0">
                    {outstandingBalance > 0 ? (
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    <span
                      className={`text-xl sm:text-2xl font-black truncate ${
                        outstandingBalance > 0
                          ? "text-rose-600"
                          : "text-emerald-700"
                      }`}
                    >
                      ₹{Math.abs(outstandingBalance).toLocaleString()}
                      {outstandingBalance < 0 && " (Credit)"}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap ${
                    outstandingBalance > 0
                      ? "bg-rose-100 text-rose-700"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {outstandingBalance > 0 ? "Pending Payment" : "Paid in Full"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1">
                <div className="bg-white/80 rounded-2xl p-3 border border-amber-900/10 flex flex-col min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
                    Total Bill Amount
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-slate-800 mt-0.5 truncate">
                    ₹{totalBillAmount.toLocaleString()}
                  </span>
                </div>

                <div className="bg-white/80 rounded-2xl p-3 border border-amber-900/10 flex flex-col min-w-0">
                  <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
                    Total Paid Amount
                  </span>
                  <span className="text-sm sm:text-base font-extrabold text-emerald-700 mt-0.5 truncate">
                    ₹{totalPaidAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Collect Payment Action Button */}
            <button
              onClick={() => setIsAddPaymentModalOpen(true)}
              className="w-full bg-[#d97706] hover:bg-[#b45309] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] border-2 border-white/20 select-none"
            >
              <PlusCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm font-bold tracking-wide">
                Collect Payment
              </span>
            </button>

            {/* Payment Ledger / Collections List */}
            <div>
              <div className="flex items-center justify-between mb-3 mt-1">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">
                  Payment Ledger
                </h3>
                <span className="text-xs font-bold text-slate-600 bg-slate-200 px-2.5 py-0.5 rounded-full shrink-0">
                  {displayLedger.length} Transactions
                </span>
              </div>

              {displayLedger.length === 0 ? (
                <div className="bg-[#213547]/5 rounded-3xl p-8 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center mt-1">
                  <Wallet className="w-10 h-10 text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-slate-500">
                    No balance payments recorded yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {displayLedger.map((tx) => (
                    <div
                      key={tx.id}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col gap-2.5 max-w-full"
                    >
                      {tx.type === "SALE_ADVANCE" ? (
                        <>
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                                <Package className="w-5 h-5 text-amber-700" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                                  {tx.title}
                                </h4>
                                <span className="text-[11px] font-medium text-slate-400 block truncate">
                                  {formatDate(tx.date)}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="block text-sm sm:text-base font-extrabold text-slate-800">
                                ₹{tx.billAmount.toLocaleString()}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 block mt-0.5">
                                Advance Paid: ₹{tx.amount.toLocaleString()}
                              </span>
                              <span
                                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full inline-block mt-0.5 ${getPaymentModeBadgeClass(
                                  tx.paymentMode,
                                  tx.amount
                                )}`}
                              >
                                {tx.amount > 0 ? `Paid via ${tx.paymentMode}` : tx.paymentMode}
                              </span>
                            </div>
                          </div>

                          {tx.notes && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium break-words">
                              {tx.notes}
                            </p>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs gap-2">
                            <span className="font-semibold text-slate-500 text-[11px] shrink-0">
                              Load Balance Due
                            </span>
                            <span
                              className={`font-extrabold text-xs sm:text-sm truncate ${
                                tx.loadBalanceDue > 0
                                  ? "text-rose-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              ₹{tx.loadBalanceDue.toLocaleString()}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                                <Wallet className="w-5 h-5 text-emerald-700" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                                  {tx.title}
                                </h4>
                                <span className="text-[11px] font-medium text-slate-400 block truncate">
                                  {formatDate(tx.date)}
                                </span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="block text-sm sm:text-base font-extrabold text-emerald-700">
                                + ₹{tx.amount.toLocaleString()}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${getPaymentModeBadgeClass(
                                  tx.paymentMode,
                                  tx.amount
                                )}`}
                              >
                                Paid via {tx.paymentMode}
                              </span>
                            </div>
                          </div>

                          {tx.offerAmount && tx.offerAmount > 0 ? (
                            <div className="bg-amber-50/80 rounded-xl p-2 px-3 border border-amber-200/70 flex justify-between items-center text-xs font-semibold text-amber-950">
                              <span className="text-slate-600">Offer / Discount Given:</span>
                              <span className="font-extrabold text-amber-700">- ₹{tx.offerAmount.toLocaleString()}</span>
                            </div>
                          ) : null}

                          {tx.notes && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium break-words">
                              {tx.notes}
                            </p>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs gap-2">
                            <span className="font-semibold text-slate-400 text-[11px] shrink-0">
                              Transaction Status
                            </span>
                            <span className="font-extrabold text-xs sm:text-sm text-emerald-700 truncate">
                              Credited to Account
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CustomerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        initialData={customer}
      />

      <EditSaleModal
        isOpen={isEditSaleModalOpen}
        onClose={() => {
          setIsEditSaleModalOpen(false);
          setSelectedSaleToEdit(null);
        }}
        sale={selectedSaleToEdit}
        onSave={handleSaveSale}
      />

      <AddPaymentModal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        customerId={customer.id}
        customerName={customer.name}
        pendingBalance={outstandingBalance > 0 ? outstandingBalance : 0}
        onSave={handleSavePayment}
      />

      <GenerateBillModal
        isOpen={isGenerateBillModalOpen}
        onClose={() => setIsGenerateBillModalOpen(false)}
        customer={customer}
        sales={sales}
        payments={customerPayments}
      />
    </div>
  );
}

