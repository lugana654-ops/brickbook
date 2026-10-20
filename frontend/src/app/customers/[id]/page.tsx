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
  FileText,
  Plus,
  PlusCircle,
  Box,
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
import CustomerModal, { CustomerFormData } from '@/components/customers/CustomerModal';
import DatePickerModal from '@/components/ui/DatePickerModal';
import { useBrickBook } from '@/context/BrickBookContext';
import { formatFriendlyDate, getTodayDateString } from '@/lib/curingCalculator';
import { generateCustomerStatementPDF } from '@/lib/pdfGenerator';
import { validateKeralaVehicleNumber, formatKeralaPlateAsYouType } from '@/lib/vehicleValidator';
import { BlockType, BLOCK_CONFIGS, DispatchRecord, PaymentMode } from '@/types';

// Formats YYYY-MM-DD to D-M-YYYY without leading zero to match screenshot (e.g. 29-9-2026)
function formatCustomDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const y = parts[0];
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (!isNaN(m) && !isNaN(d)) {
      return `${d}-${m}-${y}`;
    }
  }
  const dateObj = new Date(dateStr);
  if (!isNaN(dateObj.getTime())) {
    return `${dateObj.getDate()}-${dateObj.getMonth() + 1}-${dateObj.getFullYear()}`;
  }
  return dateStr;
}

