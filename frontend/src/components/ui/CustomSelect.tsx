'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption<T extends string = string> {
  value: T;
  label: string;
}

export interface CustomSelectProps<T extends string = string> {
  id?: string;
  value: T | '';
  onChange: (value: T) => void;
  options: CustomSelectOption<T>[];
  placeholder?: string;
  heightClass?: string; // e.g. 'h-14' or 'h-12'
  textSizeClass?: string; // e.g. 'text-[15px]' or 'text-xs'
  paddingClass?: string; // e.g. 'px-4' or 'px-3.5'
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  ariaLabel?: string;
}

export default function CustomSelect<T extends string = string>({
  id,
  value,
  onChange,
  options,
  placeholder = 'Select option',
  heightClass = 'h-14',
  textSizeClass = 'text-[15px]',
  paddingClass = 'px-4',
  disabled = false,
  hasError = false,
  className = '',
  ariaLabel,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Sync highlightedIndex when dropdown opens
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => (prev + 1) % options.length);
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) => (prev - 1 + options.length) % options.length);
        }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          onChange(options[highlightedIndex].value);
          setIsOpen(false);
        }
        break;
      }
      case 'Escape': {
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
        }
        break;
      }
      case 'Tab': {
        if (isOpen) {
          setIsOpen(false);
        }
        break;
      }
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button styled consistently with BrickBook input fields */}
      <button
        type="button"
        id={selectId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || placeholder}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className={`w-full ${heightClass} ${paddingClass} rounded-2xl bg-white border transition-all cursor-pointer shadow-xs flex items-center justify-between text-left focus:outline-none ${
          hasError
            ? 'border-red-400 ring-2 ring-red-100'
            : isOpen
            ? 'border-[#d97706] ring-2 ring-[#d97706]/20'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
      >
        <span
          className={`truncate ${textSizeClass} font-medium ${
            selectedOption ? 'text-gray-800' : 'text-gray-400'
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ml-2 ${
            isOpen ? 'rotate-180 text-[#d97706]' : ''
          }`}
        />
      </button>

      {/* Option List Popover with matching rounded corners and BrickBook Amber theme */}
      {isOpen && (
        <ul
          role="listbox"
          tabIndex={-1}
          aria-label={ariaLabel || placeholder}
          className="absolute top-[calc(100%+6px)] left-0 w-full z-50 rounded-2xl bg-white border border-amber-200/90 shadow-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-150"
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            const isHighlighted = idx === highlightedIndex;

            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`mx-1.5 my-0.5 px-3.5 py-2.5 rounded-xl ${textSizeClass} font-medium cursor-pointer transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#fef3c7] text-[#b45309] font-bold'
                    : isHighlighted
                    ? 'bg-[#fef3c7]/60 text-[#111827]'
                    : 'text-gray-700 hover:bg-[#fef3c7]/40'
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check size={16} className="text-[#d97706] shrink-0 ml-2 stroke-[2.5]" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
