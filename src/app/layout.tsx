import type { Metadata } from "next";
import { Playfair_Display, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LinkForge — Fast, Permanent & Intelligent URL Shortener",
  description:
    "Transform long URLs into clean, powerful short links with instant QR codes, real-time click analytics, and custom branded aliases.",
  keywords: [
    "URL shortener",
    "short links",
    "LinkForge",
    "QR code generator",
    "link analytics",
    "custom alias",
  ],
  authors: [{ name: "LinkForge" }],
  openGraph: {
    title: "LinkForge — Fast, Permanent & Intelligent URL Shortener",
    description:
      "Transform long URLs into clean, powerful short links with instant QR codes, real-time click analytics, and custom branded aliases.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#1C1719] font-sans">{children}</body>
    </html>
  );
}
