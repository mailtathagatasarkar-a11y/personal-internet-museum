import type { Metadata, Viewport } from "next";
import { Fragment_Mono, Inter_Tight, Tinos } from "next/font/google";
import { TypeSwitch } from "@/components/TypeSwitch";
import "./globals.css";

// ── The pairing: a bold, tight grotesk for everything that speaks, and a
//    mono for notation. Times remains reachable for comparison (?type=t).
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], style: ["normal", "italic"] });
const fragment = Fragment_Mono({ variable: "--font-fragment", subsets: ["latin"], weight: "400" });
const tinos = Tinos({ variable: "--font-tinos", subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"] });

const fontClasses = [interTight, fragment, tinos].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  title: "A Personal Internet Museum",
  description: "A spatial museum of one person's saved internet: 184 objects, collecting since 2026.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f2eee6",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fontClasses} h-full`}>
      <body className="h-full">
        {children}
        <TypeSwitch />
      </body>
    </html>
  );
}
