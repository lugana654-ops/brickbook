'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  BlockType,
  ProductionRecord,
  Customer,
  DispatchRecord,
  PaymentRecord,
  LedgerEntry,
  UserSession,
  BLOCK_CONFIGS,
} from '@/types';
import {
  getTodayDateString,
  calculateCuringStatus,
  addDaysToDate,
  MANDATORY_CURING_DAYS,
} from '@/lib/curingCalculator';
import {
  calculateStockSummary,
  StockSummary,
  allocateFIFODispatch,
  normalizeProductionRecords,
} from '@/lib/fifoEngine';
import { validateKeralaVehicleNumber } from '@/lib/vehicleValidator';

import {
  STORAGE_KEYS,
  ALL_BUSINESS_STORAGE_KEYS,
  getFromStorage,
  setToStorage,
  clearBrickBookStorage,
} from '@/lib/storage';
import { calculateCustomerLedger } from '@/lib/ledgerEngine';

const DEFAULT_USER: UserSession = {
  name: 'Althaf (Manager)',
  email: 'althaf@brickbook.local',
  plantName: 'Kannur Bricks & Hollows',
  location: 'Kannur, Kerala',
  phone: '+91 98470 12345',
  isLoggedIn: true,
};

interface AddProductionInput {
  date: string;
  blockType: BlockType;
  batchNumber: string;
  cementBags: number;
  multiplier: number;
  producedQuantity: number;
  brokenQuantity: number;
  notes?: string;
}

interface AddCustomerInput {
  name: string;
  phone: string;
  place: string;
  openingBalance: number;
}

interface AddDispatchInput {
  customerId: string;
  date: string;
  blockType: BlockType;
  quantity: number;
  unitPrice: number;
  discount?: number;
  amountReceived?: number;
  paymentMode?: PaymentMode;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
}

interface AddPaymentInput {
  customerId: string;
  date: string;
  amount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK';
  referenceNumber?: string;
  bankName?: string;
  chequeNumber?: string;
  notes?: string;
}

interface BrickBookContextType {
  user: UserSession;
  updateUser: (user: Partial<UserSession>) => void;
  productions: ProductionRecord[];
  customers: Customer[];
  dispatches: DispatchRecord[];
  payments: PaymentRecord[];
  isLoaded: boolean;

  // Actions
  addProduction: (input: AddProductionInput) => { success: boolean; error?: string };
  updateProduction: (id: string, input: Partial<ProductionRecord>) => void;
  deleteProduction: (id: string) => void;