function formatBlockTypeDisplay(blockType: string): string {
  if (blockType === '4inch') return '4 inch';
  if (blockType === '6inch') return '6 inch';
  const conf = BLOCK_CONFIGS[blockType as BlockType];
  return conf ? conf.nominalSize : blockType.replace('inch', ' inch');
}

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
  const [editSaleError, setEditSaleError] = useState<string | null>(null);

  // Date Picker Modals State
  const [isEditSaleDateOpen, setIsEditSaleDateOpen] = useState(false);
  const [isPayDateOpen, setIsPayDateOpen] = useState(false);

  // Generate Statement / Bill Modal State
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billFromDate, setBillFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [billToDate, setBillToDate] = useState<string>(getTodayDateString());
  const [isBillFromDateOpen, setIsBillFromDateOpen] = useState(false);
  const [isBillToDateOpen, setIsBillToDateOpen] = useState(false);

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
    setIsEditCustomerOpen(true);
  };

  // Save Edit Customer Updates
  const handleUpdateCustomer = (data: CustomerFormData) => {
    updateCustomer(customer.id, {
      name: data.name,
      phone: data.phone,
      place: data.place,
    });
    setIsEditCustomerOpen(false);
    return { success: true };
  };

  // Handle PDF Statement
  const handleDownloadPDF = () => {
    setIsBillModalOpen(true);
  };

  const handleGeneratePDFFromModal = () => {
    const filteredLedger = ledger.filter((entry) => {
      if (billFromDate && entry.date < billFromDate) return false;
      if (billToDate && entry.date > billToDate) return false;
      return true;
    });
    generateCustomerStatementPDF(customer, filteredLedger, user);
    setIsBillModalOpen(false);
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
    setEditSaleError(null);
  };

  // Save Edit Sale
  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaleError(null);
    if (!editingSale) return;

    const todayStr = getTodayDateString();
    if (editSaleDate > todayStr) {
      setEditSaleError('Sale date cannot be in the future. Please select today or a past date.');
      return;
    }

    if (!editSaleVehicle.trim()) {
      setEditSaleError('Vehicle number is required. Please enter a valid Kerala vehicle registration number.');
      return;
    }

    const vehicleValidation = validateKeralaVehicleNumber(editSaleVehicle);
    if (!vehicleValidation.isValid) {
      setEditSaleError(
        vehicleValidation.errorMessage || 'Invalid Kerala vehicle registration number (e.g. KL-07-AB-1234).'
      );
      return;
    }

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
      vehicleNumber: vehicleValidation.normalized,
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
    <div className="flex flex-col min-h-full bg-[#f3f4f6]">
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

        <h1 className="text-base font-bold tracking-tight text-white truncate max-w-[220px] text-center flex-1">
          {customer.name}
        </h1>

        <button
          onClick={handleDeleteCustomer}
          id="btn-delete-customer"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#f87171] hover:text-red-300 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer"
          aria-label="Delete Customer"
          title="Delete Customer Account"
        >
          <Trash2 size={20} />
        </button>
      </header>

      <div className="px-4 pt-4 pb-12 space-y-4">
        {/* 2. Peach/Cream Customer Information Card matching Reference Screenshot */}
        <div className="rounded-[28px] bg-[#fdf3e7] border border-amber-200/60 p-5 shadow-xs flex flex-col items-center text-center">
          {/* Avatar centered with dark navy ring */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#fde8d0] border-[2px] border-[#213547] text-2xl font-bold text-[#b45309] shadow-xs">
            {initialChar}
          </div>

          {/* Customer Name centered */}
          <h2 className="mt-3 text-lg font-bold text-[#111827] leading-tight">
            {customer.name}
          </h2>

          {/* Phone centered */}
          <div className="mt-1.5 flex items-center justify-center gap-1.5 text-xs text-gray-700 font-medium">
            <Phone size={13} className="text-[#b45309] shrink-0" />
            <span>{customer.phone}</span>
          </div>

          {/* Location centered */}
          <div className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-700 font-medium">
            <MapPin size={13} className="text-[#b45309] shrink-0" />
            <span>{customer.place || 'Aba'}</span>
          </div>

          {/* Action Buttons: Call Customer & Edit Details */}
          <div className="mt-4 grid grid-cols-2 gap-3 w-full">
            <a
              href={`tel:${customer.phone}`}
              id="btn-call-customer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#213547] py-3 text-xs font-bold text-white shadow-xs hover:bg-[#1a2b3c] active:scale-[0.98] transition-all"
            >
              <Phone size={14} className="text-white" />
              <span>Call Customer</span>
            </a>

            <button
              onClick={handleOpenEditCustomer}
              id="btn-edit-customer"
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-gray-300/80 py-3 text-xs font-bold text-[#1a2b3c] shadow-xs hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Pencil size={14} className="text-gray-700" />
              <span>Edit Details</span>
            </button>
          </div>

          {/* Full-width Amber Button: Generate Weekly Bill (PDF) */}
          <button
            onClick={handleDownloadPDF}
            id="btn-generate-weekly-bill"
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d97706] py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#b45309] active:scale-[0.98] transition-all cursor-pointer"
          >
            <FileText size={16} className="text-white" />
            <span>Generate Weekly Bill (PDF)</span>
          </button>
        </div>

        {/* 3. Rounded Tab Switcher matching Reference Screenshot */}
        <div className="flex rounded-2xl bg-[#eaedf1] p-1 border border-slate-200/60">
          <button
            type="button"
            id="tab-sales-history"
            onClick={() => setActiveTab('SALES')}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'SALES'
                ? 'bg-[#213547] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sales History ({customerDispatches.length})
          </button>
          <button
            type="button"
            id="tab-balance-history"
            onClick={() => setActiveTab('BALANCE')}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'BALANCE'
                ? 'bg-[#213547] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
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
              <h3 className="text-sm font-bold text-[#111827]">Sales Orders</h3>
              <span className="rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[11px] font-bold text-[#b45309]">
                {customerDispatches.length} Entries
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
              <div className="space-y-3">
                {customerDispatches.map((sale) => {
                  const blockNominal = formatBlockTypeDisplay(sale.blockType);
                  const isPaid = (sale.paidAmount || 0) >= sale.totalAmount && sale.totalAmount > 0;

                  return (
                    <div
                      key={sale.id}
                      className="rounded-[22px] bg-white p-4 border border-gray-200/80 shadow-xs space-y-3 hover:border-slate-300 transition-all"
                    >
                      {/* Top Row: Icon + Type & Bricks (Left) | Price & Date & Edit (Right) */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fef3c7]">
                            <Box size={22} className="text-[#d97706]" />
                          </div>
                          <div>
                            <h4 className="text-[15px] font-bold text-[#111827] leading-tight">
                              {blockNominal}
                            </h4>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              {sale.quantity.toLocaleString('en-IN')} Bricks
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2.5">
                          <div className="text-right">
                            <p className="text-base font-bold text-[#111827] leading-tight">
                              ₹{sale.totalAmount.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">
                              {formatCustomDate(sale.date)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenEditSale(sale)}
                            className="p-1 text-gray-400 hover:text-gray-700 active:scale-95 transition-all cursor-pointer"
                            aria-label="Edit Sale"
                            title="Edit Sale"
                          >
                            <Pencil size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Middle Row: Rate/Brick | Paid + Credit/Bill badge | Offer */}
                      <div className="rounded-2xl bg-[#f8fafc] p-3 px-4 border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-medium text-gray-400">Rate/Brick</p>
                          <p className="text-sm font-bold text-gray-800 mt-0.5">
                            ₹{sale.unitPrice}
                          </p>
                        </div>

                        <div className="text-center flex flex-col items-center">
                          <p className="text-[11px] font-medium text-gray-400">Paid</p>
                          <p className="text-sm font-bold text-gray-800 mt-0.5">
                            ₹{(sale.paidAmount || 0).toLocaleString('en-IN')}
                          </p>
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isPaid
                                ? 'bg-emerald-100 text-[#059669]'
                                : 'bg-[#fef3c7] text-[#b45309]'
                            }`}
                          >
                            {isPaid ? 'Paid' : 'Credit / Bill'}
                          </span>
                        </div>

                        <div className="text-right">
                          <p className="text-[11px] font-medium text-gray-400">Offer</p>
                          <p className="text-sm font-bold text-[#d97706] mt-0.5">
                            ₹{(sale.discount || 0).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Row: Vehicle Number */}
                      <div className="flex items-center text-xs text-gray-500 font-medium space-x-1.5 pt-0.5">
                        <Truck size={14} className="text-gray-400 shrink-0" />
                        <span>
                          Vehicle:{' '}
                          <span className="text-gray-700 font-bold font-mono">
                            {sale.vehicleNumber || 'N/A'}
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Sale Button matching exact Reference Screenshot */}
            <div className="pt-2">
              <Link
                href={`/customers/${customer.id}/add-sale`}
                id="btn-add-sale"
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#d97706] py-3.5 text-[15px] font-bold text-white shadow-md hover:bg-[#b45309] active:scale-[0.98] transition-all cursor-pointer"
              >
                <PlusCircle size={20} className="text-white" />
                <span>Add Sale</span>
              </Link>
            </div>
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
            {/* Add Sale Button on Balance Tab */}
            <div className="pt-2">
              <Link
                href={`/customers/${customer.id}/add-sale`}
                id="btn-add-sale-balance"
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-[#d97706] py-3.5 text-[15px] font-bold text-white shadow-md hover:bg-[#b45309] active:scale-[0.98] transition-all cursor-pointer"
              >
                <PlusCircle size={20} className="text-white" />
                <span>Add Sale</span>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Edit Customer Details */}
      <CustomerModal
        isOpen={isEditCustomerOpen}
        initialCustomer={customer}
        onClose={() => setIsEditCustomerOpen(false)}
        onSubmit={handleUpdateCustomer}
      />

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
              {editSaleError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs font-semibold text-red-700 flex items-start space-x-2">
                  <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <span>{editSaleError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sale Date
                </label>
                <div
                  onClick={() => setIsEditSaleDateOpen(true)}
                  id="btn-edit-sale-date"
                  className="w-full flex items-center justify-between rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] hover:border-[#d97706] transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">
                    {editSaleDate ? formatFriendlyDate(editSaleDate) : 'Select date'}
                  </span>
                  <Calendar size={16} className="text-[#d97706]" />
                </div>
                <DatePickerModal
                  isOpen={isEditSaleDateOpen}
                  value={editSaleDate}
                  title="Select sale date"
                  maxDate={getTodayDateString()}
                  onChange={(val) => {
                    setEditSaleDate(val);
                    setEditSaleError(null);
                  }}
                  onClose={() => setIsEditSaleDateOpen(false)}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">
                      Vehicle Number *
                    </label>
                    {editSaleVehicle.trim() && (
                      validateKeralaVehicleNumber(editSaleVehicle).isValid ? (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-[#059669]">
                          Valid MVD
                        </span>
                      ) : (
                        <span className="rounded bg-red-100 px-1.5 py-0.2 text-[9px] font-bold text-red-600">
                          Invalid MVD
                        </span>
                      )
                    )}
                  </div>
                  <input
                    type="text"
                    value={editSaleVehicle}
                    onChange={(e) => {
                      const formatted = formatKeralaPlateAsYouType(e.target.value);
                      setEditSaleVehicle(formatted);
                      setEditSaleError(null);
                    }}
                    placeholder="KL-07-A-1234"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs uppercase font-mono text-[#111827] focus:border-[#d97706] focus:outline-none placeholder-gray-400"
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
                <div
                  onClick={() => setIsPayDateOpen(true)}
                  id="btn-payment-date"
                  className="w-full flex items-center justify-between rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] hover:border-[#d97706] transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-gray-900">
                    {payDate ? formatFriendlyDate(payDate) : 'Select date'}
                  </span>
                  <Calendar size={16} className="text-[#d97706]" />
                </div>
                <DatePickerModal
                  isOpen={isPayDateOpen}
                  value={payDate}
                  title="Select payment date"
                  onChange={(val) => setPayDate(val)}
                  onClose={() => setIsPayDateOpen(false)}
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

      {/* Generate Weekly Bill / Date Range Statement Modal */}
      {isBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[360px] overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#213547] px-5 py-4 text-white">
              <div className="flex items-center space-x-2">
                <FileText size={18} className="text-[#fcd34d]" />
                <div>
                  <h3 className="font-semibold text-sm">Generate Bill / Statement</h3>
                  <p className="text-[11px] text-white/70">{customer.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBillModalOpen(false)}
                className="rounded-full p-1 text-white/80 hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Quick Range Presets */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Statement Period
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 7);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setBillFromDate(`${y}-${m}-${day}`);
                      setBillToDate(getTodayDateString());
                    }}
                    className="rounded-xl border border-amber-300 bg-[#fdecdb] py-2 text-[11px] font-bold text-[#854d0e] hover:bg-amber-200/70 transition-colors cursor-pointer"
                  >
                    Last 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 30);
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      setBillFromDate(`${y}-${m}-${day}`);
                      setBillToDate(getTodayDateString());
                    }}
                    className="rounded-xl border border-gray-200 bg-gray-50 py-2 text-[11px] font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBillFromDate('');
                      setBillToDate('');
                    }}
                    className="rounded-xl border border-gray-200 bg-gray-50 py-2 text-[11px] font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    All Time
                  </button>
                </div>
              </div>

              {/* From Date & To Date Range Inputs */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    From Date
                  </label>
                  <div
                    onClick={() => setIsBillFromDateOpen(true)}
                    id="btn-bill-from-date"
                    className="flex items-center justify-between rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-xs text-[#111827] hover:border-[#d97706] transition-colors cursor-pointer shadow-xs"
                  >
                    <span className="truncate font-semibold text-[11px]">
                      {billFromDate ? formatFriendlyDate(billFromDate) : 'Start Date'}
                    </span>
                    <Calendar size={14} className="text-[#d97706] shrink-0 ml-1" />
                  </div>
                  <DatePickerModal
                    isOpen={isBillFromDateOpen}
                    value={billFromDate || getTodayDateString()}
                    title="Select start date"
                    onChange={(val) => setBillFromDate(val)}
                    onClose={() => setIsBillFromDateOpen(false)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    To Date
                  </label>
                  <div
                    onClick={() => setIsBillToDateOpen(true)}
                    id="btn-bill-to-date"
                    className="flex items-center justify-between rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-xs text-[#111827] hover:border-[#d97706] transition-colors cursor-pointer shadow-xs"
                  >
                    <span className="truncate font-semibold text-[11px]">
                      {billToDate ? formatFriendlyDate(billToDate) : 'End Date'}
                    </span>
                    <Calendar size={14} className="text-[#d97706] shrink-0 ml-1" />
                  </div>
                  <DatePickerModal
                    isOpen={isBillToDateOpen}
                    value={billToDate || getTodayDateString()}
                    title="Select end date"
                    onChange={(val) => setBillToDate(val)}
                    onClose={() => setIsBillToDateOpen(false)}
                  />
                </div>
              </div>

              {/* Transactions count summary */}
              <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-3 text-xs text-gray-600 flex items-center justify-between">
                <span>Matching Entries:</span>
                <span className="font-bold text-[#111827]">
                  {
                    ledger.filter((entry) => {
                      if (billFromDate && entry.date < billFromDate) return false;
                      if (billToDate && entry.date > billToDate) return false;
                      return true;
                    }).length
                  }{' '}
                  transactions
                </span>
              </div>

              {/* Actions */}
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsBillModalOpen(false)}
                  className="flex-1 rounded-2xl border border-gray-300 bg-white py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="btn-download-pdf-confirm"
                  onClick={handleGeneratePDFFromModal}
                  className="flex-[2] flex items-center justify-center gap-1.5 rounded-2xl bg-[#d97706] py-3 text-xs font-bold text-white shadow-md hover:bg-[#b45309] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <FileDown size={15} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
