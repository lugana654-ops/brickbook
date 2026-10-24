'use client';

import React, { useState, use, useMemo } from 'react';
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
  CalendarSearch,
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

type MainTab = 'SALES' | 'PAYMENTS';
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
    payments,
    updateCustomer,
    deleteCustomer,
  } = useBrickBook();

  const customer = getCustomerById(resolvedParams.id);

  // Tabs
  const [activeTab, setActiveTab] = useState<MainTab>('SALES');
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>('ALL');

  // Date filter state for Sales and Payments tabs
  const [salesDate, setSalesDate] = useState<string>('');
  const [paymentsDate, setPaymentsDate] = useState<string>('');
  const [dateFilterModal, setDateFilterModal] = useState<'SALES' | 'PAYMENTS' | null>(null);
  const [tempSalesDate, setTempSalesDate] = useState<string>('');
  const [tempPaymentsDate, setTempPaymentsDate] = useState<string>('');
  const [isFilterDatePickerOpen, setIsFilterDatePickerOpen] = useState(false);

  // Edit Customer Modal State
  const [isEditCustomerOpen, setIsEditCustomerOpen] = useState(false);

  // Record Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | string>('');
  const [payDate, setPayDate] = useState<string>(getTodayDateString());
  const [payMode, setPayMode] = useState<'CASH' | 'UPI' | 'BANK'>('CASH');
  const [refNumber, setRefNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  // Date Picker Modals State
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

  const customerDispatches = customer ? dispatches.filter((d) => d.customerId === customer.id) : [];
  const ledger = customer ? getCustomerLedger(customer.id) : [];

  const filteredLedger = ledger.filter((entry) => {
    if (ledgerFilter === 'DISPATCHES') return entry.type === 'DISPATCH';
    if (ledgerFilter === 'PAYMENTS') return entry.type === 'PAYMENT';
    return true;
  });

  // 1. Total Billed: Opening balance + sum of all sales orders (totalAmount after discount)
  const openingBalance = customer ? Number(customer.openingBalance) || 0 : 0;
  const salesBilled = customerDispatches.reduce((sum, d) => sum + (d.totalAmount || 0), 0);
  const totalBilled = openingBalance + salesBilled;

  // 2. Unified Payments: Initial advances + recorded payments, each counted strictly once
  const rawCustomerPayments = customer ? payments.filter((p) => p.customerId === customer.id) : [];

  interface UnifiedPayment {
    id: string;
    date: string;
    amount: number;
    paymentMode: PaymentMode;
    referenceNumber?: string;
    bankName?: string;
    chequeNumber?: string;
    notes?: string;
    createdAt?: string;
    isAdvance?: boolean;
    saleDetails?: string;
  }

  const unifiedPayments: UnifiedPayment[] = [];
  const matchedPaymentIds = new Set<string>();

  // Process sales dispatches with initial advance payments
  customerDispatches.forEach((d) => {
    const adv = Number(d.paidAmount) || 0;
    if (adv > 0) {
      // Find matching payment in rawCustomerPayments
      const match = rawCustomerPayments.find((p) => {
        if (matchedPaymentIds.has(p.id)) return false;
        const isSaleNote = !p.notes || p.notes.toLowerCase().includes('sale');
        return isSaleNote && p.date === d.date && Number(p.amount) === adv;
      });

      const blockLabel = formatBlockTypeDisplay(d.blockType);
      const saleDesc = `${blockLabel} (${d.quantity.toLocaleString('en-IN')} bricks)`;

      if (match) {
        matchedPaymentIds.add(match.id);
        unifiedPayments.push({
          id: match.id,
          date: match.date,
          amount: match.amount,
          paymentMode: match.paymentMode,
          referenceNumber: match.referenceNumber,
          bankName: match.bankName,
          chequeNumber: match.chequeNumber,
          notes: match.notes,
          createdAt: match.createdAt,
          isAdvance: true,
          saleDetails: saleDesc,
        });
      } else {
        unifiedPayments.push({
          id: `adv_${d.id}`,
          date: d.date,
          amount: adv,
          paymentMode: d.paymentMode || 'CASH',
          notes: `Advance for ${saleDesc}`,
          createdAt: d.createdAt,
          isAdvance: true,
          saleDetails: saleDesc,
        });
      }
    }
  });

  // Add all other recorded payments not tied to a dispatch advance
  rawCustomerPayments.forEach((p) => {
    if (!matchedPaymentIds.has(p.id)) {
      unifiedPayments.push({
        id: p.id,
        date: p.date,
        amount: p.amount,
        paymentMode: p.paymentMode,
        referenceNumber: p.referenceNumber,
        bankName: p.bankName,
        chequeNumber: p.chequeNumber,
        notes: p.notes,
        createdAt: p.createdAt,
        isAdvance: p.notes?.toLowerCase().includes('sale') ?? false,
      });
    }
  });

  // Sort unified payments with most recent payments first
  unifiedPayments.sort((a, b) => {
    const dCmp = b.date.localeCompare(a.date);
    if (dCmp !== 0) return dCmp;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  // 3. Outstanding Balance = Total Billed - Total Paid
  const totalPaid = unifiedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const outstandingBalance = Math.max(0, totalBilled - totalPaid);
  const isSettled = outstandingBalance === 0;

  // Filtered sales records (all by default, filtered only when date is applied)
  const filteredSales = useMemo(() => {
    return customerDispatches.filter((sale) => {
      if (salesDate) {
        const sDate = (sale.date || '').split('T')[0];
        if (sDate !== salesDate) return false;
      }
      return true;
    });
  }, [customerDispatches, salesDate]);

  // Filtered payment records (all by default, filtered only when date is applied)
  const filteredPayments = useMemo(() => {
    return unifiedPayments.filter((pay) => {
      if (paymentsDate) {
        const pDate = (pay.date || '').split('T')[0];
        if (pDate !== paymentsDate) return false;
      }
      return true;
    });
  }, [unifiedPayments, paymentsDate]);

  // Memoized billing calculation for the statement modal (previous balance carry-forward)
  const billingSummary = useMemo(() => {
    // 1. Prior records before billFromDate
    const prevDispatches = billFromDate
      ? customerDispatches.filter((d) => d.date < billFromDate)
      : [];
    const prevSalesAmount = prevDispatches.reduce(
      (sum, d) => sum + (Number(d.totalAmount) || 0),
      0
    );

    const prevPaymentsList = billFromDate
      ? unifiedPayments.filter((p) => p.date < billFromDate)
      : [];
    const prevPaidAmount = prevPaymentsList.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );

    const initialOpening = customer ? Number(customer.openingBalance) || 0 : 0;
    const previousBalance = Math.max(
      0,
      initialOpening + prevSalesAmount - prevPaidAmount
    );

    // 2. Current period purchases (within date range)
    const currentDispatches = customerDispatches.filter((d) => {
      if (billFromDate && d.date < billFromDate) return false;
      if (billToDate && d.date > billToDate) return false;
      return true;
    });
    const currentPurchases = currentDispatches.reduce(
      (sum, d) => sum + (Number(d.totalAmount) || 0),
      0
    );

    // 3. Total Amount Due = Previous Outstanding Balance + Current Purchases
    const totalAmountDue = previousBalance + currentPurchases;

    // 4. Current period payments received
    const currentPayments = unifiedPayments.filter((p) => {
      if (billFromDate && p.date < billFromDate) return false;
      if (billToDate && p.date > billToDate) return false;
      return true;
    });
    const paymentReceived = currentPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );

    // 5. Remaining Outstanding Balance = Total Amount Due - Payment Received
    const remainingBalance = Math.max(0, totalAmountDue - paymentReceived);

    return {
      previousBalance,
      currentPurchases,
      totalAmountDue,
      paymentReceived,
      remainingBalance,
    };
  }, [customer, customerDispatches, unifiedPayments, billFromDate, billToDate]);

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
    const targetDispatches = customerDispatches.filter((d) => {
      if (billFromDate && d.date < billFromDate) return false;
      if (billToDate && d.date > billToDate) return false;
      return true;
    });
    const targetPayments = unifiedPayments.filter((p) => {
      if (billFromDate && p.date < billFromDate) return false;
      if (billToDate && p.date > billToDate) return false;
      return true;
    });
    const filteredLedger = ledger.filter((entry) => {
      if (billFromDate && entry.date < billFromDate) return false;
      if (billToDate && entry.date > billToDate) return false;
      return true;
    });
    generateCustomerStatementPDF(
      customer,
      filteredLedger,
      user,
      targetDispatches,
      targetPayments,
      { fromDate: billFromDate, toDate: billToDate },
      billingSummary
    );
    setIsBillModalOpen(false);
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

        <div className="flex items-center space-x-1">
          <button
            onClick={handleOpenEditCustomer}
            id="btn-edit-customer"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            aria-label="Edit Customer"
            title="Edit Customer"
          >
            <Pencil size={18} />
          </button>

          <button
            onClick={handleDeleteCustomer}
            id="btn-delete-customer"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#f87171] hover:text-red-300 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer"
            aria-label="Delete Customer"
            title="Delete Customer Account"
          >
            <Trash2 size={19} />
          </button>
        </div>
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

          {/* Action Buttons: Call Customer & Generate Bill */}
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
              onClick={handleDownloadPDF}
              id="btn-generate-bill"
              type="button"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white border border-gray-300/80 py-3 text-xs font-bold text-[#1a2b3c] shadow-xs hover:bg-gray-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              <FileText size={14} className="text-gray-700" />
              <span>Generate Bill</span>
            </button>
          </div>

          {/* Full-width Amber Button: Add Sale */}
          <Link
            href={`/customers/${customer.id}/add-sale`}
            id="btn-add-sale"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d97706] py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#b45309] active:scale-[0.98] transition-all cursor-pointer"
          >
            <PlusCircle size={16} className="text-white" />
            <span>Add Sale</span>
          </Link>
        </div>

        {/* 3. Rounded 2-Tab Switcher: Sales | Payments */}
        <div className="flex rounded-2xl bg-[#eaedf1] p-1 border border-slate-200/60">
          <button
            type="button"
            id="tab-sales-history"
            onClick={() => setActiveTab('SALES')}
            className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition-all cursor-pointer text-center px-1 truncate ${
              activeTab === 'SALES'
                ? 'bg-[#213547] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sales
          </button>
          <button
            type="button"
            id="tab-payments-history"
            onClick={() => setActiveTab('PAYMENTS')}
            className={`flex-1 rounded-xl py-2 text-[11px] font-bold transition-all cursor-pointer text-center px-1 truncate ${
              activeTab === 'PAYMENTS'
                ? 'bg-[#213547] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Payments
          </button>
        </div>

        {/* 4. Tab 1: Sales History Content */}
        {activeTab === 'SALES' && (
          <div className="space-y-3">
            {/* Sales Orders Heading & Date Filter Icon */}
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-[#111827]">Sales Orders</h3>
              <button
                type="button"
                id="btn-filter-sales-date"
                onClick={() => {
                  setTempSalesDate(salesDate);
                  setDateFilterModal('SALES');
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                  salesDate
                    ? 'bg-[#d97706] text-white border-[#d97706] shadow-xs'
                    : 'bg-white text-gray-500 border-gray-200 hover:text-gray-900 hover:border-gray-300 shadow-2xs'
                }`}
                title="Filter sales by date"
                aria-label="Filter sales by date"
              >
                <CalendarSearch size={15} />
              </button>
            </div>

            {/* Active Date Filter Banner for Sales */}
            {salesDate && (
              <div className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-1.5 border border-amber-200 text-[11px] text-[#b45309]">
                <span className="font-semibold truncate">
                  Filtered: {formatFriendlyDate(salesDate)}
                </span>
                <button
                  type="button"
                  onClick={() => setSalesDate('')}
                  className="ml-2 font-bold hover:underline shrink-0 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Sales List or Empty State */}
            {filteredSales.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-center border border-slate-100 shadow-xs">
                <Truck size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-bold text-gray-700">
                  {salesDate ? 'No Sales on Selected Date' : 'No Sales Orders Yet'}
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-[240px] mx-auto">
                  {salesDate
                    ? 'No sales records match the selected date.'
                    : `Click "Add Sale" above to record deliveries for ${customer.name}.`}
                </p>
                {salesDate && (
                  <button
                    type="button"
                    onClick={() => setSalesDate('')}
                    className="mt-3 inline-flex items-center gap-1 rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-bold text-[#b45309] hover:bg-amber-200 transition-colors cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSales.map((sale) => {
                  const blockNominal = formatBlockTypeDisplay(sale.blockType);
                  const isPaid = (sale.paidAmount || 0) >= sale.totalAmount && sale.totalAmount > 0;
                  const isPartial = (sale.paidAmount || 0) > 0 && !isPaid;

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
                          <Link
                            href={`/customers/${customer.id}/add-sale?editSaleId=${sale.id}`}
                            className="p-1 text-gray-400 hover:text-gray-700 active:scale-95 transition-all cursor-pointer"
                            aria-label="Edit Sale"
                            title="Edit Sale"
                          >
                            <Pencil size={15} />
                          </Link>
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
                          <p className="text-[11px] font-medium text-gray-400">Advance Paid</p>
                          <p className="text-sm font-bold text-gray-800 mt-0.5">
                            ₹{(sale.paidAmount || 0).toLocaleString('en-IN')}
                          </p>
                          <span
                            className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isPaid
                                ? 'bg-emerald-100 text-[#059669]'
                                : isPartial
                                ? 'bg-amber-100 text-[#b45309]'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isPaid ? 'Paid' : isPartial ? 'Partial Paid' : 'Credit / Bill'}
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
          </div>
        )}

        {/* 5. Tab 2: Payment History */}
        {activeTab === 'PAYMENTS' && (
          <div className="space-y-3">
            {/* Total Balance Heading & Action Buttons */}
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-sm font-bold text-[#111827]">Total Balance</h3>
                <p className="text-sm font-bold text-[#111827] mt-0.5">
                  ₹ {outstandingBalance.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  id="btn-filter-payments-date"
                  onClick={() => {
                    setTempPaymentsDate(paymentsDate);
                    setDateFilterModal('PAYMENTS');
                  }}
                  className={`flex h-8 w-8 items-center justify-center rounded-xl border transition-all cursor-pointer ${
                    paymentsDate
                      ? 'bg-[#059669] text-white border-[#059669] shadow-xs'
                      : 'bg-white text-gray-500 border-gray-200 hover:text-gray-900 hover:border-gray-300 shadow-2xs'
                  }`}
                  title="Filter payments by date"
                  aria-label="Filter payments by date"
                >
                  <CalendarSearch size={15} />
                </button>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  type="button"
                  id="btn-add-payment-tab"
                  className="flex items-center space-x-1 rounded-xl bg-[#059669] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Active Date Filter Banner for Payments */}
            {paymentsDate && (
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-1.5 border border-emerald-200 text-[11px] text-[#059669]">
                <span className="font-semibold truncate">
                  Filtered: {formatFriendlyDate(paymentsDate)}
                </span>
                <button
                  type="button"
                  onClick={() => setPaymentsDate('')}
                  className="ml-2 font-bold hover:underline shrink-0 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Empty state or Payments list */}
            {filteredPayments.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-center border border-slate-100 shadow-xs">
                <CreditCard size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-bold text-gray-700">
                  {paymentsDate ? 'No Payments on Selected Date' : 'No payments recorded yet.'}
                </p>
                <p className="text-xs text-gray-400 mt-1 max-w-[240px] mx-auto">
                  {paymentsDate
                    ? 'No payment records match the selected date.'
                    : 'Payments received as initial advances with sales or via "Add Payment" will appear here.'}
                </p>
                {paymentsDate && (
                  <button
                    type="button"
                    onClick={() => setPaymentsDate('')}
                    className="mt-3 inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-[#059669] hover:bg-emerald-200 transition-colors cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((pay) => (
                  <div
                    key={pay.id}
                    className="rounded-[22px] bg-white p-4 border border-gray-200/80 shadow-xs space-y-2.5 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-[#059669]">
                          <ArrowDownLeft size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-[14px] font-bold text-[#111827] leading-tight">
                              {pay.isAdvance ? 'Advance Payment' : 'Payment Received'}
                            </h4>
                            <PaymentModeBadge mode={pay.paymentMode} />
                          </div>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">
                            {formatFriendlyDate(pay.date)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-base font-bold text-[#059669] leading-tight">
                          ₹{pay.amount.toLocaleString('en-IN')}
                        </p>
                        <span className="text-[10px] text-gray-400 font-medium">Received</span>
                      </div>
                    </div>

                    {(pay.saleDetails || pay.referenceNumber || pay.bankName || pay.chequeNumber || (pay.notes && pay.notes !== 'Received with sale')) && (
                      <div className="rounded-xl bg-[#f8fafc] p-2.5 px-3 border border-slate-100 text-xs text-gray-600 space-y-1">
                        {pay.saleDetails && (
                          <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                            <span className="text-gray-400 text-[11px]">Sale:</span>
                            <span>{pay.saleDetails}</span>
                          </div>
                        )}
                        {pay.referenceNumber && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400 text-[11px]">Ref / UTR:</span>
                            <span className="font-mono font-bold text-gray-800">{pay.referenceNumber}</span>
                          </div>
                        )}
                        {pay.bankName && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-gray-400 text-[11px]">Bank:</span>
                            <span className="font-semibold text-gray-800">{pay.bankName}</span>
                            {pay.chequeNumber && (
                              <span className="text-gray-500 font-mono font-medium">(Chq: {pay.chequeNumber})</span>
                            )}
                          </div>
                        )}
                        {pay.notes && pay.notes !== 'Received with sale' && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                            <span className="text-gray-400">Note:</span>
                            <span>{pay.notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                  {(['CASH', 'UPI', 'BANK'] as const).map((mode) => (
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

              {/* Previous Balance Carry-Forward Breakdown */}
              <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Previous Outstanding Balance:</span>
                  <span className="font-semibold text-gray-900">
                    ₹ {billingSummary.previousBalance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Current Period Purchases:</span>
                  <span className="font-semibold text-gray-900">
                    + ₹ {billingSummary.currentPurchases.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between text-gray-800 font-bold">
                  <span>Total Amount Due:</span>
                  <span className="text-[#213547]">
                    ₹ {billingSummary.totalAmountDue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Payment Received:</span>
                  <span className="font-semibold">
                    - ₹ {billingSummary.paymentReceived.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between font-bold">
                  <span className="text-[#111827]">Remaining Outstanding Balance:</span>
                  <span className={billingSummary.remainingBalance > 0 ? 'text-[#d97706]' : 'text-[#059669]'}>
                    ₹ {billingSummary.remainingBalance.toLocaleString('en-IN')}
                  </span>
                </div>
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
      {/* Compact Date Range Filter Modal */}
      {dateFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[320px] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between bg-[#213547] px-5 py-4 text-white">
              <div className="flex items-center space-x-2">
                <CalendarSearch size={18} className="text-[#fcd34d]" />
                <h3 className="font-semibold text-sm">
                  {dateFilterModal === 'SALES' ? 'Filter Sales Orders' : 'Filter Payments'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDateFilterModal(null)}
                className="rounded-full p-1 text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Date
                </label>
                <div
                  onClick={() => setIsFilterDatePickerOpen(true)}
                  id="btn-filter-select-date"
                  className={`w-full flex items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-xs transition-colors cursor-pointer shadow-xs ${
                    dateFilterModal === 'SALES'
                      ? 'border-gray-300 hover:border-[#d97706]'
                      : 'border-gray-300 hover:border-[#059669]'
                  }`}
                >
                  <span
                    className={
                      (dateFilterModal === 'SALES' ? tempSalesDate : tempPaymentsDate)
                        ? 'font-semibold text-[#111827]'
                        : 'text-gray-400 font-medium'
                    }
                  >
                    {(dateFilterModal === 'SALES' ? tempSalesDate : tempPaymentsDate)
                      ? formatFriendlyDate(dateFilterModal === 'SALES' ? tempSalesDate : tempPaymentsDate)
                      : 'Select date'}
                  </span>
                  <Calendar
                    size={16}
                    className={dateFilterModal === 'SALES' ? 'text-[#d97706]' : 'text-[#059669]'}
                  />
                </div>

                <DatePickerModal
                  isOpen={isFilterDatePickerOpen}
                  value={
                    (dateFilterModal === 'SALES' ? tempSalesDate : tempPaymentsDate) || getTodayDateString()
                  }
                  title={dateFilterModal === 'SALES' ? 'Select sale date' : 'Select payment date'}
                  onChange={(val) => {
                    if (dateFilterModal === 'SALES') {
                      setTempSalesDate(val);
                    } else {
                      setTempPaymentsDate(val);
                    }
                  }}
                  onClose={() => setIsFilterDatePickerOpen(false)}
                />
              </div>

              {/* Action Buttons: Clear Filter | Apply */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  id="btn-clear-date-filter"
                  onClick={() => {
                    if (dateFilterModal === 'SALES') {
                      setSalesDate('');
                      setTempSalesDate('');
                    } else {
                      setPaymentsDate('');
                      setTempPaymentsDate('');
                    }
                    setDateFilterModal(null);
                  }}
                  className="w-full rounded-xl border border-gray-300 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer"
                >
                  Clear Filter
                </button>
                <button
                  type="button"
                  id="btn-apply-date-filter"
                  onClick={() => {
                    if (dateFilterModal === 'SALES') {
                      setSalesDate(tempSalesDate);
                    } else {
                      setPaymentsDate(tempPaymentsDate);
                    }
                    setDateFilterModal(null);
                  }}
                  className={`w-full rounded-xl py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition-all cursor-pointer ${
                    dateFilterModal === 'SALES'
                      ? 'bg-[#d97706] hover:bg-[#b45309]'
                      : 'bg-[#059669] hover:bg-emerald-700'
                  }`}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
