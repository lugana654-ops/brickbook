'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Pencil, Calendar as CalendarIcon } from 'lucide-react';

export interface DatePickerModalProps {
  isOpen: boolean;
  value?: string; // Format: YYYY-MM-DD
  onChange: (date: string) => void;
  onClose: () => void;
  minDate?: string; // Format: YYYY-MM-DD
  maxDate?: string; // Format: YYYY-MM-DD
  title?: string;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Safe parsing of YYYY-MM-DD string into local Date components without timezone shifts
function parseDateParts(dateStr?: string): { year: number; month: number; day: number } {
  if (dateStr && dateStr.includes('-')) {
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return { year: parts[0], month: parts[1] - 1, day: parts[2] };
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

function formatDateString(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Formats for header display: "Mon, Sep 21"
function formatHeaderDisplay(year: number, month: number, day: number): string {
  const d = new Date(year, month, day);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

export default function DatePickerModal({
  isOpen,
  value,
  onChange,
  onClose,
  minDate,
  maxDate,
  title = 'Select date',
}: DatePickerModalProps) {
  const parsed = useMemo(() => parseDateParts(value), [value]);

  // Selected date state inside the modal (until confirmed with OK)
  const [selectedYear, setSelectedYear] = useState<number>(parsed.year);
  const [selectedMonth, setSelectedMonth] = useState<number>(parsed.month);
  const [selectedDay, setSelectedDay] = useState<number>(parsed.day);

  // Viewed month/year in calendar navigation
  const [viewYear, setViewYear] = useState<number>(parsed.year);
  const [viewMonth, setViewMonth] = useState<number>(parsed.month);

  // Toggle view modes: 'calendar' | 'yearMonth' | 'manualInput'
  const [viewMode, setViewMode] = useState<'calendar' | 'yearMonth' | 'manualInput'>('calendar');
  const [manualDateText, setManualDateText] = useState<string>('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Reset internal selection when modal opens or value prop changes
  useEffect(() => {
    if (isOpen) {
      const p = parseDateParts(value);
      setSelectedYear(p.year);
      setSelectedMonth(p.month);
      setSelectedDay(p.day);
      setViewYear(p.year);
      setViewMonth(p.month);
      setViewMode('calendar');
      setManualDateText(formatDateString(p.year, p.month, p.day));
      setManualError(null);
    }
  }, [isOpen, value]);

  if (!isOpen) return null;

  // Month calculations
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun, 1 = Mon, ...

  // Check if next month navigation should be disabled due to maxDate
  const isNextMonthDisabled = Boolean(
    maxDate &&
      formatDateString(
        viewMonth === 11 ? viewYear + 1 : viewYear,
        viewMonth === 11 ? 0 : viewMonth + 1,
        1
      ) > maxDate
  );

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (isNextMonthDisabled) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Check if a day is disabled
  const isDateDisabled = (day: number): boolean => {
    const dateStr = formatDateString(viewYear, viewMonth, day);
    if (minDate && dateStr < minDate) return true;
    if (maxDate && dateStr > maxDate) return true;
    return false;
  };

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(day)) return;
    setSelectedYear(viewYear);
    setSelectedMonth(viewMonth);
    setSelectedDay(day);
    setManualDateText(formatDateString(viewYear, viewMonth, day));
    setManualError(null);
  };

  const isConfirmDisabled = Boolean(
    (() => {
      const target =
        viewMode === 'manualInput'
          ? manualDateText
          : formatDateString(selectedYear, selectedMonth, selectedDay);
      if (!target) return true;
      if (maxDate && target > maxDate) return true;
      if (minDate && target < minDate) return true;
      return false;
    })()
  );

  const handleConfirm = () => {
    let finalDateStr = '';
    if (viewMode === 'manualInput') {
      const p = parseDateParts(manualDateText);
      finalDateStr = formatDateString(p.year, p.month, p.day);
    } else {
      finalDateStr = formatDateString(selectedYear, selectedMonth, selectedDay);
    }

    if (maxDate && finalDateStr > maxDate) {
      setManualError(`Date cannot be after ${maxDate}`);
      return;
    }
    if (minDate && finalDateStr < minDate) {
      setManualError(`Date cannot be before ${minDate}`);
      return;
    }

    onChange(finalDateStr);
    onClose();
  };

  const isCurrentSelection = (day: number): boolean => {
    return (
      selectedYear === viewYear &&
      selectedMonth === viewMonth &&
      selectedDay === day
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[2px] p-4 transition-opacity animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[328px] rounded-[32px] bg-[#f7ebe1] border border-amber-200/60 shadow-2xl overflow-hidden flex flex-col text-[#1c1917] select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header matching reference screenshot */}
        <div className="px-6 pt-5 pb-4">
          <p className="text-[13px] font-semibold text-[#57534e] tracking-wide">
            {title}
          </p>
          <div className="mt-1 flex items-center justify-between">
            <h3 className="text-[30px] font-normal tracking-tight text-[#1c1917] leading-tight">
              {formatHeaderDisplay(selectedYear, selectedMonth, selectedDay)}
            </h3>
            <button
              type="button"
              onClick={() =>
                setViewMode((prev) => (prev === 'manualInput' ? 'calendar' : 'manualInput'))
              }
              className="p-1.5 rounded-full text-[#44403c] hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
              aria-label={viewMode === 'manualInput' ? 'Switch to calendar' : 'Manual date input'}
              title={viewMode === 'manualInput' ? 'Switch to calendar' : 'Manual date input'}
            >
              {viewMode === 'manualInput' ? (
                <CalendarIcon size={20} />
              ) : (
                <Pencil size={20} />
              )}
            </button>
          </div>
          <div className="mt-3.5 border-b border-[#e7d5c4]" />
        </div>

        {/* View Mode 1: Month/Year Dropdown Selection */}
        {viewMode === 'yearMonth' ? (
          <div className="px-5 py-4 max-h-[290px] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e7d5c4]">
              <span className="text-sm font-bold text-[#1c1917]">Select Month & Year</span>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className="text-xs font-bold text-[#854d0e] hover:underline"
              >
                Back to Days
              </button>
            </div>

            {/* Year Selector */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Year</p>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                {Array.from({ length: 12 }, (_, i) => viewYear - 5 + i).map((yr) => {
                  const isYearDisabled = Boolean(maxDate && yr > parseDateParts(maxDate).year);
                  return (
                    <button
                      key={yr}
                      type="button"
                      disabled={isYearDisabled}
                      onClick={() => !isYearDisabled && setViewYear(yr)}
                      className={`py-1.5 rounded-xl transition-colors ${
                        isYearDisabled
                          ? 'opacity-30 cursor-not-allowed bg-white/30 text-gray-400'
                          : viewYear === yr
                          ? 'bg-[#854d0e] text-white font-bold cursor-pointer'
                          : 'bg-white/60 text-gray-800 hover:bg-white cursor-pointer'
                      }`}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Month Selector */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Month</p>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-semibold">
                {MONTH_NAMES.map((name, idx) => {
                  const isMonthDisabled = Boolean(
                    maxDate &&
                      viewYear === parseDateParts(maxDate).year &&
                      idx > parseDateParts(maxDate).month
                  );
                  return (
                    <button
                      key={name}
                      type="button"
                      disabled={isMonthDisabled}
                      onClick={() => {
                        if (isMonthDisabled) return;
                        setViewMonth(idx);
                        setViewMode('calendar');
                      }}
                      className={`py-2 rounded-xl transition-colors ${
                        isMonthDisabled
                          ? 'opacity-30 cursor-not-allowed bg-white/30 text-gray-400'
                          : viewMonth === idx
                          ? 'bg-[#854d0e] text-white font-bold cursor-pointer'
                          : 'bg-white/60 text-gray-800 hover:bg-white cursor-pointer'
                      }`}
                    >
                      {name.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : viewMode === 'manualInput' ? (
          /* View Mode 2: Manual Direct Date Input */
          <div className="px-6 py-6 space-y-3">
            <label className="block text-xs font-semibold text-gray-700">
              Enter Date (YYYY-MM-DD)
            </label>
            <input
              type="date"
              value={manualDateText}
              min={minDate}
              max={maxDate}
              onChange={(e) => {
                const val = e.target.value;
                setManualDateText(val);
                if (maxDate && val > maxDate) {
                  setManualError(`Date cannot be after ${maxDate}`);
                  return;
                }
                if (minDate && val < minDate) {
                  setManualError(`Date cannot be before ${minDate}`);
                  return;
                }
                setManualError(null);
                const p = parseDateParts(val);
                setSelectedYear(p.year);
                setSelectedMonth(p.month);
                setSelectedDay(p.day);
                setViewYear(p.year);
                setViewMonth(p.month);
              }}
              className={`w-full rounded-2xl bg-white border px-4 py-3 text-sm font-semibold text-[#1c1917] focus:outline-none focus:ring-2 focus:ring-[#854d0e]/40 ${
                manualError ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-300'
              }`}
            />
            {manualError ? (
              <p className="text-xs font-semibold text-red-600">{manualError}</p>
            ) : (
              <p className="text-[11px] text-gray-500">
                Selected: {formatHeaderDisplay(selectedYear, selectedMonth, selectedDay)}
              </p>
            )}
          </div>
        ) : (
          /* View Mode 3: Exact Calendar Grid matching Screenshot */
          <div className="px-4 pb-2">
            {/* Month Year row with dropdown arrow and navigation arrows */}
            <div className="flex items-center justify-between px-2 pt-1 pb-3">
              <button
                type="button"
                onClick={() => setViewMode('yearMonth')}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#292524] hover:text-[#854d0e] transition-colors cursor-pointer py-1 px-1.5 rounded-lg hover:bg-black/5"
              >
                <span>{`${MONTH_NAMES[viewMonth]} ${viewYear}`}</span>
                <ChevronDown size={16} className="text-[#57534e]" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-full text-[#44403c] hover:bg-black/5 active:scale-95 transition-all cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  disabled={isNextMonthDisabled}
                  onClick={handleNextMonth}
                  className={`p-1.5 rounded-full transition-all ${
                    isNextMonthDisabled
                      ? 'text-[#a8a29e] cursor-not-allowed opacity-30'
                      : 'text-[#44403c] hover:bg-black/5 active:scale-95 cursor-pointer'
                  }`}
                  aria-label="Next month"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Weekday Labels (S M T W T F S) */}
            <div className="grid grid-cols-7 mb-1 text-center">
              {WEEKDAY_LABELS.map((label, idx) => (
                <div
                  key={idx}
                  className="h-8 flex items-center justify-center text-xs font-semibold text-[#57534e]"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* 7-column Calendar Day Grid */}
            <div className="grid grid-cols-7 gap-y-1 text-center">
              {/* Empty leading spacer slots before the 1st day */}
              {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-9 w-9 mx-auto" />
              ))}

              {/* Day cells for current month */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const isSelected = isCurrentSelection(day);
                const disabled = isDateDisabled(day);

                return (
                  <button
                    key={`day-${day}`}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleSelectDay(day)}
                    className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center text-sm transition-all ${
                      isSelected
                        ? 'bg-[#854d0e] text-white font-bold shadow-xs scale-105 cursor-pointer'
                        : disabled
                        ? 'text-[#a8a29e] cursor-not-allowed opacity-40'
                        : 'text-[#1c1917] font-medium hover:bg-black/5 active:scale-95 cursor-pointer'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Action Buttons: Cancel and OK matching Reference Screenshot */}
        <div className="px-6 py-4 flex items-center justify-end gap-6 bg-[#f7ebe1]">
          <button
            type="button"
            onClick={onClose}
            id="btn-calendar-cancel"
            className="text-sm font-bold text-[#854d0e] hover:text-[#713f12] active:scale-95 transition-all cursor-pointer px-1 py-1"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isConfirmDisabled}
            onClick={handleConfirm}
            id="btn-calendar-ok"
            className={`text-sm font-bold transition-all px-1 py-1 ${
              isConfirmDisabled
                ? 'text-[#a8a29e] cursor-not-allowed opacity-40'
                : 'text-[#854d0e] hover:text-[#713f12] active:scale-95 cursor-pointer'
            }`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
