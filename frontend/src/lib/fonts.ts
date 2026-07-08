import { Cinzel, Inter, JetBrains_Mono } from "next/font/google";

/**
 * Three type roles for the whole app — display, body, utility.
 * Each exposes a CSS variable consumed by app/globals.css, so a font
 * swap later means changing the import here, not touching every
 * component that renders text.
 */

export const displayFont = Cinzel({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-cinzel",
  display: "swap",
});

export const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const utilityFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const fontVariables = `${displayFont.variable} ${bodyFont.variable} ${utilityFont.variable}`;
