/**
 * BrickBook Local Storage Manager
 * Provides type-safe persistence and retrieval with SSR guards and fallback handling.
 */

export const STORAGE_KEYS = {
  USER: 'brickbook_user',
  PRODUCTIONS: 'brickbook_productions',
  PRODUCTION_RECORDS: 'brickbook_production_records',
  CUSTOMERS: 'brickbook_customers',
  DISPATCHES: 'brickbook_dispatches',
  SALES: 'brickbook_sales',
  PAYMENTS: 'brickbook_payments',
} as const;

export const ALL_BUSINESS_STORAGE_KEYS = [
  'brickbook_productions',
  'brickbook_production_records',
  'brickbook_customers',
  'brickbook_sales',
  'brickbook_dispatches',
  'brickbook_payments',
];

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

/**
 * Checks if browser localStorage is available in the current runtime environment.
 */
function isStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/**
 * Retrieves and deserializes a value from localStorage.
 */
export function getFromStorage<T>(key: StorageKey, fallback: T): T {
  if (!isStorageAvailable()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`[Storage] Failed to read key "${key}":`, error);
    return fallback;
  }
}

/**
 * Serializes and stores a value into localStorage.
 */
export function setToStorage<T>(key: StorageKey, value: T): boolean {
  if (!isStorageAvailable()) return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to write key "${key}":`, error);
    return false;
  }
}

/**
 * Removes a specific item from localStorage.
 */
export function removeFromStorage(key: StorageKey): boolean {
  if (!isStorageAvailable()) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[Storage] Failed to remove key "${key}":`, error);
    return false;
  }
}

/**
 * Clears business data keys from localStorage while preserving user session.
 */
export function clearBrickBookStorage(preserveUser = true): void {
  if (!isStorageAvailable()) return;
  ALL_BUSINESS_STORAGE_KEYS.forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      // Ignore individual cleanup errors
    }
  });
  if (!preserveUser) {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch {
      // Ignore
    }
  }
}
