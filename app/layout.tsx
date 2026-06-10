import type { Metadata } from "next";
import { Cairo, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap" });
const ibm = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-ibm-arabic", display: "swap" });

export const metadata: Metadata = {
  title: "الفاحص الذكي",
  description: "نظام فحص مراكز التحكم والمراقبة الأمنية في المنشآت"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} ${ibm.variable} font-arabic antialiased`}>{children}</body>
    </html>
  );
}
