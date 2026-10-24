'use client';

import React, { useState, use, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { useBrickBook } from '@/context/BrickBookContext';
import DatePickerModal from '@/components/ui/DatePickerModal';
import { BlockType, BLOCK_CONFIGS, PaymentMode } from '@/types';
import { getTodayDateString, formatFriendlyDate } from '@/lib/curingCalculator';
import { validateKeralaVehicleNumber, formatKeralaPlateAsYouType } from '@/lib/vehicleValidator';
import { calculateStockSummary } from '@/lib/fifoEngine';
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect';

const SALE_BRICK_OPTIONS: CustomSelectOption<BlockType>[] = [
  { value: '4inch', label: '4-inch' },
  { value: '6inch', label: '6-inch' },
];

const PAYMENT_MODE_OPTIONS: CustomSelectOption<PaymentMode>[] = [
  { value: 'CASH', label: 'Cash Payment' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK', label: 'Bank Transfer / Cheque' },
  { value: 'CREDIT', label: 'Credit' },
];

function AddSaleContent({ customerId }: { customerId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editSaleId = searchParams.get('editSaleId');

  const {
    getCustomerById,
    productions,
    dispatches,
    addDispatch,
    updateDispatch,
    updateCustomer,
    isLoaded,
  } = useBrickBook();

  const customer = getCustomerById(customerId);
  const existingSale = editSaleId ? dispatches.find((d) => d.id === editSaleId) : undefined;
  const isEditMode = Boolean(editSaleId && existingSale);

  // Form Fields in exact order:
  // 1. Brick Type
  const [blockType, setBlockType] = useState<BlockType>(existingSale?.blockType || '4inch');
  // 2. Sale Date with calendar icon
  const [date, setDate] = useState<string>(existingSale?.date || getTodayDateString());
  // 3. Total Bricks & Rate/Brick (side by side)
  const [quantity, setQuantity] = useState<number | string>(existingSale?.quantity ?? '');
  const [unitPrice, setUnitPrice] = useState<number | string>(existingSale?.unitPrice ?? '');
  // 4. Amount Received & Discount (Optional) (side by side)
  const [amountReceived, setAmountReceived] = useState<number | string>(
    existingSale?.paidAmount !== undefined ? existingSale.paidAmount : ''
  );
  const [discount, setDiscount] = useState<number | string>(
    existingSale?.discount !== undefined ? existingSale.discount : ''
  );
  // 5. Payment Mode dropdown (defaults to CREDIT when amountReceived is ₹0)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(
    existingSale?.paymentMode || 'CREDIT'
  );
  const [lastNonCreditMode, setLastNonCreditMode] = useState<PaymentMode>(
    existingSale?.paymentMode && existingSale.paymentMode !== 'CREDIT'
      ? existingSale.paymentMode
      : 'CASH'
  );
  // 6. Vehicle Number (Mandatory)
  const [vehicleNumber, setVehicleNumber] = useState<string>(
    existingSale?.vehicleNumber || ''
  );
  // 7. Notes
  const [notes, setNotes] = useState<string>(existingSale?.notes || '');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Synchronize when existingSale loads from storage
  const [initializedId, setInitializedId] = useState<string | null>(existingSale?.id || null);

  useEffect(() => {
    if (existingSale && initializedId !== existingSale.id) {
      setBlockType(existingSale.blockType || '4inch');
      setDate(existingSale.date || getTodayDateString());
      setQuantity(existingSale.quantity ?? '');
      setUnitPrice(existingSale.unitPrice ?? '');
      setAmountReceived(existingSale.paidAmount !== undefined ? existingSale.paidAmount : '');
      setDiscount(existingSale.discount !== undefined ? existingSale.discount : '');
      if (existingSale.paymentMode) {
        setPaymentMode(existingSale.paymentMode);
        if (existingSale.paymentMode !== 'CREDIT') {
          setLastNonCreditMode(existingSale.paymentMode);
        }
      }
      setVehicleNumber(existingSale.vehicleNumber || '');
      setNotes(existingSale.notes || '');
      setInitializedId(existingSale.id);
    }
  }, [existingSale, initializedId]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col min-h-full bg-[#f3f4f6]">
        <header className="sticky top-0 z-30 flex h-14 items-center bg-[#213547] px-4 text-white shadow-md">
          <Link href={`/customers/${customerId}`} className="p-1 rounded-full hover:bg-white/10">
            <ArrowLeft size={22} />
          </Link>
          <span className="ml-3 font-bold text-sm">
            {editSaleId ? 'Edit Sale' : 'Add Sale'}
          </span>
        </header>
        <div className="p-8 text-center text-xs text-gray-500">
          Loading sale data...
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col min-h-full bg-[#f3f4f6]">
        <div className="flex h-14 items-center px-4 bg-[#213547] text-white">
          <Link href="/customers" className="p-1 rounded-full hover:bg-white/10">
            <ArrowLeft size={22} />
          </Link>
          <span className="ml-3 font-bold text-sm">Customer Not Found</span>
        </div>
        <div className="p-8 text-center text-xs text-gray-500">
          Customer account does not exist.
        </div>
      </div>
    );
  }

  if (editSaleId && !existingSale) {
    return (
      <div className="flex flex-col min-h-full bg-[#f3f4f6]">
        <header className="sticky top-0 z-30 flex h-14 items-center bg-[#213547] px-4 text-white shadow-md">
          <Link href={`/customers/${customer.id}`} className="p-1 rounded-full hover:bg-white/10">
            <ArrowLeft size={22} />
          </Link>
          <span className="ml-3 font-bold text-sm">Sale Not Found</span>
        </header>
        <div className="p-8 text-center text-xs text-gray-500">
          Sales order not found or may have been deleted.
        </div>
      </div>
    );
  }

  // Handle block type change
  const handleBlockTypeChange = (type: BlockType) => {
    setBlockType(type);
    setErrorMessage(null);
  };

  // Handle amount received change - defaults to Credit when ₹0, restores previous mode when > ₹0
  const handleAmountReceivedChange = (val: string) => {
    setAmountReceived(val);
    const num = Number(val);
    if (!val || isNaN(num) || num <= 0) {
      setPaymentMode('CREDIT');
    } else {
      if (paymentMode === 'CREDIT') {
        setPaymentMode(lastNonCreditMode);
      }
    }
  };

  // Handle payment mode selection
  const handlePaymentModeChange = (mode: PaymentMode) => {
    setPaymentMode(mode);
    if (mode !== 'CREDIT') {
      setLastNonCreditMode(mode);
    }
  };

  const reqQty = Number(quantity) || 0;
  const rate = Number(unitPrice) || 0;
  const subtotal = reqQty * rate;
  const disc = Math.max(0, Number(discount) || 0);
  const totalBill = Math.max(0, subtotal - disc);
  const received = Math.max(0, Number(amountReceived) || 0);
  const balanceDue = Math.max(0, totalBill - received);

  // Real-time stock metrics in yard
  const stockSummary = calculateStockSummary(productions, blockType);
  const readyStock = stockSummary.readyStock;
  const curingLocked = stockSummary.curingStock;
  const availableTotalStock = stockSummary.totalStock;

  // In edit mode, add back the existing sale's quantity when calculating available stock
  const originalQty =
    isEditMode && existingSale && existingSale.blockType === blockType ? existingSale.quantity : 0;
  const maxAvailableStock = availableTotalStock + originalQty;
  const effectiveReadyStock = readyStock + originalQty;

  // Mandatory vehicle plate validation
  const vehicleValidation = vehicleNumber.trim()
    ? validateKeralaVehicleNumber(vehicleNumber)
    : { isValid: false, errorMessage: 'Vehicle number is required.', normalized: '' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (reqQty <= 0) {
      setErrorMessage('Please enter a valid brick quantity.');
      return;
    }

    const todayStr = getTodayDateString();
    if (date > todayStr) {
      setErrorMessage('Sale date cannot be in the future. Please select today or a past date.');
      return;
    }

    if (rate <= 0) {
      setErrorMessage('Rate per brick must be greater than zero.');
      return;
    }

    // Block sale ONLY when requested quantity exceeds total remaining stock in yard
    if (reqQty > maxAvailableStock) {
      setErrorMessage(
        `Insufficient total stock: Requested ${reqQty.toLocaleString(
          'en-IN'
        )} blocks, but only ${maxAvailableStock.toLocaleString(
          'en-IN'
        )} blocks available in yard (${readyStock.toLocaleString(
          'en-IN'
        )} cured, ${curingLocked.toLocaleString('en-IN')} in curing).`
      );
      return;
    }

    if (!vehicleNumber.trim()) {
      setErrorMessage('Vehicle number is required. Please enter a valid Kerala vehicle registration number.');
      return;
    }

    if (!vehicleValidation.isValid) {
      setErrorMessage(
        vehicleValidation.errorMessage || 'Invalid Kerala vehicle registration number (e.g. KL-07-AB-1234).'
      );
      return;
    }

    setIsSubmitting(true);

    if (isEditMode && existingSale) {
      const oldUnpaid = (existingSale.totalAmount || 0) - (existingSale.paidAmount || 0);
      const newUnpaid = totalBill - received;
      const balanceDiff = newUnpaid - oldUnpaid;

      updateDispatch(existingSale.id, {
        date,
        blockType,
        quantity: reqQty,
        unitPrice: rate,
        discount: disc,
        totalAmount: totalBill,
        paidAmount: received,
        paymentMode,
        paymentStatus: received >= totalBill ? 'PAID' : received > 0 ? 'PARTIAL' : 'UNPAID',
        vehicleNumber: vehicleValidation.normalized,
        notes: notes.trim(),
      });

      if (balanceDiff !== 0) {
        const currentCustBal =
          typeof customer.currentBalance === 'number' && !isNaN(customer.currentBalance)
            ? customer.currentBalance
            : Number(customer.openingBalance) || 0;
        updateCustomer(customer.id, {
          currentBalance: currentCustBal + balanceDiff,
        });
      }

      router.push(`/customers/${customer.id}`);
    } else {
      const res = addDispatch({
        customerId: customer.id,
        date,
        blockType,
        quantity: reqQty,
        unitPrice: rate,
        discount: disc,
        amountReceived: received,
        paymentMode,
        vehicleNumber: vehicleValidation.normalized,
        notes: notes.trim(),
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to confirm sale.');
        setIsSubmitting(false);
        return;
      }

      router.push(`/customers/${customer.id}`);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f3f4f6] pb-10">
      {/* 1. Dark Navy Top Header matching Reference Screenshot */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[#213547] px-4 text-white shadow-md">
        <Link
          href={`/customers/${customer.id}`}
          id="header-back-button"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/10 active:scale-95 transition-all"
          aria-label="Back to Customer Profile"
        >
          <ArrowLeft size={22} />
        </Link>

        <h1 className="text-base font-bold tracking-tight text-white text-center">
          {isEditMode ? 'Edit Sale' : 'Add Sale'}
        </h1>

        <div className="w-9" />
      </header>

      <div className="px-4 pt-4">
        {/* 2. Peach/Cream Rounded Container matching Reference Screenshot */}
        <div className="rounded-[26px] bg-[#fdf3e7] border border-amber-200/70 p-4.5 shadow-sm">
          {/* For [Customer Name] */}
          <div className="mb-3.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#d97706]">
              For {customer.name}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="rounded-2xl bg-red-100 border border-red-200 p-3 text-xs font-semibold text-red-800 flex items-start space-x-2">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {reqQty > effectiveReadyStock && reqQty <= maxAvailableStock && (
              <div
                id="warning-exceeds-ready-stock"
                className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs font-semibold text-amber-800 flex items-start space-x-2"
              >
                <AlertCircle size={16} className="text-[#d97706] shrink-0 mt-0.5" />
                <span>
                  Warning: Sale quantity ({reqQty.toLocaleString('en-IN')}) exceeds available Good stock ({readyStock.toLocaleString('en-IN')} cured). Bricks will be dispatched from in-curing batches ({curingLocked.toLocaleString('en-IN')} in curing).
                </span>
              </div>
            )}

            {/* Field 1: Brick Type dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Brick Type *
              </label>
              <CustomSelect<BlockType>
                id="select-brick-type"
                value={blockType}
                onChange={(val) => handleBlockTypeChange(val)}
                options={SALE_BRICK_OPTIONS}
                placeholder="Select Brick Type"
                heightClass="h-12"
                textSizeClass="text-xs font-semibold"
                paddingClass="px-3.5"
                ariaLabel="Select Brick Type"
              />
            </div>

            {/* Field 2: Sale Date with calendar icon */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Sale Date *
              </label>
              <div
                onClick={() => setIsDatePickerOpen(true)}
                className="relative rounded-2xl bg-white border border-gray-300 shadow-xs h-12 flex items-center justify-between px-3.5 cursor-pointer hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Calendar size={17} className="text-gray-400 shrink-0" />
                  <span className="text-xs font-semibold text-[#111827]">
                    {date ? formatFriendlyDate(date) : 'Select date'}
                  </span>
                </div>
              </div>

              <DatePickerModal
                isOpen={isDatePickerOpen}
                value={date}
                title="Select sale date"
                maxDate={getTodayDateString()}
                onChange={(newDate) => {
                  setDate(newDate);
                  setErrorMessage(null);
                }}
                onClose={() => setIsDatePickerOpen(false)}
              />
            </div>

            {/* Field 3: Total Bricks and Rate/Brick (₹) side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Total Bricks *
                </label>
                <div className="rounded-2xl bg-white border border-gray-300 shadow-xs h-12 flex items-center px-3.5">
                  <input
                    type="number"
                    id="input-sale-quantity"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="e.g. 500"
                    required
                    className="no-spinner w-full bg-transparent text-sm font-bold text-[#111827] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Rate/Brick (₹) *
                </label>
                <div className="rounded-2xl bg-white border border-gray-300 shadow-xs h-12 flex items-center px-3.5">
                  <input
                    type="number"
                    id="input-sale-rate"
                    min="1"
                    step="0.5"
                    value={unitPrice}
                    onChange={(e) => {
                      setUnitPrice(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder={`e.g. ${BLOCK_CONFIGS[blockType].defaultUnitPrice}`}
                    required
                    className="no-spinner w-full bg-transparent text-sm font-bold text-[#111827] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Field 4: Amount Received and Discount (Optional) side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Amount Received (₹)
                </label>
                <div className="rounded-2xl bg-white border border-gray-300 shadow-xs h-12 flex items-center px-3.5">
                  <input
                    type="number"
                    id="input-amount-received"
                    min="0"
                    step="1"
                    value={amountReceived}
                    onChange={(e) => handleAmountReceivedChange(e.target.value)}
                    placeholder="0"
                    style={{ MozAppearance: 'textfield' }}
                    className="no-spinner w-full bg-transparent text-sm font-bold text-[#059669] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Discount (Optional)
                </label>
                <div className="rounded-2xl bg-white border border-gray-300 shadow-xs h-12 flex items-center px-3.5">
                  <input
                    type="number"
                    id="input-sale-discount"
                    min="0"
                    step="1"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                    style={{ MozAppearance: 'textfield' }}
                    className="no-spinner w-full bg-transparent text-sm font-bold text-[#d97706] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Field 5: Payment Mode dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Mode
              </label>
              <CustomSelect<PaymentMode>
                id="select-payment-mode"
                value={paymentMode}
                onChange={handlePaymentModeChange}
                options={PAYMENT_MODE_OPTIONS}
                placeholder="Select Payment Mode"
                heightClass="h-12"
                textSizeClass="text-xs font-semibold"
                paddingClass="px-3.5"
                ariaLabel="Select Payment Mode"
              />
            </div>

            {/* Field 6: Vehicle Number (Mandatory) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Vehicle Number *
                </label>
                {vehicleNumber.trim() && (
                  vehicleValidation.isValid ? (
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
              <div className="rounded-2xl bg-white border border-gray-300 shadow-xs h-12 flex items-center px-3.5">
                <Truck size={17} className="text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  id="input-vehicle-number"
                  value={vehicleNumber}
                  onChange={(e) => {
                    const formatted = formatKeralaPlateAsYouType(e.target.value);
                    setVehicleNumber(formatted);
                    setErrorMessage(null);
                  }}
                  placeholder="KL-07-A-1234"
                  required
                  className="w-full bg-transparent text-xs font-bold uppercase tracking-wider text-[#111827] focus:outline-none placeholder-gray-400"
                />
              </div>
            </div>

            {/* Field 7: Notes (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Notes
              </label>
              <div className="rounded-2xl bg-white border border-gray-300 shadow-xs h-12 flex items-center px-3.5">
                <input
                  type="text"
                  id="input-sale-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Site delivery notes"
                  className="w-full bg-transparent text-xs font-medium text-[#111827] focus:outline-none placeholder-gray-400"
                />
              </div>
            </div>

            {/* Highlighted Bill Summary Panel */}
            <div className="rounded-2xl bg-white/95 p-4 border border-amber-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Subtotal ({reqQty} blocks × ₹{rate})</span>
                <span className="font-semibold text-[#111827]">
                  ₹ {subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              {disc > 0 && (
                <div className="flex items-center justify-between text-xs text-[#d97706]">
                  <span>Discount</span>
                  <span className="font-semibold">- ₹ {disc.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-100 pt-2">
                <span className="text-sm font-bold text-[#1a2b3c]">Total Bill</span>
                <span className="text-lg font-bold text-[#d97706]">
                  ₹ {totalBill.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Full-width Amber Primary Action Button */}
            <div className="pt-1">
              <button
                type="submit"
                id={isEditMode ? 'btn-update-sale' : 'btn-confirm-sale'}
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#d97706] py-3.5 text-sm font-bold text-white shadow-xl hover:bg-[#b45309] active:scale-95 disabled:opacity-70 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <CheckCircle2 size={18} />
                <span>
                  {isSubmitting
                    ? isEditMode
                      ? 'Updating...'
                      : 'Confirming...'
                    : isEditMode
                    ? 'Update Sale'
                    : 'Confirm Sale'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AddSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-full bg-[#f3f4f6]">
          <div className="flex h-14 items-center px-4 bg-[#213547] text-white">
            <span className="font-bold text-sm">Loading...</span>
          </div>
        </div>
      }
    >
      <AddSaleContent customerId={resolvedParams.id} />
    </Suspense>
  );
}
