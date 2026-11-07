import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const display = Cormorant_Garamond({ subsets: ["latin"], variable: "--font-display", weight: ["400", "500", "600"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const couple = localFont({ src: "../fonts/adelia.ttf", variable: "--font-couple", display: "swap" });
const invitationNames = localFont({ src: "../fonts/Griffiths.otf", variable: "--font-invitation-names", display: "swap", weight: "400" });
const header = localFont({ src: "../fonts/Cinzel-Regular.otf", variable: "--font-header", display: "swap" });
const heroDate = localFont({ src: "../fonts/BodoniXT.ttf", variable: "--font-hero-date", display: "swap", weight: "400" });

export const metadata: Metadata = {
  title: "Aiman & Atiqah | Walimatul Urus",
  description: "Jemputan ke majlis perkahwinan Aiman dan Atiqah.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ms"><body className={`${display.variable} ${body.variable} ${couple.variable} ${header.variable} ${invitationNames.variable} ${heroDate.variable}`}>{children}</body></html>;
}

