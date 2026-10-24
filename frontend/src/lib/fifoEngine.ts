import { BlockType, ProductionRecord, BatchAllocation } from '@/types';
import { calculateCuringStatus, getTodayDateString } from './curingCalculator';

export interface StockSummary {
  blockType: BlockType;
  todayProduced: number; // Remaining quantity produced today
  totalStock: number;    // Total remaining stock in yard (curing + ready)
  totalAvailable: number; // Alias for totalStock
  totalProduced: number; // Alias for totalStock (backward compatibility)
  curingStock: number;   // In 14-day curing cycle (locked)
  readyStock: number;    // Fully cured (>=14 days) and eligible for dispatch ("Good" stock)
}

/**
 * Normalizes all production records with real-time curing status based on today's date.
 */
export function normalizeProductionRecords(
  records: ProductionRecord[],
  currentDateStr: string = getTodayDateString()
): ProductionRecord[] {
  return records.map((record) => {
    const calculated = calculateCuringStatus(record.date, currentDateStr);
    return {
      ...record,
      status: calculated.status,
      daysRemaining: calculated.daysRemaining,
      curingEndDate: record.curingEndDate || calculated.curingEndDate,
    };
  });
}

/**
 * Calculates real-time stock metrics for a specific block type.
 */
export function calculateStockSummary(
  records: ProductionRecord[],
  blockType: BlockType,
  currentDateStr: string = getTodayDateString()
): StockSummary {
  const normalized = normalizeProductionRecords(records, currentDateStr);
  const typeRecords = normalized.filter((r) => r.blockType === blockType);

  let todayProduced = 0;
  let totalStock = 0;
  let curingStock = 0;
  let readyStock = 0;

  for (const record of typeRecords) {
    // Future-dated production records must not be counted as today's production or valid stock
    if (record.date > currentDateStr) {
      continue;
    }

    const remaining = Math.max(0, Number(record.remainingQuantity ?? record.netQuantity) || 0);

    // 1. Today's Production:
    // If a production record's Production Date matches today's local date,
    // include its remaining quantity in the corresponding Today statistic.
    if (record.date === currentDateStr) {
      todayProduced += remaining;
    }

    // 2. Total Stock:
    // Include remaining stock of all valid production records (past or today).
    // Depleted or sold bricks (remainingQuantity === 0) contribute 0.
    totalStock += remaining;

    // 3. Good / Ready Stock vs 4. Curing Stock:
    if (record.status === 'READY') {
      readyStock += remaining;
    } else {
      curingStock += remaining;
    }
  }

  return {
    blockType,
    todayProduced,
    totalStock,
    totalAvailable: totalStock,
    totalProduced: totalStock,
    curingStock,
    readyStock,
  };
}

export interface FIFOAllocationResult {
  success: boolean;
  allocations: BatchAllocation[];
  updatedBatches: ProductionRecord[];
  errorMessage?: string;
  availableReadyStock: number;
  curingStock: number;
  totalStock: number;
  exceedsReadyStock: boolean;
}

/**
 * First-In, First-Out (FIFO) allocation engine for brick dispatches.
 *
 * Rules:
 * 1. Sales are allowed from both Good / Ready stock and In-Curing stock.
 * 2. Batches are allocated oldest first based on productionDate.
 * 3. Batches with remainingQuantity > 0 are deducted in FIFO order.
 * 4. Only block a sale when requestedQuantity exceeds total remaining yard stock for that brick type.
 * 5. Recalculate Good stock and Curing stock based on each batch's remaining quantity after FIFO allocation.
 */
