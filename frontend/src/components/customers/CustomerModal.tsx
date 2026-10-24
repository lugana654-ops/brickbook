'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Pencil, X, ChevronDown } from 'lucide-react';
import { Customer } from '@/types';

export interface CountryConfig {
  code: string;
  name: string;
  flag: string;
  minLength: number;
  maxLength: number;
  placeholder: string;
}

export const COUNTRY_CONFIGS: CountryConfig[] = [
  { code: '+91', name: 'India', flag: '🇮🇳', minLength: 10, maxLength: 10, placeholder: '9847123456' },
  { code: '+971', name: 'UAE', flag: '🇦🇪', minLength: 9, maxLength: 9, placeholder: '501234567' },
  { code: '+44', name: 'UK', flag: '🇬🇧', minLength: 9, maxLength: 10, placeholder: '7911123456' },
  { code: '+1', name: 'USA/Canada', flag: '🇺🇸', minLength: 10, maxLength: 10, placeholder: '2025550143' },
  { code: '+61', name: 'Australia', flag: '🇦🇺', minLength: 9, maxLength: 9, placeholder: '412345678' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', minLength: 9, maxLength: 9, placeholder: '512345678' },
  { code: '+968', name: 'Oman', flag: '🇴🇲', minLength: 8, maxLength: 8, placeholder: '91234567' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦', minLength: 8, maxLength: 8, placeholder: '33123456' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼', minLength: 8, maxLength: 8, placeholder: '91234567' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭', minLength: 8, maxLength: 8, placeholder: '39123456' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬', minLength: 8, maxLength: 8, placeholder: '81234567' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾', minLength: 9, maxLength: 10, placeholder: '123456789' },
];

/**
 * Parses raw customer phone number into countryCode and national digits.
 */
export function parseCustomerPhone(rawPhone: string): { countryCode: string; nationalNumber: string } {
  if (!rawPhone) {
    return { countryCode: '+91', nationalNumber: '' };
  }

  const trimmed = rawPhone.trim();

  // If starts with '+', sort by length descending to match longest country code prefix first
  if (trimmed.startsWith('+')) {
    const sorted = [...COUNTRY_CONFIGS].sort((a, b) => b.code.length - a.code.length);
    for (const c of sorted) {
      if (trimmed.startsWith(c.code)) {
        const after = trimmed.slice(c.code.length).trim().replace(/[^0-9]/g, '');
        return { countryCode: c.code, nationalNumber: after };
      }
    }
  }

  // If starts with '00', replace with '+'
  if (trimmed.startsWith('00')) {
    const withPlus = '+' + trimmed.slice(2);
    const sorted = [...COUNTRY_CONFIGS].sort((a, b) => b.code.length - a.code.length);
    for (const c of sorted) {
      if (withPlus.startsWith(c.code)) {
        const after = withPlus.slice(c.code.length).trim().replace(/[^0-9]/g, '');
        return { countryCode: c.code, nationalNumber: after };
      }
    }
  }

  // Fallback: Default to India (+91)
  const digits = trimmed.replace(/[^0-9]/g, '');
  return { countryCode: '+91', nationalNumber: digits };
}

/**
 * Formats the required digit count description based on min and max length rules.
 */
export function getRequiredDigitsText(minLength: number, maxLength: number): string {
  if (minLength === maxLength) {
    return `${minLength} digits`;
  }
  if (maxLength === minLength + 1) {
    return `${minLength} or ${maxLength} digits`;
  }
  return `${minLength} to ${maxLength} digits`;
}

/**
 * Validates national phone digits according to the selected country's rules.
 */
export function validatePhoneNumber(
  countryCode: string,
  nationalDigits: string
): { isValid: boolean; errorMessage?: string } {
  const digits = nationalDigits.replace(/[^0-9]/g, '');
  if (!digits) {
    return { isValid: false, errorMessage: 'Please enter a phone number.' };
  }

  const country = COUNTRY_CONFIGS.find((c) => c.code === countryCode) || {
    code: countryCode,
    name: '',
    flag: '',
    minLength: 7,
    maxLength: 15,
    placeholder: '',
  };

  if (digits.length < country.minLength || digits.length > country.maxLength) {
    return {
      isValid: false,
      errorMessage: `Phone number must be ${getRequiredDigitsText(country.minLength, country.maxLength)}.`,
    };
  }

  return { isValid: true };
}

export interface CustomerFormData {
  name: string;
  phone: string;
  place: string;
}

export interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CustomerFormData) => { success: boolean; error?: string } | void;
  initialCustomer?: Customer | null;
}

