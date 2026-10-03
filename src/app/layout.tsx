import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
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
  description: "Leaderboard lap time FR Legends per sirkuit. Setiap waktu punya bukti screenshot.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${plexSans.variable} ${plexCondensed.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[960px] flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-rule">
          <div className="mx-auto flex max-w-[960px] flex-wrap justify-between gap-2 px-4 py-4 text-[13px] text-ink-2">
            <span>FRLAttack. Proyek komunitas, tidak berafiliasi dengan pembuat FR Legends.</span>
            <a className="link" href="/aturan">
              Aturan
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
