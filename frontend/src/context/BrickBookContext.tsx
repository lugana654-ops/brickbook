'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  BlockType,
  ProductionRecord,
  Customer,
  DispatchRecord,
  PaymentRecord,
  PaymentMode,
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
import { isProductionEditable } from '@/lib/productionLimits';

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
  updateProduction: (id: string, input: Partial<ProductionRecord>) => { success: boolean; error?: string };
  deleteProduction: (id: string) => { success: boolean; error?: string };

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
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());

  // Date synchronization listener: refreshes derived statistics and curing readiness as local date advances
  useEffect(() => {
    const checkDate = () => {
      const today = getTodayDateString();
      setCurrentDate((prev) => {
        if (prev !== today) {
          setProductions((prevBatches) => normalizeProductionRecords(prevBatches, today));
          return today;
        }
        return prev;
      });
    };

    const interval = setInterval(checkDate, 15000);
    window.addEventListener('focus', checkDate);
    document.addEventListener('visibilitychange', checkDate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkDate);
      document.removeEventListener('visibilitychange', checkDate);
    };
  }, []);

  // Load state from localStorage on initial mount with dummy data purge guard
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cleanupKey = 'brickbook_dummy_data_cleared_v1';
        if (!localStorage.getItem(cleanupKey)) {
          localStorage.setItem(cleanupKey, 'true');
        }
      }

      const savedUser = getFromStorage<UserSession | null>(STORAGE_KEYS.USER, null);
      if (savedUser) setUser(savedUser);

      // Load production records from brickbook_production_records, also checking legacy brickbook_productions
      const savedRecords = getFromStorage<ProductionRecord[] | null>(STORAGE_KEYS.PRODUCTION_RECORDS, null);
      const savedLegacy = getFromStorage<ProductionRecord[] | null>(STORAGE_KEYS.PRODUCTIONS, null);
      const combinedProd = [
        ...(Array.isArray(savedRecords) ? savedRecords : []),
        ...(Array.isArray(savedLegacy) ? savedLegacy : []),
      ];

      if (combinedProd.length > 0) {
        const prodMap = new Map<string, ProductionRecord>();
        combinedProd.forEach((p) => {
          if (p && p.id && !p.id.startsWith('seed_')) {
            prodMap.set(p.id, p);
          }
        });
        const realProd = Array.from(prodMap.values());
        const normalized = normalizeProductionRecords(realProd);
        setProductions(normalized);
        setToStorage(STORAGE_KEYS.PRODUCTION_RECORDS, normalized);
        setToStorage(STORAGE_KEYS.PRODUCTIONS, normalized);
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
  const saveProductions = (data: ProductionRecord[]): boolean => {
    setProductions(data);
    const okRecords = setToStorage(STORAGE_KEYS.PRODUCTION_RECORDS, data);
    const okProds = setToStorage(STORAGE_KEYS.PRODUCTIONS, data);
    return okRecords || okProds;
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

    // Future date validation guard: production date cannot be in the future
    const todayStr = getTodayDateString();
    if (cleanDate > todayStr) {
      return {
        success: false,
        error: 'Production date cannot be in the future. Please select today or a past date.',
      };
    }

    // Always fetch latest records directly from storage to prevent overwriting or state race conditions
    const storedRecords =
      getFromStorage<ProductionRecord[] | null>(STORAGE_KEYS.PRODUCTION_RECORDS, null) ||
      getFromStorage<ProductionRecord[] | null>(STORAGE_KEYS.PRODUCTIONS, null) ||
      [];

    // Merge in-memory state with stored records to ensure no existing record is lost
    const prodMap = new Map<string, ProductionRecord>();
    productions.forEach((p) => {
      if (p && p.id) prodMap.set(p.id, p);
    });
    storedRecords.forEach((p) => {
      if (p && p.id) prodMap.set(p.id, p);
    });
    const currentRecords = Array.from(prodMap.values());

    // Duplicate Production Date Guard:
    // Prevents duplicate production run entries for the same brick category on the same date unless differentiated by batch number.
    const isDuplicate = currentRecords.some(
      (p) =>
        p.date === cleanDate &&
        p.blockType === input.blockType &&
        p.batchNumber.toLowerCase() === cleanBatch.toLowerCase()
    );

    if (isDuplicate) {
      const blockLabel =
        input.blockType === '4inch'
          ? '4-inch'
          : input.blockType === '6inch'
          ? '6-inch'
          : input.blockType === '8inch'
          ? '8-inch'
          : input.blockType;
      const dateLabel = cleanDate === todayStr ? 'today' : cleanDate;

      return {
        success: false,
        error: `${blockLabel} production for ${dateLabel} is already added. Please choose a different date or edit the existing entry.`,
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

    // Prepend new record to existing records (never overwrites!)
    const updated = [newRecord, ...currentRecords];

    // Commit to localStorage under brickbook_production_records & sync React state
    const isSaved = saveProductions(updated);
    if (!isSaved) {
      return {
        success: false,
        error: 'Failed to persist production record to storage. Please check storage permissions.',
      };
    }

    return { success: true };
  };

  const updateProduction = (id: string, input: Partial<ProductionRecord>): { success: boolean; error?: string } => {
    const storedRecords =
      getFromStorage<ProductionRecord[] | null>(STORAGE_KEYS.PRODUCTION_RECORDS, null) ||
      productions;
    const target = storedRecords.find((p) => p.id === id);
    if (!target) {
      return { success: false, error: 'Production record not found.' };
    }

    if (!isProductionEditable(target)) {
      return {
        success: false,
        error: 'Production records can only be edited within 24 hours of creation.',
      };
    }

    // Preserve original createdAt strictly so editing never resets or extends the 24-hour deadline
    const updated = storedRecords.map((p) => {
      if (p.id === id) {
        const { createdAt: _ignored, ...allowedInput } = input;
        return {
          ...p,
          ...allowedInput,
          createdAt: p.createdAt,
        };
      }
      return p;
    });

    saveProductions(updated);
    return { success: true };
  };

  const deleteProduction = (id: string): { success: boolean; error?: string } => {
    const storedRecords =
      getFromStorage<ProductionRecord[] | null>(STORAGE_KEYS.PRODUCTION_RECORDS, null) ||
      productions;
    const target = storedRecords.find((p) => p.id === id);
    if (!target) {
      return { success: false, error: 'Production record not found.' };
    }

    if (!isProductionEditable(target)) {
      return {
        success: false,
        error: 'Production records can only be deleted within 24 hours of creation.',
      };
    }

    const updated = storedRecords.filter((p) => p.id !== id);
    saveProductions(updated);
    return { success: true };
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

    const todayStr = getTodayDateString();
    if (input.date && input.date > todayStr) {
      return { success: false, error: 'Sale date cannot be in the future. Please select today or a past date.' };
    }

    // Mandatory Kerala Vehicle Number Validation
    if (!input.vehicleNumber || !input.vehicleNumber.trim()) {
      return {
        success: false,
        error: 'Vehicle number is required. Please enter a valid Kerala vehicle number.',
      };
    }
    const vehicleValidation = validateKeralaVehicleNumber(input.vehicleNumber);
    if (!vehicleValidation.isValid) {
      return {
        success: false,
        error: vehicleValidation.errorMessage || 'Invalid Kerala vehicle registration number.',
      };
    }
    const normalizedVehicle = vehicleValidation.normalized;

    const quantity = Number(input.quantity);
    if (quantity <= 0) {
      return { success: false, error: 'Dispatch quantity must be greater than zero.' };
    }

    // Run FIFO allocation and negative inventory guard
    const fifoResult = allocateFIFODispatch(productions, input.blockType, quantity);
    if (!fifoResult.success) {
      return {
        success: false,
        error: fifoResult.errorMessage || 'Insufficient stock.',
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

  // 6. Stock Summary (Live, date-aware calculation source)
  const getStockSummary = (blockType: BlockType): StockSummary => {
    return calculateStockSummary(productions, blockType, currentDate);
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