export default function CustomerModal({
  isOpen,
  onClose,
  onSubmit,
  initialCustomer,
}: CustomerModalProps) {
  const isEditMode = Boolean(initialCustomer);

  const [name, setName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  const [place, setPlace] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialCustomer) {
        const parsed = parseCustomerPhone(initialCustomer.phone);
        setName(initialCustomer.name || '');
        setCountryCode(parsed.countryCode);
        setPhone(parsed.nationalNumber);
        setPlace(initialCustomer.place || '');
      } else {
        setName('');
        setCountryCode('+91');
        setPhone('');
        setPlace('');
      }
      setFormError(null);
    }
  }, [isOpen, initialCustomer]);

  if (!isOpen) return null;

  const activeCountry =
    COUNTRY_CONFIGS.find((c) => c.code === countryCode) || COUNTRY_CONFIGS[0];

  const handleCountryCodeChange = (newCode: string) => {
    setCountryCode(newCode);
    const cleanPhone = phone.trim();
    if (cleanPhone) {
      const validation = validatePhoneNumber(newCode, cleanPhone);
      setFormError(validation.isValid ? null : validation.errorMessage || null);
    } else {
      setFormError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setFormError('Please enter a customer name.');
      return;
    }

    const phoneValidation = validatePhoneNumber(countryCode, cleanPhone);
    if (!phoneValidation.isValid) {
      setFormError(phoneValidation.errorMessage || 'Please enter a valid phone number.');
      return;
    }

    const formattedPhone = `${countryCode} ${cleanPhone}`;

    const res = onSubmit({
      name: cleanName,
      phone: formattedPhone,
      place: place.trim(),
    });

    if (res && typeof res === 'object' && res.success === false) {
      setFormError(res.error || 'Failed to save customer.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-[360px] overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between bg-[#213547] px-5 py-4 text-white">
          <div className="flex items-center space-x-2">
            {isEditMode ? (
              <Pencil size={18} className="text-[#fcd34d]" />
            ) : (
              <UserPlus size={18} className="text-[#fcd34d]" />
            )}
            <h3 className="font-semibold text-sm">
              {isEditMode ? 'Edit Customer' : 'Add New Customer'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/80 hover:bg-white/10 cursor-pointer transition-colors"
            aria-label="Close Modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {formError && (
            <div className="rounded-xl bg-red-50 p-2.5 text-xs font-semibold text-red-600 border border-red-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Customer / Contractor Name *
            </label>
            <input
              type="text"
              id="input-customer-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFormError(null);
              }}
              placeholder="e.g. Vipin Builders"
              required
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none placeholder-gray-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Phone Number *
            </label>
            <div className="flex gap-2">
              <div className="relative w-[118px] shrink-0">
                <select
                  id="select-country-code"
                  value={countryCode}
                  onChange={(e) => handleCountryCodeChange(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-2.5 py-2 text-xs font-semibold text-[#111827] focus:border-[#d97706] focus:outline-none cursor-pointer appearance-none pr-6 h-full"
                >
                  {COUNTRY_CONFIGS.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.flag} {item.code}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-2 inset-y-0 flex items-center text-gray-400">
                  <ChevronDown size={14} />
                </div>
              </div>
              <input
                type="tel"
                id="input-customer-phone"
                value={phone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, '');
                  setPhone(digits);
                  setFormError(null);
                }}
                placeholder={activeCountry.placeholder}
                required
                className="flex-1 min-w-0 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none placeholder-gray-400 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Place / Delivery Site
            </label>
            <input
              type="text"
              id="input-customer-place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="e.g. Taliparamba, Kannur"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs text-[#111827] focus:border-[#d97706] focus:outline-none placeholder-gray-400 font-medium"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              id="btn-save-customer"
              className="w-full rounded-2xl bg-[#d97706] py-3 text-xs font-bold text-white shadow-md hover:bg-[#b45309] active:scale-[0.99] transition-all cursor-pointer"
            >
              {isEditMode ? 'Update Customer' : 'Save Customer Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
