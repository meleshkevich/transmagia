import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Literata, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const literata = Literata({
  variable: "--font-literata",
  subsets: ["cyrillic", "latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Трансмагия",
    template: "%s | Трансмагия",
  },
  description: "Электронная библиотека новелл, фанфиков и переводов.",
  applicationName: "Трансмагия",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Трансмагия",
  },
};

export const viewport = {
  themeColor: "#f4f1ea",
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru" className={`${manrope.variable} ${literata.variable}`}>
      <body>{children}</body>
    </html>
  );
}
