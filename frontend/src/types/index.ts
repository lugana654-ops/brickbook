export type BlockType = '4inch' | '6inch' | '8inch';

export interface BlockConfig {
  id: BlockType;
  name: string;
  nominalSize: string;
  defaultMultiplier: number; // bricks per 50kg cement bag
  defaultUnitPrice: number;  // in INR
}

export const BLOCK_CONFIGS: Record<BlockType, BlockConfig> = {
  '4inch': {
    id: '4inch',
    name: '4-inch Solid Concrete Block',
    nominalSize: '4" Solid',
    defaultMultiplier: 80,
    defaultUnitPrice: 32,
  },
  '6inch': {
    id: '6inch',
    name: '6-inch Solid Concrete Block',
    nominalSize: '6" Solid',
    defaultMultiplier: 50,
    defaultUnitPrice: 48,
  },
  '8inch': {
    id: '8inch',
    name: '8-inch Solid Block',
    nominalSize: '8" Solid',
    defaultMultiplier: 40,
    defaultUnitPrice: 62,
  },
};

export type CuringStatus = 'CURING' | 'READY';

export interface ProductionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  blockType: BlockType;
  batchNumber: string; // e.g. "Shift 1", "Shift 2", "Batch A"
  cementBags: number;
  multiplier: number;
  producedQuantity: number;
  brokenQuantity: number;
  netQuantity: number; // producedQuantity - brokenQuantity
  remainingQuantity: number; // quantity still available for dispatch (FIFO)
  curingStartDate: string; // YYYY-MM-DD
  curingEndDate: string; // YYYY-MM-DD (curingStartDate + 14 days)
  status: CuringStatus;
  daysRemaining: number;
  notes?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  place: string;
  openingBalance: number;
  currentBalance: number;
  createdAt: string;
}

export interface BatchAllocation {
  batchId: string;
  productionDate: string;
  batchNumber: string;
  quantity: number;
}

export interface DispatchRecord {
  id: string;
  customerId: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  blockType: BlockType;
  quantity: number;
  unitPrice: number;
  discount?: number;
  totalAmount: number;
  paidAmount?: number;
  paymentMode?: PaymentMode;
  paymentStatus?: 'PAID' | 'PARTIAL' | 'UNPAID';
  vehicleNumber?: string; // normalized Kerala format KL-XX-YY-ZZZZ
  driverName?: string;
  driverPhone?: string;
  notes?: string;
  allocatedBatches: BatchAllocation[];
  createdAt: string;
}

export type PaymentMode = 'CASH' | 'UPI' | 'BANK';

export interface PaymentRecord {
  id: string;
  customerId: string;
  customerName: string;
  date: string; // YYYY-MM-DD
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber?: string; // UPI UTR or Txn ID
  bankName?: string;
  chequeNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'DISPATCH' | 'PAYMENT' | 'OPENING';
  description: string;
  vehicleNumber?: string;
  debit: number;  // Dispatches (increases balance due)
  credit: number; // Payments (decreases balance due)
  balance: number; // Running balance after this entry
  mode?: PaymentMode;
  reference?: string;
}

export interface UserSession {
  name: string;
  email: string;
  plantName: string;
  location: string;
  phone: string;
  isLoggedIn: boolean;
}
