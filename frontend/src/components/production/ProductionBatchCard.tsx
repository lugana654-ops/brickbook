'use client';

import React from 'react';
import { Clock, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { ProductionRecord } from '@/types';
import { isProductionEditable } from '@/lib/productionLimits';

// Formats YYYY-MM-DD to D-M-YYYY without leading zero (e.g. 29-9-2026, 2-9-2026)
export function formatBatchCardDate(dateStr: string): string {
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

// Calculates press steps: 8 bricks/step for 4", 5 bricks/step for 6"
export function calculatePressSteps(batch: ProductionRecord): number {
  const blocksPerStep = batch.blockType === '4inch' ? 8 : batch.blockType === '6inch' ? 5 : 4;
  return Math.round(batch.producedQuantity / blocksPerStep);
}

// Formats block title to match specification ("4 inch", "6 inch")
export function formatBlockNominal(type: string): string {
  if (type === '4inch') return '4 inch';
  if (type === '6inch') return '6 inch';
  return type.replace('inch', ' inch');
}

export interface ProductionBatchCardProps {
  batch: ProductionRecord;
  onEdit?: (batch: ProductionRecord) => void;
  onDelete?: (id: string, label: string) => void;
}

export function ProductionBatchCard({
  batch,
  onEdit,
  onDelete,
}: ProductionBatchCardProps) {
  const isCuring = batch.status === 'CURING';
  const blockLabel = formatBlockNominal(batch.blockType);
  const steps = calculatePressSteps(batch);
  const prodDate = formatBatchCardDate(batch.date);
  const readyDate = formatBatchCardDate(batch.curingEndDate);
  const isEditable = isProductionEditable(batch);

  return (
    <div className="rounded-2xl bg-white p-3.5 border border-slate-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-start gap-3">
        {/* Amber 3D Isometric Cube Icon */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fef3c7]">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d97706"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
        </div>

        {/* Batch Details Section */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Brick Type and Status Badge */}
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[15px] text-[#111827] leading-tight">
              {blockLabel}
            </h3>

            {isCuring ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2.5 py-0.5 text-[11px] font-semibold text-[#b45309]">
                <Clock size={12} className="stroke-[2.2] text-[#b45309]" />
                <span>{batch.daysRemaining || 14} days left</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#d1fae5] px-2.5 py-0.5 text-[11px] font-semibold text-[#059669]">
                <CheckCircle2 size={12} className="stroke-[2.2] text-[#059669]" />
                <span>Ready</span>
              </span>
            )}
          </div>

          {/* Row 2: Produced Quantity with Press Steps & Action Icons */}
          <div className="flex items-center justify-between mt-1">
            <p className="text-[12px] text-gray-500 font-medium">
              Produced: {batch.producedQuantity} Bricks ({steps} steps)
            </p>

            {(onEdit || onDelete) && (
              <div className="flex items-center gap-2.5 text-gray-400 shrink-0">
                {onEdit && (
                  <button
                    type="button"
                    disabled={!isEditable}
                    onClick={() => isEditable && onEdit(batch)}
                    className={
                      isEditable
                        ? 'hover:text-gray-600 transition-colors p-0.5 active:scale-95 cursor-pointer text-gray-400'
                        : 'opacity-25 cursor-not-allowed p-0.5 text-gray-300 pointer-events-none'
                    }
                    title={isEditable ? 'Edit Batch' : 'Edit Batch (Disabled - 24-hour limit expired)'}
                    aria-label="Edit Batch"
                  >
                    <Pencil size={15} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    disabled={!isEditable}
                    onClick={() => isEditable && onDelete(batch.id, `${blockLabel} on ${prodDate}`)}
                    className={
                      isEditable
                        ? 'hover:text-red-500 transition-colors p-0.5 active:scale-95 cursor-pointer text-gray-400'
                        : 'opacity-25 cursor-not-allowed p-0.5 text-gray-300 pointer-events-none'
                    }
                    title={isEditable ? 'Delete Batch' : 'Delete Batch (Disabled - 24-hour limit expired)'}
                    aria-label="Delete Batch"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Dates Footer */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium mt-3 pt-0.5">
        <span>Prod Date: {prodDate}</span>
        <span>Ready Date: {readyDate}</span>
      </div>
    </div>
  );
}

export default ProductionBatchCard;
