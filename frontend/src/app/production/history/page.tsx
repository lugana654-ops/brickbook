'use client';

import React, { useState, useRef } from 'react';
import { Search, Calendar, Pencil, X } from 'lucide-react';
import Header from '@/components/layout/Header';
import DatePickerModal from '@/components/ui/DatePickerModal';
import {
  ProductionBatchCard,
  formatBatchCardDate,
  formatBlockNominal,
} from '@/components/production/ProductionBatchCard';
import { useBrickBook } from '@/context/BrickBookContext';
import { ProductionRecord } from '@/types';
import { isProductionEditable } from '@/lib/productionLimits';
import { getTodayDateString } from '@/lib/curingCalculator';

// Parses manual date input into YYYY-MM-DD to detect future dates
function parseUserDateInput(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    const y = parseInt(ymdMatch[1], 10);
    const m = parseInt(ymdMatch[2], 10);
    const d = parseInt(ymdMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Pattern 2: D-M-YYYY or DD-MM-YYYY or D/M/YYYY or DD/MM/YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Pattern 3: e.g. "25 Oct 2026", "25 October 2026", "Oct 25, 2026"
  const textDateMatch =
    trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/) ||
    trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (textDateMatch) {
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = parsed.getMonth() + 1;
      const d = parsed.getDate();
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  return null;
}

export default function ProductionHistoryPage() {
  const { productions, deleteProduction, updateProduction } = useBrickBook();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterError, setDateFilterError] = useState<string | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Edit Modal State
  const [editingBatch, setEditingBatch] = useState<ProductionRecord | null>(null);
  const [editProduced, setEditProduced] = useState<string>('');
  const [editRemaining, setEditRemaining] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    const parsedDate = parseUserDateInput(value);
    const today = getTodayDateString();
    if (parsedDate && parsedDate > today) {
      setDateFilterError('Future dates cannot be searched.');
    } else {
      setDateFilterError(null);
    }
  };

  // Filter dynamic productions only - no dummy values
  const filteredBatches = productions.filter((batch) => {
    // If a future date was entered, do not run search or apply filter
    if (dateFilterError) return true;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const label = formatBlockNominal(batch.blockType).toLowerCase();
    const prodDate = formatBatchCardDate(batch.date).toLowerCase();
    const readyDate = formatBatchCardDate(batch.curingEndDate).toLowerCase();
    const rawDate = batch.date.toLowerCase();
    const statusText = batch.status === 'CURING' ? `${batch.daysRemaining || 14} days left` : 'ready';

    return (
      label.includes(q) ||
      prodDate.includes(q) ||
      readyDate.includes(q) ||
      rawDate.includes(q) ||
      statusText.includes(q) ||
      batch.producedQuantity.toString().includes(q) ||
      (batch.remainingQuantity ?? batch.producedQuantity).toString().includes(q)
    );
  });

  const handleRefresh = () => {
    setSearchQuery('');
    setDateFilterError(null);
  };



  const handleDelete = (id: string, label: string) => {
    const target = productions.find((p) => p.id === id);
    if (!target || !isProductionEditable(target)) {
      alert('This production record cannot be deleted because the 24-hour window has expired.');
      return;
    }

    if (window.confirm(`Delete production batch for ${label}?`)) {
      const res = deleteProduction(id);
      if (res && !res.success && res.error) {
        alert(res.error);
      }
    }
  };

  const openEditModal = (batch: ProductionRecord) => {
    if (!isProductionEditable(batch)) {
      alert('This production record cannot be edited because the 24-hour window has expired.');
      return;
    }
    setEditingBatch(batch);
    setEditProduced(String(batch.producedQuantity));
    setEditRemaining(String(batch.remainingQuantity ?? batch.producedQuantity));
    setEditNotes(batch.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    if (!isProductionEditable(editingBatch)) {
      alert('This production record cannot be edited because the 24-hour window has expired.');
      setEditingBatch(null);
      return;
    }

    const produced = Number(editProduced) || 0;
    const remaining = Number(editRemaining) || 0;

    const res = updateProduction(editingBatch.id, {
      producedQuantity: produced,
      remainingQuantity: remaining,
      netQuantity: produced,
      notes: editNotes.trim() || undefined,
    });

    if (res && !res.success && res.error) {
      alert(res.error);
    }

    setEditingBatch(null);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f3f4f6]">
      {/* Top Header matching exact Navy (#213547) with Back Arrow & Refresh */}
      <Header
        title="Production History"
        showBack={true}
        backHref="/production"
        onRefresh={handleRefresh}
      />

      <div className="px-4 py-3.5 space-y-3">
        {/* Search Bar matching screenshot: rounded-2xl, search icon left, calendar right */}
        <div className="relative flex items-center rounded-2xl bg-white px-3.5 py-2.5 border border-slate-200/90 shadow-xs">
          <Search size={18} className="text-gray-400 shrink-0 mr-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search date or brick type"
            className="w-full bg-transparent text-sm text-[#111827] placeholder-gray-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setDateFilterError(null);
              }}
              className="mr-1.5 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsDatePickerOpen(true)}
            className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 ml-1 cursor-pointer"
            title="Pick date"
          >
            <Calendar size={18} />
          </button>

          <DatePickerModal
            isOpen={isDatePickerOpen}
            title="Filter by date"
            maxDate={getTodayDateString()}
            futureDateErrorMessage="Future dates cannot be searched."
            onChange={(newDate) => {
              const today = getTodayDateString();
              if (newDate > today) {
                setDateFilterError('Future dates cannot be searched.');
                return;
              }
              setDateFilterError(null);
              setSearchQuery(formatBatchCardDate(newDate));
            }}
            onClose={() => setIsDatePickerOpen(false)}
          />
        </div>

        {/* Future date filter warning message */}
        {dateFilterError && (
          <div
            id="future-date-filter-error"
            role="alert"
            className="rounded-2xl bg-red-50 border border-red-200/80 px-3.5 py-2.5 text-xs font-semibold text-red-700 flex items-center justify-between"
          >
            <span>{dateFilterError}</span>
            <button
              type="button"
              onClick={() => {
                setDateFilterError(null);
                setSearchQuery('');
              }}
              className="text-red-400 hover:text-red-600 transition-colors cursor-pointer p-0.5 ml-2"
              aria-label="Dismiss error"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Records Count matching screenshot */}
        <div className="text-xs text-gray-500 font-medium px-1">
          Records: {filteredBatches.length}
        </div>

        {/* Batches List matching exact card layout */}
        {filteredBatches.length > 0 && (
          <div className="space-y-3">
            {filteredBatches.map((batch) => (
              <ProductionBatchCard
                key={batch.id}
                batch={batch}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Production Batch Modal */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[360px] overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#213547] px-5 py-4 text-white">
              <div className="flex items-center space-x-2">
                <Pencil size={18} className="text-[#fcd34d]" />
                <span className="font-bold text-sm">
                  Edit {formatBlockNominal(editingBatch.blockType)} Batch
                </span>
              </div>
              <button
                onClick={() => setEditingBatch(null)}
                className="rounded-full p-1 text-white/80 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Produced Bricks
                </label>
                <input
                  type="number"
                  value={editProduced}
                  onChange={(e) => setEditProduced(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#d97706] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Remaining Yard Stock
                </label>
                <input
                  type="number"
                  value={editRemaining}
                  onChange={(e) => setEditRemaining(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#d97706] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Shift 1 morning production"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#d97706] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#d97706] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#b45309]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
