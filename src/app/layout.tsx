import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, IBM_Plex_Sans_Condensed } from "next/font/google";
import { SiteNav } from "@/components/site-nav";
import { getViewer } from "@/lib/viewer";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();

  return (
    <html lang="id" className={`${plexSans.variable} ${plexCondensed.variable} ${plexMono.variable}`}>
      <body className="min-h-dvh lg:flex">
        <SiteNav username={viewer?.profile.username ?? null} role={viewer?.profile.role ?? null} />
        <div className="min-w-0 flex-1">
          <main className="mx-auto w-full max-w-[1120px] px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
