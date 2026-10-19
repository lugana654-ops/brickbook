'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Factory, Users } from 'lucide-react';

interface TabItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  isActive: (pathname: string) => boolean;
}

const TABS: TabItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    href: '/',
    icon: Home,
    isActive: (pathname: string) => pathname === '/',
  },
  {
    id: 'production',
    label: 'Production',
    href: '/production',
    icon: Factory,
    isActive: (pathname: string) => pathname.startsWith('/production'),
  },
  {
    id: 'customers',
    label: 'Customers',
    href: '/customers',
    icon: Users,
    isActive: (pathname: string) => pathname.startsWith('/customers'),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 mx-auto w-full max-w-[400px] bg-[#fde8d0] border-t border-[#d97706]/20 shadow-lg"
    >
      <div className="flex h-16 items-center justify-around px-2">
        {TABS.map((tab) => {
          const active = tab.isActive(pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              id={`nav-tab-${tab.id}`}
              className="flex flex-1 flex-col items-center justify-center py-1 group select-none transition-transform active:scale-95"
            >
              <div
                className={`flex items-center justify-center rounded-full px-5 py-1 transition-colors ${
                  active
                    ? 'bg-[#fcd34d]/60 text-[#451a03]'
                    : 'text-[#213547]/80 hover:text-[#213547]'
                }`}
              >
                <Icon size={20} className={active ? 'stroke-[2.4]' : 'stroke-[2]'} />
              </div>
              <span
                className={`mt-0.5 text-[11px] tracking-tight ${
                  active
                    ? 'font-bold text-[#111827]'
                    : 'font-medium text-[#213547]/75'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
