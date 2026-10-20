/**
 * Production Record Modification Limits
 *
 * Enforces a strict 24-hour edit and delete restriction for production records,
 * calculated strictly from the creation timestamp (createdAt), NOT from the productionDate.
 */

export const PRODUCTION_EDIT_WINDOW_HOURS = 24;
export const PRODUCTION_EDIT_WINDOW_MS = PRODUCTION_EDIT_WINDOW_HOURS * 60 * 60 * 1000; // 86,400,000 ms

/**
 * Determines whether a production record is still within its 24-hour edit/delete window.
 * 
 * Rules:
 * 1. Checks strictly against `createdAt + 24 hours`, never against `productionDate`.
 * 2. If `createdAt` is missing, undefined, or invalid (legacy records), safely returns false
 *    (does not grant a new 24-hour window).
 * 3. Editing a record does not extend this window.
 */
export function isProductionEditable(
  record?: { createdAt?: string } | null,
  nowMs: number = Date.now()
): boolean {
  if (!record || !record.createdAt) {
    return false;
  }

  const createdTime = new Date(record.createdAt).getTime();
  if (isNaN(createdTime) || createdTime <= 0) {
    return false;
  }

  const deadline = createdTime + PRODUCTION_EDIT_WINDOW_MS;
  return nowMs <= deadline;
}

/**
 * Returns remaining milliseconds in the 24-hour edit/delete window.
 * Returns 0 if expired, missing createdAt, or invalid.
 */
export function getProductionEditRemainingMs(
  record?: { createdAt?: string } | null,
  nowMs: number = Date.now()
): number {
  if (!record || !record.createdAt) {
    return 0;
  }

  const createdTime = new Date(record.createdAt).getTime();
  if (isNaN(createdTime) || createdTime <= 0) {
    return 0;
  }

  const deadline = createdTime + PRODUCTION_EDIT_WINDOW_MS;
  return Math.max(0, deadline - nowMs);
}
