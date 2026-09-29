"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface ProductionRecord {
  id: string;
  brickType: "4 inch" | "6 inch";
  stepCount: number;
  quantity: number;       // stepCount * multiplier
  productionDate: string; // YYYY-MM-DD
  goodDate: string;       // YYYY-MM-DD  (productionDate + 13 days)
}

export interface EnrichedRecord extends ProductionRecord {
  isGood: boolean;
  daysRemaining: number;
}

interface ProductionContextValue {
  records: ProductionRecord[];
  addRecord: (entry: Omit<ProductionRecord, "id">) => void;
  updateRecord: (id: string, entry: Omit<ProductionRecord, "id">) => void;
  deleteRecord: (id: string) => void;
  enrichedRecords: EnrichedRecord[];
  // Computed dashboard stats
  stats: {
    today4inch: number;
    today6inch: number;
    total4inch: number;
    total6inch: number;
    good4inch: number;
    good6inch: number;
  };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const STORAGE_KEY = "brickbook_production_records";

function getTodayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function enrich(record: ProductionRecord): EnrichedRecord {
  const today = getTodayStr();
  const isGood = today >= record.goodDate;
  let daysRemaining = 0;
  if (!isGood) {
    const todayMs = new Date(today).getTime();
    const goodMs = new Date(record.goodDate).getTime();
    daysRemaining = Math.ceil((goodMs - todayMs) / (1000 * 60 * 60 * 24));
  }
  return { ...record, isGood, daysRemaining };
}

function computeStats(records: ProductionRecord[]) {
  const today = getTodayStr();
  let today4inch = 0;
  let today6inch = 0;
  let total4inch = 0;
  let total6inch = 0;
  let good4inch = 0;
  let good6inch = 0;

  for (const r of records) {
    const is4 = r.brickType === "4 inch";
    const isGood = today >= r.goodDate;

    if (is4) {
      total4inch += r.quantity;
      if (r.productionDate === today) today4inch += r.quantity;
      if (isGood) good4inch += r.quantity;
    } else {
      total6inch += r.quantity;
      if (r.productionDate === today) today6inch += r.quantity;
      if (isGood) good6inch += r.quantity;
    }
  }

  return { today4inch, today6inch, total4inch, total6inch, good4inch, good6inch };
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const ProductionContext = createContext<ProductionContextValue | null>(null);

export function ProductionProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<ProductionRecord[]>([]);

  // Hydrate from LocalStorage once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ProductionRecord[];
        if (Array.isArray(parsed)) setRecords(parsed);
      }
    } catch {
      // corrupted storage — start fresh
    }
  }, []);

  // Persist whenever records change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const addRecord = useCallback((entry: Omit<ProductionRecord, "id">) => {
    const newRecord: ProductionRecord = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setRecords((prev) => [newRecord, ...prev]);
  }, []);

  const updateRecord = useCallback((id: string, entry: Omit<ProductionRecord, "id">) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...entry, id } : r))
    );
  }, []);

  const deleteRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const enrichedRecords = records.map(enrich);
  const stats = computeStats(records);

  return (
    <ProductionContext.Provider
      value={{ records, addRecord, updateRecord, deleteRecord, enrichedRecords, stats }}
    >
      {children}
    </ProductionContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export function useProduction(): ProductionContextValue {
  const ctx = useContext(ProductionContext);
  if (!ctx) {
    throw new Error("useProduction must be used inside <ProductionProvider>");
  }
  return ctx;
}
