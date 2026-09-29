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
export interface Customer {
  id: string;
  name: string;
  countryCode: string;
  phone: string;
  place: string;
}

export interface Sale {
  id: string;
  customerId: string;
  brickType: "4 inch" | "6 inch";
  brickCount: number;
  ratePerBrick: number;
  totalPayment: number;
  offerAmount: number;
  vehicleNumber: string;
  date: string;
  totalBill: number; // (brickCount * ratePerBrick) - offerAmount
  paymentMode?: string;
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  paymentMode: string;
  offerAmount?: number;
  notes?: string;
}

interface CustomersContextValue {
  customers: Customer[];
  sales: Sale[];
  payments: PaymentRecord[];
  addCustomer: (entry: Omit<Customer, "id">) => string;
  updateCustomer: (id: string, entry: Omit<Customer, "id">) => void;
  deleteCustomer: (id: string) => void;
  addSale: (entry: Omit<Sale, "id" | "totalBill">) => void;
  updateSale: (id: string, entry: Omit<Sale, "id" | "totalBill">) => void;
  getCustomerSales: (customerId: string) => Sale[];
  addPayment: (entry: Omit<PaymentRecord, "id">) => void;
  getCustomerPayments: (customerId: string) => PaymentRecord[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const STORAGE_KEY_CUSTOMERS = "brickbook_customers";
const STORAGE_KEY_SALES = "brickbook_sales";
const STORAGE_KEY_PAYMENTS = "brickbook_payments";

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────
const CustomersContext = createContext<CustomersContextValue | null>(null);

export function CustomersProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Hydrate from LocalStorage once on mount
  useEffect(() => {
    try {
      const rawCustomers = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
      if (rawCustomers) {
        const parsed = JSON.parse(rawCustomers) as Customer[];
        if (Array.isArray(parsed)) setCustomers(parsed);
      }
      
      const rawSales = localStorage.getItem(STORAGE_KEY_SALES);
      if (rawSales) {
        const parsed = JSON.parse(rawSales) as Sale[];
        if (Array.isArray(parsed)) setSales(parsed);
      }

      const rawPayments = localStorage.getItem(STORAGE_KEY_PAYMENTS);
      if (rawPayments) {
        const parsed = JSON.parse(rawPayments) as PaymentRecord[];
        if (Array.isArray(parsed)) setPayments(parsed);
      }
    } catch {
      // corrupted storage
    }
  }, []);

  // Persist whenever customers, sales, or payments change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PAYMENTS, JSON.stringify(payments));
  }, [payments]);

  const addCustomer = useCallback((entry: Omit<Customer, "id">) => {
    const id = generateId();
    const newCustomer: Customer = { ...entry, id };
    setCustomers((prev) => [newCustomer, ...prev]);
    return id;
  }, []);

  const updateCustomer = useCallback((id: string, entry: Omit<Customer, "id">) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id ? { ...entry, id } : c))
    );
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setSales((prev) => prev.filter((s) => s.customerId !== id));
    setPayments((prev) => prev.filter((p) => p.customerId !== id));
  }, []);

  const addSale = useCallback((entry: Omit<Sale, "id" | "totalBill">) => {
    const totalBill = (entry.brickCount * entry.ratePerBrick) - (entry.offerAmount || 0);
    const defaultMode = entry.totalPayment > 0 ? "Cash" : "Credit / Bill";
    const newSale: Sale = {
      ...entry,
      id: generateId(),
      totalBill,
      paymentMode: entry.paymentMode || defaultMode,
    };
    setSales((prev) => [newSale, ...prev]);
  }, []);

  const updateSale = useCallback((id: string, entry: Omit<Sale, "id" | "totalBill">) => {
    const totalBill = (entry.brickCount * entry.ratePerBrick) - (entry.offerAmount || 0);
    const defaultMode = entry.totalPayment > 0 ? "Cash" : "Credit / Bill";
    setSales((prev) =>
      prev.map((s) => (s.id === id ? { ...entry, id, totalBill, paymentMode: entry.paymentMode || defaultMode } : s))
    );
  }, []);

  const getCustomerSales = useCallback(
    (customerId: string) => {
      return sales.filter((s) => s.customerId === customerId);
    },
    [sales]
  );

  const addPayment = useCallback((entry: Omit<PaymentRecord, "id">) => {
    const newPayment: PaymentRecord = {
      ...entry,
      id: generateId(),
    };
    setPayments((prev) => [newPayment, ...prev]);
  }, []);

  const getCustomerPayments = useCallback(
    (customerId: string) => {
      return payments.filter((p) => p.customerId === customerId);
    },
    [payments]
  );

  return (
    <CustomersContext.Provider
      value={{
        customers,
        sales,
        payments,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addSale,
        updateSale,
        getCustomerSales,
        addPayment,
        getCustomerPayments,
      }}
    >
      {children}
    </CustomersContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────
export function useCustomers(): CustomersContextValue {
  const ctx = useContext(CustomersContext);
  if (!ctx) {
    throw new Error("useCustomers must be used inside <CustomersProvider>");
  }
  return ctx;
}
