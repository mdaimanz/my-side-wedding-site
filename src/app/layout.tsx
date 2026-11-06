import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const couple = localFont({ src: "../fonts/adelia.ttf", variable: "--font-couple", display: "swap" });

export const metadata: Metadata = {
  title: "Aiman & Atiqah | Walimatul Urus",
  description: "Jemputan ke majlis perkahwinan Aiman dan Atiqah.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ms"><body className={`${display.variable} ${body.variable} ${couple.variable}`}>{children}</body></html>;
}

