'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, ArrowLeft, RefreshCw, Trash2, Building2, X } from 'lucide-react';
import { useBrickBook } from '@/context/BrickBookContext';

export interface HeaderProps {
  title: string;
  showBack?: boolean;
  backHref?: string;
  showMenu?: boolean;
  subtitle?: string;
  rightAction?: React.ReactNode;
  onRefresh?: () => void;
}

export default function Header({
  title,
  showBack = false,
  backHref,
  showMenu = false,
  subtitle,
  rightAction,
  onRefresh,
}: HeaderProps) {
  const router = useRouter();
  const { user, resetAllData } = useBrickBook();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset all production, customer, and dispatch data back to clean initial state?')) {
      resetAllData();
      setIsMenuOpen(false);
      setFeedbackMsg('All records reset.');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#213547] text-white shadow-md">
        <div className="flex h-14 items-center px-4 justify-between">
          <div className="flex items-center">
            {showBack ? (
              <button
                onClick={handleBack}
                id="header-back-button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Go back"
              >
                <ArrowLeft size={22} />
              </button>
            ) : showMenu ? (
              <button
                onClick={() => setIsMenuOpen(true)}
                id="header-menu-button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Open menu"
              >
                <MoreVertical size={20} />
              </button>
            ) : (
              <div className="w-9" />
            )}
          </div>

          <div className="flex flex-col text-center flex-1 px-2">
            <h1 className="text-lg font-bold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="text-[11px] text-white/70">{subtitle}</p>}
          </div>

          <div className="flex items-center justify-end">
            {onRefresh ? (
              <button
                onClick={onRefresh}
                id="header-refresh-button"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/10 active:scale-95 transition-all"
                aria-label="Refresh"
              >
                <RefreshCw size={19} />
              </button>
            ) : rightAction ? (
              rightAction
            ) : (
              <div className="w-9" />
            )}
          </div>
        </div>

        {feedbackMsg && (
          <div className="bg-[#059669] px-4 py-1.5 text-center text-xs font-medium text-white transition-all">
            {feedbackMsg}
          </div>
        )}
      </header>

      {/* Menu Drawer Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-[360px] overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between bg-[#213547] px-5 py-4 text-white">
              <div className="flex items-center space-x-2">
                <Building2 size={20} className="text-[#fcd34d]" />
                <span className="font-semibold">{user.plantName}</span>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="rounded-full p-1 text-white/80 hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-2xl bg-[#f7ebe1] p-3 text-xs text-[#213547]">
                <p className="font-semibold text-sm text-[#111827]">{user.name}</p>
                <p className="text-gray-600">{user.location} • {user.phone}</p>
                <p className="mt-1 text-[11px] text-[#d97706] font-medium">Kerala MVD & 14-Day Curing Compliant</p>
              </div>

              <div className="space-y-2 pt-2">

                <button
                  onClick={handleReset}
                  id="menu-reset-all-data"
                  className="flex w-full items-center space-x-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-100 active:scale-[0.99]"
                >
                  <Trash2 size={18} />
                  <div>
                    <p className="font-medium">Reset All Data</p>
                    <p className="text-[11px] font-normal text-red-700/80">Clear storage back to fresh initial state</p>
                  </div>
                </button>
              </div>

              <div className="border-t border-gray-100 pt-3 text-center text-[11px] text-gray-400">
                BrickBook v1.0 • Mobile First ERP
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
