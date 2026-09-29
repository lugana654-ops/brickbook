"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Calendar as CalendarIcon,
} from "lucide-react";

interface DatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  maxDate?: string; // YYYY-MM-DD
}

export default function DatePickerModal({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  maxDate,
}: DatePickerModalProps) {
  // Set today limit to end of today's date
  const now = new Date();
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  const effectiveMaxDate = maxDate ? new Date(maxDate) : todayEnd;

  const [currentDate, setCurrentDate] = useState<Date>(
    selectedDate ? new Date(selectedDate) : new Date()
  );
  const [tempDate, setTempDate] = useState<Date>(
    selectedDate ? new Date(selectedDate) : new Date()
  );
  const [isInputMode, setIsInputMode] = useState(false);
  const [inputText, setInputText] = useState("");

  const formatInputDate = (d: Date) => {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  };

  useEffect(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      if (!isNaN(d.getTime())) {
        setCurrentDate(d);
        setTempDate(d);
        setInputText(formatInputDate(d));
      }
    }
  }, [selectedDate, isOpen]);

  if (!isOpen) return null;

  const formatHeaderDate = (d: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      month: "short",
      day: "numeric",
    };
    return d.toLocaleDateString("en-US", options);
  };

  const handleOK = () => {
    let finalDate = tempDate;
    if (isInputMode) {
      const parts = inputText.split("/");
      if (parts.length === 3) {
        const parsed = new Date(`${parts[2]}-${parts[0]}-${parts[1]}`);
        if (!isNaN(parsed.getTime())) {
          finalDate = parsed;
        }
      }
    }

    // Strict Future Check: If date is after today, reset to maximum allowed date (Today)
    if (finalDate > effectiveMaxDate) {
      finalDate = new Date(effectiveMaxDate);
    }

    const yyyy = finalDate.getFullYear();
    const mm = String(finalDate.getMonth() + 1).padStart(2, "0");
    const dd = String(finalDate.getDate()).padStart(2, "0");

    onSelectDate(`${yyyy}-${mm}-${dd}`);
    onClose();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const handleDateClick = (day: number) => {
    const clicked = new Date(year, month, day, 0, 0, 0, 0);
    if (clicked > effectiveMaxDate) return; // Prevent click on future dates
    setTempDate(clicked);
  };

  // Next month navigation blocked if currently viewing today's month/year
  const isCurrentOrFutureMonth =
    year > now.getFullYear() ||
    (year === now.getFullYear() && month >= now.getMonth());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans">
      <div className="w-full max-w-[340px] bg-[#f7ebe1] rounded-3xl overflow-hidden shadow-2xl border border-amber-900/10 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-amber-900/10 flex flex-col gap-1">
          <span className="text-xs font-semibold text-amber-900/70">
            Select date
          </span>
          <div className="flex items-center justify-between mt-1">
            <h2 className="text-3xl font-normal text-amber-950">
              {formatHeaderDate(tempDate)}
            </h2>
            <button
              type="button"
              onClick={() => setIsInputMode(!isInputMode)}
              className="p-1.5 rounded-full hover:bg-amber-900/10 text-amber-900 transition-colors cursor-pointer"
            >
              {isInputMode ? (
                <CalendarIcon className="w-5 h-5" />
              ) : (
                <Edit2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {!isInputMode ? (
            /* Grid View */
            <div>
              <div className="flex items-center justify-between px-1 mb-4">
                <span className="text-sm font-semibold text-amber-950">
                  {monthNames[month]} {year}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentDate(new Date(year, month - 1, 1))
                    }
                    className="p-1 rounded-full hover:bg-amber-900/10 text-amber-900 cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    disabled={isCurrentOrFutureMonth}
                    onClick={() =>
                      setCurrentDate(new Date(year, month + 1, 1))
                    }
                    className={`p-1 rounded-full text-amber-900 ${
                      isCurrentOrFutureMonth
                        ? "opacity-20 cursor-not-allowed"
                        : "hover:bg-amber-900/10 cursor-pointer"
                    }`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 text-center text-xs font-medium text-amber-900/70 mb-2">
                <span>S</span>
                <span>M</span>
                <span>T</span>
                <span>W</span>
                <span>T</span>
                <span>F</span>
                <span>S</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const cellDate = new Date(year, month, day, 0, 0, 0, 0);

                  const isSelected =
                    tempDate.getDate() === day &&
                    tempDate.getMonth() === month &&
                    tempDate.getFullYear() === year;

                  // Block any date past today
                  const isFutureDate = cellDate > effectiveMaxDate;

                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={isFutureDate}
                      onClick={() => handleDateClick(day)}
                      className={`h-8 w-8 mx-auto rounded-full flex items-center justify-center font-medium transition-all ${
                        isSelected
                          ? "bg-[#855305] text-white font-bold shadow-sm"
                          : isFutureDate
                            ? "text-amber-900/25 cursor-not-allowed pointer-events-none"
                            : "text-amber-950 hover:bg-amber-900/10 cursor-pointer"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Text Input View */
            <div className="py-4">
              <div className="relative border-2 border-[#855305] rounded-xl p-3 bg-amber-50/50">
                <label className="absolute -top-2.5 left-3 bg-[#f7ebe1] px-1 text-[11px] font-semibold text-[#855305]">
                  Enter Date
                </label>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="MM/DD/YYYY"
                  className="w-full bg-transparent text-sm font-semibold text-amber-950 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-end gap-4 text-xs font-bold text-[#855305]">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full hover:bg-amber-900/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleOK}
            className="px-3 py-1.5 rounded-full hover:bg-amber-900/10 transition-colors cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
