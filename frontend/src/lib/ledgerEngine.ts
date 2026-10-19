import { Customer, DispatchRecord, PaymentRecord, LedgerEntry, BLOCK_CONFIGS } from '@/types';
import { getTodayDateString } from './curingCalculator';

interface RawTransaction {
  date: string;
  createdAt: string;
  type: 'DISPATCH' | 'PAYMENT';
  data: DispatchRecord | PaymentRecord;
}

/**
 * Calculates the complete chronological financial ledger for a customer.
 * 
 * Formula:
 * Running Balance = Opening Balance + Invoiced Dispatches (Debits) - Payments Received (Credits)
 */
export function calculateCustomerLedger(
  customer: Customer,
  allDispatches: DispatchRecord[],
  allPayments: PaymentRecord[]
): LedgerEntry[] {
  const custDispatches = allDispatches.filter((d) => d.customerId === customer.id);
  const custPayments = allPayments.filter((p) => p.customerId === customer.id);

  const rawList: RawTransaction[] = [
    ...custDispatches.map((d) => ({
      date: d.date,
      createdAt: d.createdAt,
      type: 'DISPATCH' as const,
      data: d,
    })),
    ...custPayments.map((p) => ({
      date: p.date,
      createdAt: p.createdAt,
      type: 'PAYMENT' as const,
      data: p,
    })),
  ];

  // Sort chronologically ascending
  rawList.sort((a, b) => {
    const dCmp = a.date.localeCompare(b.date);
    if (dCmp !== 0) return dCmp;
    return a.createdAt.localeCompare(b.createdAt);
  });

  const opening = Number(customer.openingBalance) || 0;
  let runningBalance = opening;
  const ledger: LedgerEntry[] = [];

  // 1. Initial Opening Balance entry
  ledger.push({
    id: `open_${customer.id}`,
    date: customer.createdAt ? customer.createdAt.substring(0, 10) : getTodayDateString(),
    type: 'OPENING',
    description: 'Opening Balance',
    debit: opening > 0 ? opening : 0,
    credit: opening < 0 ? Math.abs(opening) : 0,
    balance: runningBalance,
  });

  // 2. Sequential transaction entries
  for (const item of rawList) {
    if (item.type === 'DISPATCH') {
      const d = item.data as DispatchRecord;
      runningBalance += d.totalAmount;
      const blockCfg = BLOCK_CONFIGS[d.blockType];
      ledger.push({
        id: d.id,
        date: d.date,
        type: 'DISPATCH',
        description: `Dispatch ${d.quantity}x ${blockCfg?.nominalSize || d.blockType} @ Rs.${d.unitPrice}`,
        vehicleNumber: d.vehicleNumber,
        debit: d.totalAmount,
        credit: 0,
        balance: runningBalance,
      });
    } else {
      const p = item.data as PaymentRecord;
      runningBalance -= p.amount;
      ledger.push({
        id: p.id,
        date: p.date,
        type: 'PAYMENT',
        description: `Payment Received (${p.paymentMode}${p.referenceNumber ? ` - ${p.referenceNumber}` : ''})`,
        mode: p.paymentMode,
        reference: p.referenceNumber || p.bankName || p.chequeNumber,
        debit: 0,
        credit: p.amount,
        balance: runningBalance,
      });
    }
  }

  return ledger;
}

/**
 * Calculates a customer's real-time current balance from their opening balance and transaction history.
 */
export function calculateCustomerBalance(
  customer: Customer,
  allDispatches: DispatchRecord[],
  allPayments: PaymentRecord[]
): number {
  const ledger = calculateCustomerLedger(customer, allDispatches, allPayments);
  if (ledger.length === 0) return Number(customer.openingBalance) || 0;
  return ledger[ledger.length - 1].balance;
}