  addCustomer: (input: AddCustomerInput) => { success: boolean; customer?: Customer; error?: string };
  updateCustomer: (id: string, input: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomerById: (id: string) => Customer | undefined;

  addDispatch: (input: AddDispatchInput) => { success: boolean; error?: string; dispatchId?: string };
  updateDispatch: (id: string, input: Partial<DispatchRecord>) => void;
  deleteDispatch: (id: string) => void;
  addPayment: (input: AddPaymentInput) => { success: boolean; error?: string; paymentId?: string };

  getCustomerLedger: (customerId: string) => LedgerEntry[];
  getStockSummary: (blockType: BlockType) => StockSummary;

  resetAllData: () => void;
}

const BrickBookContext = createContext<BrickBookContextType | undefined>(undefined);

export function BrickBookProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession>(DEFAULT_USER);
  const [productions, setProductions] = useState<ProductionRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [dispatches, setDispatches] = useState<DispatchRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state from localStorage on initial mount with dummy data purge guard
  useEffect(() => {
    try {
      // 1. One-time purge of any previously seeded dummy/sample data in browser storage
      if (typeof window !== 'undefined' && window.localStorage) {
        const cleanupKey = 'brickbook_dummy_data_cleared_v1';
        if (!localStorage.getItem(cleanupKey)) {
          ALL_BUSINESS_STORAGE_KEYS.forEach((key) => {
            try {
              localStorage.removeItem(key);
            } catch {}
          });
          localStorage.setItem(cleanupKey, 'true');
        }
      }

      const savedUser = getFromStorage<UserSession | null>(STORAGE_KEYS.USER, null);
      if (savedUser) setUser(savedUser);

      const savedProd = getFromStorage<ProductionRecord[] | null>(STORAGE_KEYS.PRODUCTIONS, null);
      if (savedProd && Array.isArray(savedProd)) {
        const realProd = savedProd.filter((p) => !p.id.startsWith('seed_'));
        setProductions(normalizeProductionRecords(realProd));
      }

      const savedCust = getFromStorage<Customer[] | null>(STORAGE_KEYS.CUSTOMERS, null);
      if (savedCust && Array.isArray(savedCust)) {
        const realCust = savedCust.filter((c) => !c.id.startsWith('seed_'));
        setCustomers(
          realCust.map((c) => ({
            ...c,
            openingBalance: Number(c.openingBalance) || 0,
            currentBalance:
              typeof c.currentBalance === 'number' && !isNaN(c.currentBalance)
                ? c.currentBalance
                : Number(c.openingBalance) || 0,
          }))
        );
      }

      const savedDisp = getFromStorage<DispatchRecord[] | null>(STORAGE_KEYS.DISPATCHES, null);
      if (savedDisp && Array.isArray(savedDisp)) {
        const realDisp = savedDisp.filter((d) => !d.id.startsWith('seed_'));
        setDispatches(realDisp);
      }

      const savedPay = getFromStorage<PaymentRecord[] | null>(STORAGE_KEYS.PAYMENTS, null);
      if (savedPay && Array.isArray(savedPay)) {
        const realPay = savedPay.filter((p) => !p.id.startsWith('seed_'));
        setPayments(realPay);
      }
    } catch (e) {
      console.error('Error loading data from storage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to storage when state changes
  const saveProductions = (data: ProductionRecord[]) => {
    setProductions(data);
    setToStorage(STORAGE_KEYS.PRODUCTIONS, data);
  };

  const saveCustomers = (data: Customer[]) => {
    setCustomers(data);
    setToStorage(STORAGE_KEYS.CUSTOMERS, data);
  };

  const saveDispatches = (data: DispatchRecord[]) => {
    setDispatches(data);
    setToStorage(STORAGE_KEYS.DISPATCHES, data);
  };

  const savePayments = (data: PaymentRecord[]) => {
    setPayments(data);
    setToStorage(STORAGE_KEYS.PAYMENTS, data);
  };

  const updateUser = (updated: Partial<UserSession>) => {
    const nextUser = { ...user, ...updated };
    setUser(nextUser);
    setToStorage(STORAGE_KEYS.USER, nextUser);
  };

  // 1. Add Production Batch
  const addProduction = (input: AddProductionInput): { success: boolean; error?: string } => {
    const cleanDate = input.date.trim();
    const cleanBatch = input.batchNumber.trim() || 'Shift 1';

    // Duplicate Production Date Guard:
    // Prevents duplicate production run entries for the same brick category on the same date unless differentiated by batch number.
    const isDuplicate = productions.some(
      (p) =>
        p.date === cleanDate &&
        p.blockType === input.blockType &&
        p.batchNumber.toLowerCase() === cleanBatch.toLowerCase()
    );

    if (isDuplicate) {
      const typeLabel = BLOCK_CONFIGS[input.blockType].name;
      return {
        success: false,
        error: `A production entry for ${typeLabel} on ${cleanDate} (${cleanBatch}) already exists. Please specify a new batch number or edit the existing log.`,
      };
    }

    const netQuantity = Math.max(0, input.producedQuantity - input.brokenQuantity);
    const curingStartDate = cleanDate;
    const curingEndDate = addDaysToDate(cleanDate, MANDATORY_CURING_DAYS);
    const { status, daysRemaining } = calculateCuringStatus(cleanDate);

    const newRecord: ProductionRecord = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: cleanDate,
      blockType: input.blockType,
      batchNumber: cleanBatch,
      cementBags: input.cementBags,
      multiplier: input.multiplier,
      producedQuantity: input.producedQuantity,
      brokenQuantity: input.brokenQuantity,
      netQuantity,
      remainingQuantity: netQuantity,
      curingStartDate,
      curingEndDate,
      status,
      daysRemaining,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    const updated = [newRecord, ...productions];
    saveProductions(updated);
    return { success: true };
  };

  const updateProduction = (id: string, input: Partial<ProductionRecord>) => {
    const updated = productions.map((p) => (p.id === id ? { ...p, ...input } : p));
    saveProductions(updated);
  };

  const deleteProduction = (id: string) => {
    const updated = productions.filter((p) => p.id !== id);
    saveProductions(updated);
  };

  // 2. Add Customer
  const addCustomer = (input: AddCustomerInput): { success: boolean; customer?: Customer; error?: string } => {
    const cleanName = input.name.trim();
    const cleanPhone = input.phone.trim();
    const cleanPlace = input.place.trim();

    if (!cleanName) {
      return { success: false, error: 'Customer name is required.' };
    }
    if (!cleanPhone) {
      return { success: false, error: 'Phone number is required.' };
    }

    const newCust: Customer = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      phone: cleanPhone,
      place: cleanPlace || 'Kerala',
      openingBalance: Number(input.openingBalance) || 0,
      currentBalance: Number(input.openingBalance) || 0,
      createdAt: new Date().toISOString(),
    };

    const updated = [newCust, ...customers];
    saveCustomers(updated);
    return { success: true, customer: newCust };
  };

  const updateCustomer = (id: string, input: Partial<Customer>) => {
    const updated = customers.map((c) => (c.id === id ? { ...c, ...input } : c));
    saveCustomers(updated);
  };

  const deleteCustomer = (id: string) => {
    const updated = customers.filter((c) => c.id !== id);
    saveCustomers(updated);
  };

  const getCustomerById = (id: string) => {
    return customers.find((c) => c.id === id);
  };

  // 3. Add Dispatch / Sale (with FIFO engine & stock validation)
  const addDispatch = (input: AddDispatchInput): { success: boolean; error?: string; dispatchId?: string } => {
    const customer = customers.find((c) => c.id === input.customerId);
    if (!customer) {
      return { success: false, error: 'Customer not found.' };
    }

    // Optional Kerala Vehicle Number Validation
    let normalizedVehicle = '';
    if (input.vehicleNumber && input.vehicleNumber.trim()) {
      const vehicleValidation = validateKeralaVehicleNumber(input.vehicleNumber);
      if (!vehicleValidation.isValid) {
        return {
          success: false,
          error: vehicleValidation.errorMessage || 'Invalid Kerala vehicle registration number.',
        };
      }
      normalizedVehicle = vehicleValidation.normalized;
    }

    const quantity = Number(input.quantity);
    if (quantity <= 0) {
      return { success: false, error: 'Dispatch quantity must be greater than zero.' };
    }

    // Run FIFO allocation and negative inventory guard
    const fifoResult = allocateFIFODispatch(productions, input.blockType, quantity);
    if (!fifoResult.success) {
      return {
        success: false,
        error: fifoResult.errorMessage || 'Insufficient ready stock.',
      };
    }

    const subtotal = quantity * Number(input.unitPrice);
    const discount = Math.max(0, Number(input.discount) || 0);
    const totalAmount = Math.max(0, subtotal - discount);
    const paidAmount = Math.max(0, Number(input.amountReceived) || 0);
    const paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' =
      paidAmount >= totalAmount && totalAmount > 0
        ? 'PAID'
        : paidAmount > 0
        ? 'PARTIAL'
        : 'UNPAID';

    const dispatchId = `disp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newDispatch: DispatchRecord = {
      id: dispatchId,
      customerId: input.customerId,
      customerName: customer.name,
      date: input.date || getTodayDateString(),
      blockType: input.blockType,
      quantity,
      unitPrice: Number(input.unitPrice),
      discount,
      totalAmount,
      paidAmount,
      paymentMode: input.paymentMode,
      paymentStatus,
      vehicleNumber: normalizedVehicle,
      driverName: input.driverName?.trim(),
      driverPhone: input.driverPhone?.trim(),
      notes: input.notes?.trim(),
      allocatedBatches: fifoResult.allocations,
      createdAt: new Date().toISOString(),
    };

    // Commit updated FIFO batches
    saveProductions(fifoResult.updatedBatches);

    // Save dispatch record
    saveDispatches([newDispatch, ...dispatches]);

    // If amount received at sale time, record payment
    if (paidAmount > 0) {
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newPay: PaymentRecord = {
        id: paymentId,
        customerId: input.customerId,
        customerName: customer.name,
        date: input.date || getTodayDateString(),
        amount: paidAmount,
        paymentMode: input.paymentMode || 'CASH',
        notes: `Received with sale`,
        createdAt: new Date().toISOString(),
      };
      savePayments([newPay, ...payments]);
    }

    // Update customer running balance (+totalAmount - paidAmount)
    const updatedCustomers = customers.map((c) =>
      c.id === input.customerId
        ? { ...c, currentBalance: c.currentBalance + totalAmount - paidAmount }
        : c
    );
    saveCustomers(updatedCustomers);

    return { success: true, dispatchId };
  };

  const updateDispatch = (id: string, input: Partial<DispatchRecord>) => {
    const updated = dispatches.map((d) => (d.id === id ? { ...d, ...input } : d));
    saveDispatches(updated);
  };

  const deleteDispatch = (id: string) => {
    const updated = dispatches.filter((d) => d.id !== id);
    saveDispatches(updated);
  };

  // 4. Add Payment
  const addPayment = (input: AddPaymentInput): { success: boolean; error?: string; paymentId?: string } => {
    const customer = customers.find((c) => c.id === input.customerId);
    if (!customer) {
      return { success: false, error: 'Customer not found.' };
    }

    const amount = Number(input.amount);
    if (amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than zero.' };
    }

    // Specific mode validations
    if (input.paymentMode === 'UPI' && !input.referenceNumber?.trim()) {
      return { success: false, error: 'UPI payments require a Reference / UTR Number.' };
    }
    if (input.paymentMode === 'BANK' && !input.bankName?.trim()) {
      return { success: false, error: 'Bank Transfer requires the Bank Name.' };
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newPayment: PaymentRecord = {
      id: paymentId,
      customerId: input.customerId,
      customerName: customer.name,
      date: input.date || getTodayDateString(),
      amount,
      paymentMode: input.paymentMode,
      referenceNumber: input.referenceNumber?.trim(),
      bankName: input.bankName?.trim(),
      chequeNumber: input.chequeNumber?.trim(),
      notes: input.notes?.trim(),
      createdAt: new Date().toISOString(),
    };

    savePayments([newPayment, ...payments]);

    // Update customer balance (-amount)
    const updatedCustomers = customers.map((c) =>
      c.id === input.customerId
        ? { ...c, currentBalance: c.currentBalance - amount }
        : c
    );
    saveCustomers(updatedCustomers);

    return { success: true, paymentId };
  };

  // 5. Customer Ledger Generator
  const getCustomerLedger = (customerId: string): LedgerEntry[] => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return [];
    return calculateCustomerLedger(customer, dispatches, payments);
  };

  // 6. Stock Summary
  const getStockSummary = (blockType: BlockType): StockSummary => {
    return calculateStockSummary(productions, blockType);
  };

  const resetAllData = () => {
    clearBrickBookStorage(true);
    setProductions([]);
    setCustomers([]);
    setDispatches([]);
    setPayments([]);
  };

  return (
    <BrickBookContext.Provider
      value={{
        user,
        updateUser,
        productions,
        customers,
        dispatches,
        payments,
        isLoaded,
        addProduction,
        updateProduction,
        deleteProduction,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerById,
        addDispatch,
        updateDispatch,
        deleteDispatch,
        addPayment,
        getCustomerLedger,
        getStockSummary,
        resetAllData,
      }}
    >
      {children}
    </BrickBookContext.Provider>
  );
}

export function useBrickBook() {
  const context = useContext(BrickBookContext);
  if (!context) {
    throw new Error('useBrickBook must be used within a BrickBookProvider');
  }
  return context;
}
