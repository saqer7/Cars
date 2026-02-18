import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/sidebar";
import { ErrorBoundary } from "@/components/error-boundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoLock ERP",
  description: "Car Door & Key Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-50`}
      >
        <Providers>
          <ErrorBoundary>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 md:pl-64 pt-16 md:pt-0">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
            <Toaster />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
