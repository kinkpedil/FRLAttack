import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-plex-condensed",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: { default: "FRLAttack", template: "%s | FRLAttack" },
  description: "Rating, event mingguan, dan leaderboard lap time FR Legends. Setiap waktu punya bukti screenshot.",
};

// Layout dasar. Kerangka halaman ada di (site)/layout.tsx (landing page,
// menu atas) dan (app)/layout.tsx (halaman fitur, sidebar).
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${plexSans.variable} ${plexCondensed.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
