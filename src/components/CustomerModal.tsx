"use client";

import React, { useState, useEffect } from "react";
import { Customer } from "@/context/CustomersContext";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<Customer, "id">) => void;
  initialData?: Customer | null;
}

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "USA/Canada (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+61", label: "Australia (+61)" },
];

export default function CustomerModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CustomerModalProps) {
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [place, setPlace] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setCountryCode(initialData.countryCode);
        setPhone(initialData.phone);
        setPlace(initialData.place);
      } else {
        setName("");
        setCountryCode("+91");
        setPhone("");
        setPlace("");
      }
      setError("");
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim() || !phone.trim() || !place.trim()) {
      setError("Please fill all fields.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    onSave({
      name: name.trim(),
      countryCode,
      phone: phone.trim(),
      place: place.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 font-sans">
      <div className="w-full max-w-[340px] bg-[#f7ebe1] rounded-3xl overflow-hidden shadow-2xl border border-amber-900/10 animate-in fade-in zoom-in duration-150 p-5 flex flex-col gap-4">
        <h2 className="text-xl font-bold text-amber-950">
          {initialData ? "Edit Customer" : "Add Customer"}
        </h2>

        {error && <p className="text-xs font-bold text-red-600">{error}</p>}

        <div>
          <label className="text-xs font-semibold text-amber-900/70 mb-1 block">
            Customer Name
          </label>
          <input
            type="text"
            placeholder=""
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white border border-amber-900/20 rounded-xl px-4 py-3 text-sm font-medium text-amber-950 outline-none focus:ring-2 focus:ring-[#d97706]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-amber-900/70 mb-1 block">
            Phone Number
          </label>
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-1/3 bg-white border border-amber-900/20 rounded-xl px-2 py-3 text-sm font-medium text-amber-950 outline-none focus:ring-2 focus:ring-[#d97706]"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder=""
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className="w-2/3 bg-white border border-amber-900/20 rounded-xl px-4 py-3 text-sm font-medium text-amber-950 outline-none focus:ring-2 focus:ring-[#d97706]"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-amber-900/70 mb-1 block">
            Place / Location
          </label>
          <input
            type="text"
            placeholder=""
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="w-full bg-white border border-amber-900/20 rounded-xl px-4 py-3 text-sm font-medium text-amber-950 outline-none focus:ring-2 focus:ring-[#d97706]"
          />
        </div>

        <div className="flex items-center justify-end gap-3 mt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full font-bold text-amber-900 hover:bg-amber-900/10 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-full font-bold bg-[#d97706] text-white hover:bg-[#b45309] transition-colors text-sm shadow-md"
          >
            {initialData ? "Save Changes" : "Save Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}
