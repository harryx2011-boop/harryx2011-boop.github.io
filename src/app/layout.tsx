import type { Metadata, Viewport } from "next";
import { DotGothic16, IBM_Plex_Mono, Newsreader } from "next/font/google";
import type { ReactNode } from "react";
import "../styles/base.css";
import "../styles/chapters.css";
import "../styles/crt.css";
import "../styles/crt-os.css";
import "./globals.css";

const serif = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-serif", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });
const pixel = DotGothic16({ subsets: ["latin"], weight: "400", variable: "--font-pixel", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://harryxie.me"),
  title: "Harry Xie",
  description: "Harry Xie, also Elixir, is the founder of Aether, an AI research lab.",
};
export const viewport: Viewport = { themeColor: "#070708", colorScheme: "dark", viewportFit: "cover" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${mono.variable} ${pixel.variable}`}>
      <body>{children}</body>
    </html>
  );
}
