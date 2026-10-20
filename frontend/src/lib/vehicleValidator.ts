/**
 * Kerala Vehicle Number Validation and Normalization Utility
 *
 * Accepted Patterns:
 * - KL followed by 1 or 2 digits (RTO code, e.g. KL 07, KL-7, KL 40)
 * - Optional series code (1 to 3 alphabetic letters, e.g. A, AB, CA, ZZ)
 * - Registration number (1 to 4 digits, e.g. 1234, 786, 9)
 *
 * Example valid inputs:
 * "KL-07-AB-1234", "KL 01 CA 9999", "kl-40-786", "KL13A1"
 */

const KERALA_VEHICLE_REGEX = /^KL[- ]?([0-9]{1,2})[- ]?([A-Z]{1,3})?[- ]?([0-9]{1,4})$/i;

export interface VehicleValidationResult {
  isValid: boolean;
  normalized: string;
  errorMessage?: string;
}

export function validateKeralaVehicleNumber(rawInput: string): VehicleValidationResult {
  if (!rawInput || !rawInput.trim()) {
    return {
      isValid: false,
      normalized: '',
      errorMessage: 'Vehicle number is required.',
    };
  }

  const clean = rawInput.trim().toUpperCase();
  const match = clean.match(KERALA_VEHICLE_REGEX);

  if (!match) {
    return {
      isValid: false,
      normalized: clean,
      errorMessage: 'Invalid vehicle number. Must be a valid Kerala registration (e.g., KL-07-AB-1234).',
    };
  }

  const rto = match[1].padStart(2, '0');
  const series = match[2] ? match[2].toUpperCase() : '';
  const number = match[3];

  const normalized = series ? `KL-${rto}-${series}-${number}` : `KL-${rto}-${number}`;

  return {
    isValid: true,
    normalized,
  };
}

export function formatVehiclePlate(rawInput: string): string {
  const result = validateKeralaVehicleNumber(rawInput);
  return result.isValid ? result.normalized : rawInput.trim().toUpperCase();
}

/**
 * Automatically formats user input into Kerala vehicle registration format with hyphens as they type.
 * Allows entering letters and numbers naturally without manually pressing hyphen.
 *
 * Examples:
 * - "kl" -> "KL"
 * - "kl07" -> "KL-07"
 * - "kl07a" -> "KL-07-A"
 * - "kl07ab" -> "KL-07-AB"
 * - "kl07ab1234" -> "KL-07-AB-1234"
 * - "07a1234" -> "KL-07-A-1234"
 * - "kl-7-1234" -> "KL-7-1234"
 * - "kl 40 786" -> "KL-40-786"
 */
export function formatKeralaPlateAsYouType(rawInput: string): string {
  if (!rawInput) return '';

  // Only allow alphanumeric characters, hyphens, and spaces
  const clean = rawInput.toUpperCase().replace(/[^A-Z0-9- ]/g, '');
  if (!clean) return '';

  // If input contains no alphanumeric characters (e.g. only dashes or spaces), reset to empty
  if (!/[A-Z0-9]/.test(clean)) return '';

  const endsWithSep = /[- ]$/.test(rawInput);

  // If user starts typing with a digit (e.g. '07...' or '7...'), assume Kerala prefix 'KL'
  let str = clean;
  if (/^[0-9]/.test(str)) {
    str = 'KL' + str;
  }

  // If user has only typed 'K'
  if (str === 'K') {
    return 'K';
  }

  // If it doesn't start with 'KL', allow whatever alphanumeric characters they typed
  if (!str.startsWith('KL')) {
    return clean;
  }

  // Extract part after 'KL'
  const afterKL = str.slice(2).replace(/^[- ]+/, '');

  if (!afterKL) {
    return endsWithSep ? 'KL-' : 'KL';
  }

  // 1. Extract RTO digits (1 or 2 digits)
  if (!/^[0-9]/.test(afterKL)) {
    return `KL-${afterKL}`;
  }

  let rto = '';
  let afterRTO = '';

  const sepMatch = afterKL.match(/^([0-9]{1,2})[- ]+/);
  const letterMatch = afterKL.match(/^([0-9]{1,2})([A-Z])/);

  if (sepMatch) {
    rto = sepMatch[1];
    afterRTO = afterKL.slice(sepMatch[0].length);
  } else if (letterMatch) {
    rto = letterMatch[1];
    afterRTO = afterKL.slice(letterMatch[1].length);
  } else {
    // Digits only
    const allDigits = afterKL.match(/^[0-9]+/)?.[0] || '';
    if (allDigits.length <= 2) {
      rto = allDigits;
      afterRTO = afterKL.slice(rto.length);
    } else {
      // More than 2 digits and no letters, e.g. "071234"
      rto = allDigits.slice(0, 2);
      afterRTO = afterKL.slice(2);
    }
  }

  afterRTO = afterRTO.replace(/^[- ]+/, '');

  if (!afterRTO) {
    return endsWithSep ? `KL-${rto}-` : `KL-${rto}`;
  }

  // 2. Extract Series (1 to 3 letters) or Registration Number (if no series)
  if (/^[A-Z]/.test(afterRTO)) {
    const seriesMatch = afterRTO.match(/^([A-Z]{1,3})/);
    const series = seriesMatch ? seriesMatch[1] : '';
    let afterSeries = afterRTO.slice(series.length).replace(/^[- ]+/, '');

    if (!afterSeries) {
      return endsWithSep ? `KL-${rto}-${series}-` : `KL-${rto}-${series}`;
    }

    // 3. Extract Registration Number (1 to 4 digits)
    const numMatch = afterSeries.match(/^[0-9]{1,4}/);
    const num = numMatch ? numMatch[0] : '';
    return num ? `KL-${rto}-${series}-${num}` : `KL-${rto}-${series}`;
  } else {
    // No series letters, direct registration number (1 to 4 digits)
    const numMatch = afterRTO.match(/^[0-9]{1,4}/);
    const num = numMatch ? numMatch[0] : '';
    return num ? `KL-${rto}-${num}` : `KL-${rto}`;
  }
}

