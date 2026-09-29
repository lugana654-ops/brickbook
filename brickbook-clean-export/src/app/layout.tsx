import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "BrickBook – Live Business Dashboard",
  description:
    "BrickBook: your mobile-first brick management dashboard for tracking daily production, inventory, and quality metrics in real time.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <body className="h-full overflow-x-hidden bg-[#e5e7eb] antialiased touch-manipulation">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

