import { BlockType, ProductionRecord, BatchAllocation } from '@/types';
import { calculateCuringStatus, getTodayDateString } from './curingCalculator';

export interface StockSummary {
  blockType: BlockType;
  todayProduced: number; // Produced today
  totalProduced: number; // Historical total produced
  totalAvailable: number; // All remaining in yard (curing + ready)
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
      status: record.status || calculated.status,
      daysRemaining: record.daysRemaining !== undefined ? record.daysRemaining : calculated.daysRemaining,
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
  let totalProduced = 0;
  let totalAvailable = 0;
  let curingStock = 0;
  let readyStock = 0;

  for (const record of typeRecords) {
    totalProduced += record.netQuantity;
    totalAvailable += record.remainingQuantity;

    if (record.date === currentDateStr) {
      todayProduced += record.netQuantity;
    }

    if (record.status === 'READY') {
      readyStock += record.remainingQuantity;
    } else {
      curingStock += record.remainingQuantity;
    }
  }

  return {
    blockType,
    todayProduced,
    totalProduced,
    totalAvailable,
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
