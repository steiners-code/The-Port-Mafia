import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Port Mafia",
  description: "An information network, run by agents who don't sleep.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