export function allocateFIFODispatch(
  allBatches: ProductionRecord[],
  blockType: BlockType,
  requestedQuantity: number,
  currentDateStr: string = getTodayDateString()
): FIFOAllocationResult {
  const normalized = normalizeProductionRecords(allBatches, currentDateStr);

  // Filter valid batches for the requested block type (exclude future-dated records)
  const matchingTypeBatches = normalized.filter(
    (b) => b.blockType === blockType && b.date <= currentDateStr
  );

  // Pre-allocation stock metrics in yard
  let initialReadyStock = 0;
  let initialCuringStock = 0;
  let initialTotalStock = 0;

  for (const b of matchingTypeBatches) {
    const rem = Math.max(0, Number(b.remainingQuantity ?? b.netQuantity) || 0);
    initialTotalStock += rem;
    if (b.status === 'READY') {
      initialReadyStock += rem;
    } else {
      initialCuringStock += rem;
    }
  }

  if (requestedQuantity <= 0) {
    return {
      success: false,
      allocations: [],
      updatedBatches: allBatches,
      errorMessage: 'Requested quantity must be greater than zero.',
      availableReadyStock: initialReadyStock,
      curingStock: initialCuringStock,
      totalStock: initialTotalStock,
      exceedsReadyStock: false,
    };
  }

  // Stock Validation Guard: Block ONLY when requestedQuantity exceeds total remaining yard stock
  if (requestedQuantity > initialTotalStock) {
    return {
      success: false,
      allocations: [],
      updatedBatches: allBatches,
      errorMessage: `Insufficient stock. Requested: ${requestedQuantity.toLocaleString('en-IN')}, Available in yard: ${initialTotalStock.toLocaleString('en-IN')} (${initialReadyStock.toLocaleString('en-IN')} cured, ${initialCuringStock.toLocaleString('en-IN')} in curing).`,
      availableReadyStock: initialReadyStock,
      curingStock: initialCuringStock,
      totalStock: initialTotalStock,
      exceedsReadyStock: requestedQuantity > initialReadyStock,
    };
  }

  // FIFO Allocation:
  // 1. Deduct Good / Ready (cured) stock first, exhausting Good stock to 0 if needed.
  // 2. Deduct any remaining needed quantity from the oldest available curing production batch first (FIFO).
  const eligibleBatches = matchingTypeBatches
    .filter((b) => (b.remainingQuantity ?? b.netQuantity) > 0)
    .sort((a, b) => {
      // Step 1: Deduct Good / Ready bricks first
      const aIsReady = a.status === 'READY';
      const bIsReady = b.status === 'READY';
      if (aIsReady && !bIsReady) return -1;
      if (!aIsReady && bIsReady) return 1;

      // Step 2: FIFO by oldest production date first
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      const createdA = a.createdAt || '';
      const createdB = b.createdAt || '';
      return createdA.localeCompare(createdB);
    });

  let qtyNeeded = requestedQuantity;
  const allocations: BatchAllocation[] = [];
  const allocatedBatchMap = new Map<string, number>();

  for (const batch of eligibleBatches) {
    if (qtyNeeded <= 0) break;

    const currentRem = Math.max(0, Number(batch.remainingQuantity ?? batch.netQuantity) || 0);
    if (currentRem <= 0) continue;

    const allocQty = Math.min(currentRem, qtyNeeded);
    allocations.push({
      batchId: batch.id,
      productionDate: batch.date,
      batchNumber: batch.batchNumber,
      quantity: allocQty,
    });

    const newRemaining = currentRem - allocQty;
    allocatedBatchMap.set(batch.id, newRemaining);
    qtyNeeded -= allocQty;
  }

  // Update batch remaining quantities in the returned batch list
  const updatedBatches = normalized.map((batch) => {
    if (allocatedBatchMap.has(batch.id)) {
      return {
        ...batch,
        remainingQuantity: allocatedBatchMap.get(batch.id)!,
      };
    }
    return batch;
  });

  // Recalculate Good stock and Curing stock based on each batch's remaining quantity after FIFO allocation
  let remainingReadyStock = 0;
  let remainingCuringStock = 0;
  let remainingTotalStock = 0;

  for (const b of updatedBatches) {
    if (b.blockType === blockType && b.date <= currentDateStr) {
      const rem = Math.max(0, Number(b.remainingQuantity ?? b.netQuantity) || 0);
      remainingTotalStock += rem;
      if (b.status === 'READY') {
        remainingReadyStock += rem;
      } else {
        remainingCuringStock += rem;
      }
    }
  }

  return {
    success: true,
    allocations,
    updatedBatches,
    availableReadyStock: remainingReadyStock,
    curingStock: remainingCuringStock,
    totalStock: remainingTotalStock,
    exceedsReadyStock: requestedQuantity > initialReadyStock,
  };
}
