import { CuringStatus } from '@/types';

export const MANDATORY_CURING_DAYS = 14;

/**
 * Calculates days difference between two YYYY-MM-DD date strings.
 * Disregards time of day by comparing UTC timestamps at midnight.
 */
export function getDaysDifference(fromDateStr: string, toDateStr: string): number {
  if (!fromDateStr || !toDateStr) return 0;
  const partsFrom = fromDateStr.trim().split('-').map(Number);
  const partsTo = toDateStr.trim().split('-').map(Number);
  if (partsFrom.length !== 3 || partsTo.length !== 3) return 0;
  const [y1, m1, d1] = partsFrom;
  const [y2, m2, d2] = partsTo;
  if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) return 0;

  const dFrom = Date.UTC(y1, m1 - 1, d1);
  const dTo = Date.UTC(y2, m2 - 1, d2);

  const diffMs = dTo - dFrom;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds N days to a YYYY-MM-DD date string
 */
export function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('-').map(Number);
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;

  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);

  const resY = date.getUTCFullYear();
  const resM = String(date.getUTCMonth() + 1).padStart(2, '0');
  const resD = String(date.getUTCDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
}

/**
 * Determines current curing status and remaining days for a given production date.
 */
export function calculateCuringStatus(
  productionDateStr: string,
  currentDateStr: string = getTodayDateString()
): {
  status: CuringStatus;
  daysElapsed: number;
  daysRemaining: number;
  curingEndDate: string;
} {
  const cleanDate = (productionDateStr || '').trim();
  const cleanCurrent = (currentDateStr || getTodayDateString()).trim();

  if (!cleanDate) {
    return {
      status: 'CURING',
      daysElapsed: 0,
      daysRemaining: MANDATORY_CURING_DAYS,
      curingEndDate: '',
    };
  }

  const curingEndDate = addDaysToDate(cleanDate, MANDATORY_CURING_DAYS);
  const daysElapsed = getDaysDifference(cleanDate, cleanCurrent);

  if (daysElapsed >= MANDATORY_CURING_DAYS) {
    return {
      status: 'READY',
      daysElapsed,
      daysRemaining: 0,
      curingEndDate,
    };
  }

  const daysRemaining = Math.max(0, MANDATORY_CURING_DAYS - daysElapsed);
  return {
    status: 'CURING',
    daysElapsed: Math.max(0, daysElapsed),
    daysRemaining,
    curingEndDate,
  };
}

/**
 * Formats YYYY-MM-DD into a human-friendly date string like "18 Oct 2026"
 */
export function formatFriendlyDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
