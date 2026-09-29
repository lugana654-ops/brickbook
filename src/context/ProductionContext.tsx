"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useCustomers } from "@/context/CustomersContext";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface ProductionRecord {
  id: string;
  brickType: "4 inch" | "6 inch";
  stepCount: number;
  quantity: number;       // stepCount * multiplier
  productionDate: string; // YYYY-MM-DD
  goodDate: string;       // YYYY-MM-DD  (productionDate + 14 days)
}

export interface FifoBatch extends ProductionRecord {
  curingAgeDays: number;
  isGood: boolean;
  daysRemainingToGood: number;
  daysRemaining: number;
  allocatedSold: number;
  remainingQuantity: number;
}

export interface InventoryStats {
  today4inch: number;
  today6inch: number;
  total4inch: number;
  total6inch: number;
  good4inch: number;
  good6inch: number;
  curing4inch: number;
  curing6inch: number;
}

interface ProductionContextValue {
  records: ProductionRecord[];
  fifoBatches: FifoBatch[];
  addRecord: (entry: Omit<ProductionRecord, "id">) => void;
  updateRecord: (id: string, entry: Omit<ProductionRecord, "id">) => void;
  deleteRecord: (id: string) => void;
  enrichedRecords: FifoBatch[];
  stats: InventoryStats;
  getAvailableStock: (brickType: "4 inch" | "6 inch") => {
    totalStock: number;
    goodStock: number;
    curingStock: number;
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

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const ProductionContext = createContext<ProductionContextValue | null>(null);

export function ProductionProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const { sales } = useCustomers();

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

  // Dynamic FIFO Calculation
  const { fifoBatches, stats, getAvailableStock } = useMemo(() => {
    const today = getTodayStr();
    const todayDateObj = new Date(today);

    // Sum sales for 4 inch and 6 inch
    let totalSold4inch = 0;
    let totalSold6inch = 0;

    for (const s of sales) {
      if (s.brickType === "4 inch") {
        totalSold4inch += s.brickCount;
      } else if (s.brickType === "6 inch") {
        totalSold6inch += s.brickCount;
      }
    }

    // Sort batches by productionDate ASCENDING (oldest date first)
    const sorted4inch = records
      .filter((r) => r.brickType === "4 inch")
      .sort((a, b) => a.productionDate.localeCompare(b.productionDate));

    const sorted6inch = records
      .filter((r) => r.brickType === "6 inch")
      .sort((a, b) => a.productionDate.localeCompare(b.productionDate));

    const fifoMap = new Map<string, FifoBatch>();

    // Allocate 4 inch sales FIFO
    let unallocated4 = totalSold4inch;
    for (const r of sorted4inch) {
      const allocatedSold = unallocated4 > 0 ? Math.min(r.quantity, unallocated4) : 0;
      unallocated4 -= allocatedSold;
      const remainingQuantity = Math.max(0, r.quantity - allocatedSold);

      const prodDateObj = new Date(r.productionDate);
      const ageDays = Math.floor((todayDateObj.getTime() - prodDateObj.getTime()) / (1000 * 60 * 60 * 24));
      const isGood = ageDays >= 14 || today >= r.goodDate;

      let daysRemainingToGood = 0;
      if (!isGood) {
        const goodDateObj = new Date(r.goodDate);
        daysRemainingToGood = Math.max(0, Math.ceil((goodDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24)));
      }

      fifoMap.set(r.id, {
        ...r,
        curingAgeDays: Math.max(0, ageDays),
        isGood,
        daysRemainingToGood,
        daysRemaining: daysRemainingToGood,
        allocatedSold,
        remainingQuantity,
      });
    }

    // Allocate 6 inch sales FIFO
    let unallocated6 = totalSold6inch;
    for (const r of sorted6inch) {
      const allocatedSold = unallocated6 > 0 ? Math.min(r.quantity, unallocated6) : 0;
      unallocated6 -= allocatedSold;
      const remainingQuantity = Math.max(0, r.quantity - allocatedSold);

      const prodDateObj = new Date(r.productionDate);
      const ageDays = Math.floor((todayDateObj.getTime() - prodDateObj.getTime()) / (1000 * 60 * 60 * 24));
      const isGood = ageDays >= 14 || today >= r.goodDate;

      let daysRemainingToGood = 0;
      if (!isGood) {
        const goodDateObj = new Date(r.goodDate);
        daysRemainingToGood = Math.max(0, Math.ceil((goodDateObj.getTime() - todayDateObj.getTime()) / (1000 * 60 * 60 * 24)));
      }

      fifoMap.set(r.id, {
        ...r,
        curingAgeDays: Math.max(0, ageDays),
        isGood,
        daysRemainingToGood,
        daysRemaining: daysRemainingToGood,
        allocatedSold,
        remainingQuantity,
      });
    }

    const calculatedBatches = records.map((r) => {
      return (
        fifoMap.get(r.id) || {
          ...r,
          curingAgeDays: 0,
          isGood: false,
          daysRemainingToGood: 14,
          daysRemaining: 14,
          allocatedSold: 0,
          remainingQuantity: r.quantity,
        }
      );
    });

    let today4inch = 0;
    let today6inch = 0;
    let total4inch = 0;
    let total6inch = 0;
    let good4inch = 0;
    let good6inch = 0;

    for (const b of calculatedBatches) {
      const is4 = b.brickType === "4 inch";
      if (is4) {
        if (b.productionDate === today) today4inch += b.quantity;
        total4inch += b.remainingQuantity;
        if (b.isGood) good4inch += b.remainingQuantity;
      } else {
        if (b.productionDate === today) today6inch += b.quantity;
        total6inch += b.remainingQuantity;
        if (b.isGood) good6inch += b.remainingQuantity;
      }
    }

    const curing4inch = Math.max(0, total4inch - good4inch);
    const curing6inch = Math.max(0, total6inch - good6inch);

    const getAvailableStockFn = (brickType: "4 inch" | "6 inch") => {
      const is4 = brickType === "4 inch";
      return {
        totalStock: is4 ? total4inch : total6inch,
        goodStock: is4 ? good4inch : good6inch,
        curingStock: is4 ? curing4inch : curing6inch,
      };
    };

    return {
      fifoBatches: calculatedBatches,
      stats: {
        today4inch,
        today6inch,
        total4inch,
        total6inch,
        good4inch,
        good6inch,
        curing4inch,
        curing6inch,
      },
      getAvailableStock: getAvailableStockFn,
    };
  }, [records, sales]);

  return (
    <ProductionContext.Provider
      value={{
        records,
        fifoBatches,
        addRecord,
        updateRecord,
        deleteRecord,
        enrichedRecords: fifoBatches,
        stats,
        getAvailableStock,
      }}
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
