'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Trash2,
  Phone,
  MapPin,
  Pencil,
  FileDown,
  Plus,
  Calendar,
  CreditCard,
  Truck,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import PaymentModeBadge from '@/components/customers/PaymentModeBadge';
import { useBrickBook } from '@/context/BrickBookContext';
import { formatFriendlyDate, getTodayDateString } from '@/lib/curingCalculator';
import { generateCustomerStatementPDF } from '@/lib/pdfGenerator';
import { BlockType, BLOCK_CONFIGS, DispatchRecord, PaymentMode } from '@/types';

type MainTab = 'SALES' | 'BALANCE';
type LedgerFilter = 'ALL' | 'DISPATCHES' | 'PAYMENTS';

export default function CustomerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const {
    getCustomerById,
    getCustomerLedger,
    addPayment,
    user,
    dispatches,
    updateCustomer,
    deleteCustomer,
    updateDispatch,
  } = useBrickBook();

  const customer = getCustomerById(resolvedParams.id);

  // Tabs
  const [activeTab, setActiveTab] = useState<MainTab>('SALES');
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>('ALL');

  // Edit Customer Modal State
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPlace, setEditPlace] = useState('');

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | string>('');
  const [payDate, setPayDate] = useState<string>(getTodayDateString());
  const [payMode, setPayMode] = useState<PaymentMode>('CASH');
  const [refNumber, setRefNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  // Edit Sale Modal State
  const [editingSale, setEditingSale] = useState<DispatchRecord | null>(null);
  const [editSaleDate, setEditSaleDate] = useState('');
  const [editSaleQty, setEditSaleQty] = useState<number | string>('');
  const [editSalePrice, setEditSalePrice] = useState<number | string>('');
  const [editSaleDiscount, setEditSaleDiscount] = useState<number | string>('');
  const [editSaleVehicle, setEditSaleVehicle] = useState('');
  const [editSaleNotes, setEditSaleNotes] = useState('');

  if (!customer) {
    return (
      <div className="flex flex-col min-h-full bg-[#f3f4f6]">
        <div className="flex h-14 items-center px-4 bg-[#213547] text-white">
          <Link href="/customers" className="p-1 rounded-full hover:bg-white/10">
            <ArrowLeft size={22} />
          </Link>
          <span className="ml-3 font-bold text-sm">Customer Not Found</span>
        </div>
        <div className="p-8 text-center">
          <p className="text-sm text-gray-500">This customer account does not exist.</p>
          <Link
            href="/customers"
            className="mt-4 inline-block rounded-xl bg-[#d97706] px-4 py-2 text-xs font-bold text-white shadow-xs"
          >
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const customerDispatches = dispatches.filter((d) => d.customerId === customer.id);
  const ledger = getCustomerLedger(customer.id);

  const filteredLedger = ledger.filter((entry) => {
    if (ledgerFilter === 'DISPATCHES') return entry.type === 'DISPATCH';
    if (ledgerFilter === 'PAYMENTS') return entry.type === 'PAYMENT';
    return true;
  });

  const customerBalance =
    typeof customer.currentBalance === 'number' && !isNaN(customer.currentBalance)
      ? customer.currentBalance
      : Number(customer.openingBalance) || 0;
  const isSettled = customerBalance === 0;

  // Initial Avatar character
  const initialChar = customer.name.trim() ? customer.name.trim().charAt(0).toUpperCase() : 'C';

  // Handle Delete Customer
  const handleDeleteCustomer = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${customer.name}"? This will permanently remove this customer account.`
      )
    ) {
      deleteCustomer(customer.id);
      router.push('/customers');
    }
  };

  // Open Edit Customer Modal
  const handleOpenEditCustomer = () => {
    setEditName(customer.name);
    setEditPhone(customer.phone);
    setEditPlace(customer.place || '');
    setIsEditCustomerOpen(true);
  };

  // Save Edit Customer
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    updateCustomer(customer.id, {
      name: editName.trim(),
      phone: editPhone.trim(),
      place: editPlace.trim(),
    });
    setIsEditCustomerOpen(false);
  };

  // Handle PDF Statement
  const handleDownloadPDF = () => {
    generateCustomerStatementPDF(customer, ledger, user);
  };

  // Open Edit Sale Modal
  const handleOpenEditSale = (sale: DispatchRecord) => {
    setEditingSale(sale);
    setEditSaleDate(sale.date);
    setEditSaleQty(sale.quantity);
    setEditSalePrice(sale.unitPrice);
    setEditSaleDiscount(sale.discount || 0);
    setEditSaleVehicle(sale.vehicleNumber || '');
    setEditSaleNotes(sale.notes || '');
  };

  // Save Edit Sale
  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;
    const qty = Number(editSaleQty) || 0;
    const price = Number(editSalePrice) || 0;
    const disc = Number(editSaleDiscount) || 0;
    const sub = qty * price;
    const total = Math.max(0, sub - disc);

    updateDispatch(editingSale.id, {
      date: editSaleDate,
      quantity: qty,
      unitPrice: price,
      discount: disc,
      totalAmount: total,
      vehicleNumber: editSaleVehicle.trim(),
      notes: editSaleNotes.trim(),
    });
    setEditingSale(null);
  };

  // Submit Payment
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPayError(null);

    const amount = Number(payAmount);
    if (amount <= 0) {
      setPayError('Please enter a valid payment amount.');
      return;
    }

    const res = addPayment({
      customerId: customer.id,
      date: payDate,
      amount,
      paymentMode: payMode,
      referenceNumber: refNumber,
      bankName,
      chequeNumber,
      notes: payNotes,
    });

    if (!res.success) {
      setPayError(res.error || 'Failed to record payment.');
      return;
    }

    setPayAmount('');
    setRefNumber('');
    setBankName('');
    setChequeNumber('');
    setPayNotes('');
    setIsPaymentModalOpen(false);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f3f4f6] pb-36">
      {/* 1. Compact Dark Navy Top Bar matching Reference Screenshot */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[#213547] px-4 text-white shadow-md">
        <Link
          href="/customers"
          id="header-back-button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/10 active:scale-95 transition-all"
          aria-label="Back to customers"
        >
          <ArrowLeft size={22} />
        </Link>

        <h1 className="text-base font-bold tracking-tight text-white truncate max-w-[200px] text-center">
          {customer.name}
        </h1>

        <button
          onClick={handleDeleteCustomer}
          id="btn-delete-customer"
          className="flex h-9 w-9 items-center justify-center rounded-full text-red-300 hover:text-white hover:bg-red-500/20 active:scale-95 transition-all"
          aria-label="Delete Customer"
          title="Delete Customer Account"
        >
          <Trash2 size={19} />
        </button>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {/* 2. Peach/Cream Customer Information Card matching Reference Screenshot */}
        <div className="rounded-[26px] bg-[#fdf3e7] border border-amber-200/70 p-4.5 shadow-xs space-y-3.5">
          {/* Top Row: Avatar + Info */}
          <div className="flex items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#fde8d0] border border-amber-300/80 text-xl font-bold text-[#d97706] mr-3.5 shadow-2xs">
              {initialChar}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-bold text-[#1a2b3c] truncate leading-tight">
                {customer.name}
              </h2>
              <div className="mt-1 flex items-center text-xs text-gray-600">
                <Phone size={13} className="mr-1 text-gray-400 shrink-0" />
                <span className="truncate">{customer.phone}</span>
              </div>
              <div className="mt-0.5 flex items-center text-xs text-gray-500">
                <MapPin size={13} className="mr-1 text-gray-400 shrink-0" />
                <span className="truncate">{customer.place || 'Kerala'}</span>
              </div>
            </div>
          </div>

          {/* Two Side-by-Side Action Buttons: Call Customer & Edit Details */}
          <div className="grid grid-cols-2 gap-2.5 pt-0.5">
            <a
              href={`tel:${customer.phone}`}
              id="btn-call-customer"
              className="flex items-center justify-center space-x-1.5 rounded-2xl bg-white border border-amber-200/90 py-2.5 text-xs font-bold text-[#1a2b3c] shadow-2xs hover:bg-amber-50 active:scale-[0.98] transition-all"
            >
              <Phone size={14} className="text-[#d97706]" />
              <span>Call Customer</span>
            </a>

            <button
              onClick={handleOpenEditCustomer}
              id="btn-edit-customer"
              type="button"
              className="flex items-center justify-center space-x-1.5 rounded-2xl bg-white border border-amber-200/90 py-2.5 text-xs font-bold text-[#1a2b3c] shadow-2xs hover:bg-amber-50 active:scale-[0.98] transition-all"
            >
              <Pencil size={14} className="text-[#d97706]" />
              <span>Edit Details</span>
            </button>
          </div>

          {/* Full-width Amber Button: Generate Weekly Bill (PDF) */}
          <button
            onClick={handleDownloadPDF}
            id="btn-generate-weekly-bill"
            type="button"
            className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-[#d97706] py-3 text-xs font-bold text-white shadow-md hover:bg-[#b45309] active:scale-[0.98] transition-all"
          >
            <FileDown size={16} />
            <span>Generate Weekly Bill (PDF)</span>
          </button>
        </div>

        {/* 3. Rounded Tab Switcher matching Reference Screenshot */}
        <div className="flex rounded-2xl bg-white p-1 border border-slate-200/80 shadow-xs">
          <button
            type="button"
            id="tab-sales-history"
            onClick={() => setActiveTab('SALES')}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              activeTab === 'SALES'
                ? 'bg-[#213547] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sales History
          </button>
          <button
            type="button"
            id="tab-balance-history"
            onClick={() => setActiveTab('BALANCE')}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
              activeTab === 'BALANCE'
                ? 'bg-[#213547] text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Balance History
          </button>
        </div>

        {/* 4. Tab 1: Sales History Content */}
        {activeTab === 'SALES' && (
          <div className="space-y-3">
            {/* Sales Orders Heading & Count */}
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-[#1a2b3c]">Sales Orders</h3>
              <span className="rounded-full bg-amber-100/90 px-2.5 py-0.5 text-[11px] font-bold text-[#d97706]">
                {customerDispatches.length} Orders
              </span>
            </div>

            {/* Sales List or Empty State */}
            {customerDispatches.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-center border border-slate-100 shadow-xs">
                <Truck size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-bold text-gray-700">No Sales Orders Yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[240px] mx-auto">
                  Click the &quot;Add Sale&quot; button below to record deliveries for {customer.name}.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {customerDispatches.map((sale) => {
                  const blockNominal =
                    BLOCK_CONFIGS[sale.blockType]?.nominalSize || sale.blockType;
                  const paymentStatus =
                    sale.paymentStatus ||
                    ((sale.paidAmount || 0) >= sale.totalAmount && sale.totalAmount > 0
                      ? 'PAID'
                      : (sale.paidAmount || 0) > 0
                      ? 'PARTIAL'
                      : 'UNPAID');

                  return (
                    <div
                      key={sale.id}
                      className="rounded-2xl bg-white p-4 border border-slate-100 shadow-xs space-y-2.5 hover:border-slate-200 transition-all"
                    >
                      {/* Top Row: Nominal Block Type + Total Amount */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="rounded-lg bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-[#d97706]">
                            {blockNominal}
                          </span>
                          <span className="text-xs font-semibold text-gray-600">
                            {sale.quantity.toLocaleString('en-IN')} blocks
                          </span>
                        </div>
                        <span className="text-sm font-bold text-[#1a2b3c]">
                          ₹ {sale.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>

                      {/* Middle Row: Date & Rate per Brick */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1.5">
                          <Calendar size={13} className="text-gray-400 shrink-0" />
                          <span>{formatFriendlyDate(sale.date)}</span>
                        </div>
                        <span className="font-medium text-gray-600">
                          Rate: ₹{sale.unitPrice}/brick
                        </span>
                      </div>

                      {/* Payment, Paid Amount & Discount Row */}
                      <div className="flex items-center justify-between text-[11px] border-t border-gray-100 pt-2">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <span>
                            Paid:{' '}
                            <strong className="text-[#059669]">
                              ₹{(sale.paidAmount || 0).toLocaleString('en-IN')}
                            </strong>
                          </span>
                          {sale.discount ? (
                            <span className="text-amber-700">
                              (Off: ₹{sale.discount.toLocaleString('en-IN')})
                            </span>
                          ) : null}
                        </div>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-[#059669]'
                              : paymentStatus === 'PARTIAL'
                              ? 'bg-amber-100 text-[#d97706]'
                              : 'bg-red-50 text-red-600'
                          }`}
                        >
                          {paymentStatus}
                        </span>
                      </div>

                      {/* Vehicle Number & Edit Action */}
                      <div className="flex items-center justify-between text-[11px] pt-0.5">
                        {sale.vehicleNumber ? (
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-mono text-[10px] font-bold text-[#213547]">
                            {sale.vehicleNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No vehicle</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEditSale(sale)}
                          className="inline-flex items-center space-x-1 text-xs font-semibold text-[#d97706] hover:text-[#b45309]"
                        >
                          <Pencil size={12} />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. Tab 2: Balance History Content (Financial Summary & Running Ledger) */}
        {activeTab === 'BALANCE' && (
          <div className="space-y-3">
            {/* Financial Summary Card */}
            <div className="rounded-3xl bg-white p-4.5 border border-slate-100 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 font-medium">Total Balance Due</span>
                  <p className="text-xl font-bold text-[#111827] mt-0.5">
                    ₹ {customerBalance.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      isSettled ? 'bg-emerald-100 text-[#059669]' : 'bg-amber-100 text-[#d97706]'
                    }`}
                  >
                    {isSettled ? 'Account Settled' : 'Payment Due'}
                  </span>
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    id="btn-record-payment"
                    type="button"
                    className="flex items-center space-x-1 rounded-xl bg-[#059669] px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all"
                  >
                    <CreditCard size={14} />
                    <span>Record Payment</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sub-filter: All / Dispatches / Payments */}
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-[#1a2b3c]">Transaction Ledger</h3>
              <div className="flex rounded-xl bg-gray-100 p-0.5 text-xs">
                {(['ALL', 'DISPATCHES', 'PAYMENTS'] as LedgerFilter[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setLedgerFilter(tab)}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition-all ${
                      ledgerFilter === tab
                        ? 'bg-[#213547] text-white shadow-2xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {tab === 'ALL' ? 'All' : tab === 'DISPATCHES' ? 'Dispatches' : 'Payments'}
                  </button>
                ))}
              </div>
            </div>

            {/* Ledger List */}
            {filteredLedger.length === 0 ? (
              <div className="rounded-3xl bg-white p-7 text-center border border-slate-100 shadow-xs">
                <Clock size={28} className="mx-auto text-gray-400 mb-2" />
                <p className="text-xs font-semibold text-gray-700">
                  {ledgerFilter === 'DISPATCHES'
                    ? 'No Dispatches Recorded'
                    : ledgerFilter === 'PAYMENTS'
                    ? 'No Payments Recorded'
                    : 'No Transactions Recorded'}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Transactions will appear here as dispatches and payments are added.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLedger.map((entry) => {
                  const isDispatch = entry.type === 'DISPATCH';
                  const isPayment = entry.type === 'PAYMENT';

                  return (
                    <div
                      key={entry.id}
                      className="rounded-2xl bg-white p-3.5 border border-slate-100 shadow-xs flex items-start justify-between"
                    >
                      <div className="flex items-start space-x-2.5 min-w-0 flex-1 pr-2">
                        <div
                          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                            isDispatch
                              ? 'bg-amber-100 text-[#d97706]'
                              : isPayment
                              ? 'bg-emerald-100 text-[#059669]'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {isDispatch ? (
                            <ArrowUpRight size={15} />
                          ) : isPayment ? (
                            <ArrowDownLeft size={15} />
                          ) : (
                            <Clock size={14} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#111827] truncate">
                            {entry.description}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-gray-500">
                            <span>{formatFriendlyDate(entry.date)}</span>
                            {entry.vehicleNumber && (
                              <span className="rounded bg-gray-100 px-1.5 py-0.2 font-mono font-bold text-[#213547]">
                                {entry.vehicleNumber}
                              </span>
                            )}
                            {entry.mode && <PaymentModeBadge mode={entry.mode} />}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-xs font-bold ${
                            isDispatch
                              ? 'text-[#111827]'
                              : isPayment
                              ? 'text-[#059669]'
                              : 'text-gray-700'
                          }`}
                        >
                          {isDispatch
                            ? `+₹ ${(entry.debit || 0).toLocaleString('en-IN')}`
                            : isPayment
                            ? `-₹ ${(entry.credit || 0).toLocaleString('en-IN')}`
                            : `₹ ${(entry.balance || 0).toLocaleString('en-IN')}`}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Bal: ₹ {(entry.balance || 0).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. Fixed Bottom Add Sale Button matching Reference Screenshot */}
      <div className="fixed bottom-20 left-0 right-0 mx-auto w-full max-w-[400px] px-4 pointer-events-none z-50">
        <Link
          href={`/customers/${customer.id}/add-sale`}
          id="btn-add-sale-bottom"
          className="pointer-events-auto flex items-center justify-center space-x-2 w-full rounded-2xl bg-[#d97706] py-3.5 text-sm font-bold text-white shadow-xl hover:bg-[#b45309] active:scale-95 transition-all"
        >
          <Plus size={20} className="stroke-[2.5]" />
          <span>Add Sale</span>
        </Link>
      </div>

      {/* Modal: Edit Customer Details */}
      {isEditCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[360px] overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#213547] px-5 py-4 text-white">
              <div className="flex items-center space-x-2">
                <Pencil size={18} className="text-[#fcd34d]" />
                <h3 className="font-semibold text-sm">Edit Customer</h3>
              </div>
              <button
                onClick={() => setIsEditCustomerOpen(false)}
                className="rounded-full p-1 text-white/80 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Location / Site
                </label>
                <input
                  type="text"
                  value={editPlace}
                  onChange={(e) => setEditPlace(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#d97706] py-3 text-xs font-bold text-white shadow-md hover:bg-[#b45309] active:scale-[0.99]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Sale Details */}
      {editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[360px] overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#213547] px-5 py-4 text-white">
              <div className="flex items-center space-x-2">
                <Pencil size={18} className="text-[#fcd34d]" />
                <h3 className="font-semibold text-sm">Edit Sale Order</h3>
              </div>
              <button
                onClick={() => setEditingSale(null)}
                className="rounded-full p-1 text-white/80 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSale} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sale Date
                </label>
                <input
                  type="date"
                  value={editSaleDate}
                  onChange={(e) => setEditSaleDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={editSaleQty}
                    onChange={(e) => setEditSaleQty(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-[#111827] focus:border-[#d97706] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Rate / Brick (₹)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={editSalePrice}
                    onChange={(e) => setEditSalePrice(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-[#111827] focus:border-[#d97706] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={editSaleDiscount}
                    onChange={(e) => setEditSaleDiscount(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Vehicle Plate
                  </label>
                  <input
                    type="text"
                    value={editSaleVehicle}
                    onChange={(e) => setEditSaleVehicle(e.target.value)}
                    placeholder="e.g. KL-07-AB-1234"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs uppercase font-mono text-[#111827] focus:border-[#d97706] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={editSaleNotes}
                  onChange={(e) => setEditSaleNotes(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-2xl bg-[#d97706] py-3 text-xs font-bold text-white shadow-md hover:bg-[#b45309] active:scale-[0.99]"
                >
                  Save Sale Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payment */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[360px] overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#213547] px-5 py-4 text-white">
              <div className="flex items-center space-x-2">
                <CreditCard size={18} className="text-[#fcd34d]" />
                <h3 className="font-semibold text-sm">Record Payment</h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-full p-1 text-white/80 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-3.5">
              {payError && (
                <div className="rounded-xl bg-red-50 p-2.5 text-xs font-medium text-red-600">
                  {payError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-[#111827] focus:border-[#d97706] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date Received
                </label>
                <input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
                />
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Payment Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['CASH', 'UPI', 'BANK'] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPayMode(mode)}
                      className={`rounded-xl py-2 text-xs font-bold transition-all border ${
                        payMode === mode
                          ? mode === 'UPI'
                            ? 'border-indigo-500 bg-indigo-50 text-[#4f46e5]'
                            : mode === 'BANK'
                            ? 'border-purple-500 bg-purple-50 text-[#7e22ce]'
                            : 'border-amber-500 bg-amber-50 text-[#d97706]'
                          : 'border-gray-200 bg-gray-50 text-gray-600'
                      }`}
                    >
                      {mode === 'CASH' ? 'Cash' : mode === 'UPI' ? 'UPI' : 'Bank / Cheque'}
                    </button>
                  ))}
                </div>
              </div>

              {payMode === 'UPI' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    UPI Reference / UTR Number
                  </label>
                  <input
                    type="text"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    placeholder="e.g. UPI/428901928301"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {payMode === 'BANK' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. State Bank of India, Federal Bank"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Cheque / NEFT Reference (Optional)
                    </label>
                    <input
                      type="text"
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                      placeholder="e.g. CHQ-882390"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Advance payment for site dispatches"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  id="btn-submit-payment"
                  className="w-full rounded-2xl bg-[#059669] py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-[0.99]"
                >
                  Record Payment Received
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
