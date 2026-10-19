import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BrickBookProvider } from '@/context/BrickBookContext';
import BottomNav from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'BrickBook - Brick Manufacturing & Operational Tracking',
  description:
    'Real-world business management and operational tracking system for brick and block manufacturing enterprises.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#213547',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#e5e7eb] text-[#111827] antialiased">
        <BrickBookProvider>
          {/* Centered 400px Mobile Shell Container */}
          <div className="relative mx-auto flex min-h-screen w-full max-w-[400px] flex-col bg-[#f3f4f6] shadow-2xl pb-24 overflow-x-hidden">
            <main className="flex-1 w-full">{children}</main>
            <BottomNav />
          </div>
        </BrickBookProvider>
      </body>
    </html>
  );
}
