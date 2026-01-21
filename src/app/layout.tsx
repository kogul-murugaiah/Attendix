import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Symposium Attendance System",
  description: "QR-based attendance manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        {children}
        <footer className="fixed bottom-0 w-full py-2 text-center text-[10px] text-gray-500/50 mix-blend-plus-lighter pointer-events-none z-50 font-mono">
          © 2026 Attendix. All rights reserved. &nbsp;|&nbsp; Developed by Kogul Murugaiah
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
