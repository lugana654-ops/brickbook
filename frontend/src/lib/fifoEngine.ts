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
}

/**
 * First-In, First-Out (FIFO) allocation engine for brick dispatches.
 *
 * Rules:
 * 1. Only READY batches (elapsed >= 14 days) are eligible for allocation.
 * 2. Curing stock is strictly locked from customer dispatch.
 * 3. Batches are allocated oldest first (ascending productionDate).
 * 4. Negative inventory is strictly prevented.
 */
export function allocateFIFODispatch(
  allBatches: ProductionRecord[],
  blockType: BlockType,
  requestedQuantity: number,
  currentDateStr: string = getTodayDateString()
): FIFOAllocationResult {
  if (requestedQuantity <= 0) {
    return {
      success: false,
      allocations: [],
      updatedBatches: allBatches,
      errorMessage: 'Requested quantity must be greater than zero.',
      availableReadyStock: 0,
      curingStock: 0,
    };
  }

  const normalized = normalizeProductionRecords(allBatches, currentDateStr);

  // Separate ready vs curing batches for the requested block type
  const matchingTypeBatches = normalized.filter((b) => b.blockType === blockType);
  const readyBatches = matchingTypeBatches
    .filter((b) => b.status === 'READY' && b.remainingQuantity > 0)
    .sort((a, b) => {
      // Sort oldest first
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.createdAt.localeCompare(b.createdAt);
    });

  const availableReadyStock = readyBatches.reduce((sum, b) => sum + b.remainingQuantity, 0);
  const curingStock = matchingTypeBatches
    .filter((b) => b.status === 'CURING')
    .reduce((sum, b) => sum + b.remainingQuantity, 0);

  // Stock Validation Guard
  if (requestedQuantity > availableReadyStock) {
    return {
      success: false,
      allocations: [],
      updatedBatches: allBatches,
      errorMessage: `Insufficient ready stock. Requested: ${requestedQuantity}, Available: ${availableReadyStock} (${curingStock} units currently in 14-day curing).`,
      availableReadyStock,
      curingStock,
    };
  }

  // Sequentially allocate from oldest batch to newest
  let qtyNeeded = requestedQuantity;
  const allocations: BatchAllocation[] = [];
  const allocatedBatchMap = new Map<string, number>(); // batchId -> new remainingQuantity

  for (const batch of readyBatches) {
    if (qtyNeeded <= 0) break;

    const allocQty = Math.min(batch.remainingQuantity, qtyNeeded);
    allocations.push({
      batchId: batch.id,
      productionDate: batch.date,
      batchNumber: batch.batchNumber,
      quantity: allocQty,
    });

    const newRemaining = batch.remainingQuantity - allocQty;
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

  return {
    success: true,
    allocations,
    updatedBatches,
    availableReadyStock: availableReadyStock - requestedQuantity,
    curingStock,
  };
}
