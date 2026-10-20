'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, CheckCircle2, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import DatePickerModal from '@/components/ui/DatePickerModal';
import { useBrickBook } from '@/context/BrickBookContext';
import { BlockType } from '@/types';
import { addDaysToDate, getTodayDateString } from '@/lib/curingCalculator';
import CustomSelect, { CustomSelectOption } from '@/components/ui/CustomSelect';

const BRICK_TYPE_OPTIONS: CustomSelectOption<BlockType>[] = [
  { value: '4inch', label: '4-inch Solid Concrete Block' },
  { value: '6inch', label: '6-inch Solid Concrete Block' },
];

// Formats YYYY-MM-DD to D-M-YYYY without leading zero to match screenshot (e.g. 21-9-2026, 4-10-2026)
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

export default function AddProductionPage() {
  const { addProduction } = useBrickBook();

  // Initial state defaults matching screenshot
  const [blockType, setBlockType] = useState<BlockType | ''>('');
  const [steps, setSteps] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Press calculations: 4" -> 8 bricks/step, 6" -> 5 bricks/step
  const blocksPerStep = blockType === '4inch' ? 8 : 5;
  const numSteps = Number(steps) || 0;
  const brickCount = numSteps > 0 && blockType ? numSteps * blocksPerStep : 0;

  // 14-day curing cycle: production day is Day 1 -> 13 days remaining to completion
  const readyDays = 13;
  const readyDate = addDaysToDate(date || getTodayDateString(), readyDays);
  const readyDateFormatted = formatCustomDate(readyDate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!blockType) {
      setErrorMessage('Please select a brick type.');
      return;
    }

    if (!numSteps || numSteps <= 0) {
      setErrorMessage('Please enter number of steps.');
      return;
    }

    const todayStr = getTodayDateString();
    if (date > todayStr) {
      setErrorMessage('Production date cannot be in the future. Please select today or a past date.');
      return;
    }

    const multiplier = blockType === '4inch' ? 80 : 50;
    const cementBags = Math.max(1, Math.round(brickCount / multiplier));

    const result = addProduction({
      date,
      blockType,
      batchNumber: 'Shift 1',
      cementBags,
      multiplier,
      producedQuantity: brickCount,
      brokenQuantity: 0,
      notes: `${numSteps} steps press batch`,
    });

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to record production.');
      return;
    }

    // Reset form to initial state on successful save
    setBlockType('');
    setSteps('');
    setDate(getTodayDateString());

    setSuccessMessage('Production saved successfully!');
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f3f4f6]">
      {/* Top Header matching exact Navy (#213547) */}
      <Header title="Add Production" showBack={true} backHref="/production" />

      {/* Success Toast Notification */}
      {successMessage && (
        <div
          id="production-success-toast"
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-3 rounded-2xl bg-[#059669] px-4 py-3.5 text-white shadow-xl transition-all max-w-[368px] w-[90%]"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={18} className="shrink-0 text-white" />
            <span className="text-sm font-semibold tracking-wide">
              {successMessage}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="px-4 pt-5 pb-8">
        {/* Large Peach Cream Container matching exact screenshot */}
        <div className="rounded-[26px] bg-[#fdf3e7] border border-amber-200/60 p-5 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="rounded-xl bg-red-100/80 p-3 text-xs font-semibold text-red-700">
                {errorMessage}
              </div>
            )}

            {/* 1. Brick Type Dropdown */}
            <CustomSelect<BlockType>
              id="select-brick-type"
              value={blockType}
              onChange={(val) => {
                setBlockType(val);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              options={BRICK_TYPE_OPTIONS}
              placeholder="Select Brick Type"
              heightClass="h-14"
              textSizeClass="text-[15px]"
              paddingClass="px-4"
              ariaLabel="Select Brick Type"
            />

            {/* 2. Number of Steps Input */}
            <div className="rounded-2xl bg-white border border-gray-300 shadow-xs h-14 flex items-center px-4">
              <input
                type="number"
                min="1"
                value={steps}
                onChange={(e) => {
                  setSteps(e.target.value);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                placeholder="Number of Steps"
                className="w-full bg-transparent text-[15px] font-medium text-gray-800 placeholder-gray-500 focus:outline-none"
              />
            </div>

            {/* 3. Production Date Picker Field */}
            <div
              onClick={() => setIsDatePickerOpen(true)}
              className="relative rounded-2xl bg-white border border-gray-300 shadow-xs py-2.5 px-4 flex items-center justify-between cursor-pointer hover:border-amber-300 transition-colors"
            >
              <div>
                <p className="text-xs font-semibold text-gray-700 leading-tight">
                  Production Date
                </p>
                <p className="text-[14px] font-medium text-gray-900 mt-0.5 leading-tight">
                  {formatCustomDate(date)}
                </p>
              </div>
              <Calendar size={20} className="text-gray-700 shrink-0" />
            </div>

            <DatePickerModal
              isOpen={isDatePickerOpen}
              value={date}
              title="Select date"
              maxDate={getTodayDateString()}
              onChange={(newDate) => {
                setDate(newDate);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              onClose={() => setIsDatePickerOpen(false)}
            />

            {/* 4. Live Curing Preview Summary Card */}
            <div className="rounded-2xl bg-[#fdecdb] p-4 space-y-1.5 mt-2">
              <p className="text-[13px] font-medium text-[#292524]">
                Brick Count: {brickCount}
              </p>
              <p className="text-[13px] font-medium text-[#292524]">
                Ready Days: {readyDays}
              </p>
              <p className="text-[13px] font-medium text-[#292524]">
                Ready Date: {readyDateFormatted}
              </p>
            </div>

            {/* 5. Save Production Button */}
            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-[#d97706] py-3.5 text-center text-[15px] font-bold text-white shadow-md hover:bg-[#b45309] active:scale-[0.99] transition-all cursor-pointer"
            >
              Save Production
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
