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
