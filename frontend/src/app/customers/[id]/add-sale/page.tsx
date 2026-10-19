'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  AlertCircle,
  Truck,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { useBrickBook } from '@/context/BrickBookContext';
import { BlockType, BLOCK_CONFIGS, PaymentMode } from '@/types';
import { getTodayDateString } from '@/lib/curingCalculator';
import { validateKeralaVehicleNumber } from '@/lib/vehicleValidator';
import { allocateFIFODispatch } from '@/lib/fifoEngine';
import { generateDispatchSlipPDF } from '@/lib/pdfGenerator';

export default function AddSalePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { getCustomerById, productions, addDispatch, user } = useBrickBook();

  const customer = getCustomerById(resolvedParams.id);

  // Form Fields in exact order:
  // 1. Brick Type
  const [blockType, setBlockType] = useState<BlockType>('4inch');
  // 2. Sale Date with calendar icon
  const [date, setDate] = useState<string>(getTodayDateString());
  // 3. Total Bricks & Rate/Brick (side by side)
  const [quantity, setQuantity] = useState<number | string>('');
  const [unitPrice, setUnitPrice] = useState<number | string>(
    BLOCK_CONFIGS['4inch'].defaultUnitPrice
  );
  // 4. Amount Received & Discount (Optional) (side by side)
  const [amountReceived, setAmountReceived] = useState<number | string>('');
  const [discount, setDiscount] = useState<number | string>('');
  // 5. Payment Mode dropdown
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  // 6. Vehicle Number (Optional)
  const [vehicleNumber, setVehicleNumber] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Handle block type change
  const handleBlockTypeChange = (type: BlockType) => {
    setBlockType(type);
    setUnitPrice(BLOCK_CONFIGS[type].defaultUnitPrice);
    setErrorMessage(null);
  };

  const reqQty = Number(quantity) || 0;
  const rate = Number(unitPrice) || 0;
  const subtotal = reqQty * rate;
  const disc = Math.max(0, Number(discount) || 0);
  const totalBill = Math.max(0, subtotal - disc);
  const received = Math.max(0, Number(amountReceived) || 0);
  const balanceDue = Math.max(0, totalBill - received);

  // Real-time FIFO simulation for stock availability
  const fifoSimulation = allocateFIFODispatch(productions, blockType, Math.max(1, reqQty));
  const readyStock = fifoSimulation.availableReadyStock;
  const curingLocked = fifoSimulation.curingStock;
  const availableTotalStock = readyStock + curingLocked;

  // Optional vehicle plate validation
  const vehicleValidation = vehicleNumber.trim()
    ? validateKeralaVehicleNumber(vehicleNumber)
    : { isValid: true, normalized: '' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (reqQty <= 0) {
      setErrorMessage('Please enter a valid brick quantity.');
      return;
    }

    if (rate <= 0) {
      setErrorMessage('Rate per brick must be greater than zero.');
      return;
    }

    if (reqQty > readyStock) {
      setErrorMessage(
        `Insufficient ready stock: Only ${readyStock.toLocaleString(
          'en-IN'
        )} cured blocks available. ${curingLocked.toLocaleString(
          'en-IN'
        )} units are currently in 14-day curing and locked from dispatch.`
      );
      return;
    }

    if (vehicleNumber.trim() && !vehicleValidation.isValid) {
      setErrorMessage(
        vehicleValidation.errorMessage || 'Invalid Kerala vehicle registration number.'
      );
      return;
    }

    setIsSubmitting(true);

    const res = addDispatch({
      customerId: customer.id,
      date,
      blockType,
      quantity: reqQty,
      unitPrice: rate,
      discount: disc,
      amountReceived: received,
      paymentMode,
      vehicleNumber: vehicleNumber.trim() ? vehicleValidation.normalized : undefined,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to confirm sale.');
      setIsSubmitting(false);
      return;
    }

    // Redirect to customer profile page
    router.push(`/customers/${customer.id}`);
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
          New Sale
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

          {/* Compact Stock Availability Panel */}
          <div className="rounded-2xl bg-white p-3 border border-amber-200/80 shadow-2xs space-y-1.5 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1a2b3c] flex items-center space-x-1.5">
                <Package size={14} className="text-[#d97706]" />
                <span>{BLOCK_CONFIGS[blockType].name}</span>
              </span>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  readyStock > 0 ? 'bg-emerald-100 text-[#059669]' : 'bg-red-50 text-red-600'
                }`}
              >
                {readyStock.toLocaleString('en-IN')} Cured / Good
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-0.5">
              <span>
                Total Yard Stock:{' '}
                <strong className="text-gray-800">
                  {availableTotalStock.toLocaleString('en-IN')}
                </strong>
              </span>
              <span>
                In Curing:{' '}
                <strong className="text-[#d97706]">
                  {curingLocked.toLocaleString('en-IN')}
                </strong>
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="rounded-2xl bg-red-100 border border-red-200 p-3 text-xs font-semibold text-red-800 flex items-start space-x-2">
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Field 1: Brick Type dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Brick Type *
              </label>
              <div className="relative rounded-2xl bg-white border border-gray-300 shadow-xs h-12 flex items-center px-3.5">
                <select
                  id="select-brick-type"
                  value={blockType}
                  onChange={(e) => handleBlockTypeChange(e.target.value as BlockType)}
                  className="w-full h-full bg-transparent text-xs font-semibold text-[#111827] focus:outline-none cursor-pointer"
                >
                  <option value="4inch">4-inch Solid Concrete Block (32 ₹/blk)</option>
                  <option value="6inch">6-inch Solid Concrete Block (48 ₹/blk)</option>
                  <option value="8inch">8-inch Hollow Block (62 ₹/blk)</option>
                </select>
              </div>
            </div>

            {/* Field 2: Sale Date with calendar icon */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Sale Date *
              </label>
              <div className="relative rounded-2xl bg-white border border-gray-300 shadow-xs h-12 flex items-center px-3.5">
                <Calendar size={17} className="text-gray-400 mr-2 shrink-0" />
                <input
                  type="date"
                  id="input-sale-date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full h-full bg-transparent text-xs font-semibold text-[#111827] focus:outline-none"
                />
              </div>
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
                    className="w-full bg-transparent text-sm font-bold text-[#111827] focus:outline-none"
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
                    required
                    className="w-full bg-transparent text-sm font-bold text-[#111827] focus:outline-none"
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
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent text-sm font-bold text-[#059669] focus:outline-none placeholder-gray-400"
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
                    className="w-full bg-transparent text-sm font-bold text-[#d97706] focus:outline-none placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Field 5: Payment Mode dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Payment Mode
              </label>
              <div className="relative rounded-2xl bg-white border border-gray-300 shadow-xs h-12 flex items-center px-3.5">
                <select
                  id="select-payment-mode"
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                  className="w-full h-full bg-transparent text-xs font-semibold text-[#111827] focus:outline-none cursor-pointer"
                >
                  <option value="CASH">Cash Payment</option>
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="BANK">Bank Transfer / Cheque</option>
                </select>
              </div>
            </div>

            {/* Field 6: Vehicle Number (Optional) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-700">
                  Vehicle Number (Optional)
                </label>
                {vehicleNumber.trim() && vehicleValidation.isValid && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-bold text-[#059669]">
                    Valid MVD
                  </span>
                )}
              </div>
              <div className="rounded-2xl bg-white border border-gray-300 shadow-xs h-12 flex items-center px-3.5">
                <Truck size={17} className="text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  id="input-vehicle-number"
                  value={vehicleNumber}
                  onChange={(e) => {
                    setVehicleNumber(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. KL-07-AB-1234 or KL 13 9999"
                  className="w-full bg-transparent text-xs font-bold uppercase tracking-wider text-[#111827] focus:outline-none placeholder-gray-400"
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

              {received > 0 && (
                <div className="flex items-center justify-between text-xs text-[#059669] pt-0.5">
                  <span>Amount Paid ({paymentMode})</span>
                  <span className="font-bold">- ₹ {received.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-dashed border-gray-200 pt-1.5">
                <span>Net Due Added to Ledger</span>
                <span className="font-bold text-[#111827]">
                  ₹ {balanceDue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Full-width Amber Confirm Sale Button */}
            <div className="pt-1">
              <button
                type="submit"
                id="btn-confirm-sale"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#d97706] py-3.5 text-sm font-bold text-white shadow-xl hover:bg-[#b45309] active:scale-95 disabled:opacity-70 transition-all flex items-center justify-center space-x-2"
              >
                <CheckCircle2 size={18} />
                <span>{isSubmitting ? 'Confirming...' : 'Confirm Sale'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
