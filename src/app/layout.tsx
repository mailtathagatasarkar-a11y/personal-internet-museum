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

const SITE = "https://personal-internet-museum.netlify.app";

export const metadata: Metadata = {
  // No object count here: it changes, and a stale number is the one claim a reader can check.
  metadataBase: new URL(SITE),
  title: "A Personal Internet Museum",
  description: "A spatial museum of one person's saved internet. Collecting since 2026.",
  openGraph: {
    type: "website",
    url: SITE,
    title: "A Personal Internet Museum",
    description: "Everything I saved from the internet. None of it is mine. All of it is me.",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "The museum floor: a grid of saved objects and the line 'Everything I saved from the internet.'",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

// Pinch-zoom stays on for the document (WCAG 1.4.4). The museum's own
// viewport claims its gestures with touch-action: none, so the two never fight.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e8e3d7",
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
