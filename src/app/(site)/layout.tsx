import Link from "next/link";
import { LandingHeader } from "@/components/landing-header";
import { getViewer } from "@/lib/viewer";

// Kerangka landing page: menu atas, konten lebar penuh, footer.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();

  return (
    <div className="flex min-h-dvh flex-col">
      <LandingHeader loggedIn={Boolean(viewer)} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-rule bg-panel">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 sm:grid-cols-[2fr_1fr_1fr] lg:px-8">
          <div>
            <p className="heading text-[18px] tracking-[0.04em]">
              FRL<span className="text-accent">/</span>ATTACK
            </p>
            <p className="mt-2 max-w-[420px] text-[14px] text-ink-2">
              Leaderboard lap time komunitas FR Legends. Proyek komunitas, tidak berafiliasi dengan pembuat FR Legends.
            </p>
          </div>
          <div>
            <p className="label mb-2">Halaman</p>
            <ul className="grid gap-1 text-[14px]">
              <li><Link href="/event" className="text-ink-2 hover:text-ink">Event</Link></li>
              <li><Link href="/klasemen" className="text-ink-2 hover:text-ink">Klasemen</Link></li>
              <li><Link href="/sirkuit" className="text-ink-2 hover:text-ink">Sirkuit</Link></li>
              <li><Link href="/statistik" className="text-ink-2 hover:text-ink">Statistik</Link></li>
            </ul>
          </div>
          <div>
            <p className="label mb-2">Info</p>
            <ul className="grid gap-1 text-[14px]">
              <li><Link href="/aturan" className="text-ink-2 hover:text-ink">Aturan submission</Link></li>
              <li><Link href="/aturan#rating" className="text-ink-2 hover:text-ink">Cara hitung rating</Link></li>
              <li><Link href="/aturan#event" className="text-ink-2 hover:text-ink">Poin event</Link></li>
              <li><Link href={viewer ? "/dashboard" : "/masuk"} className="text-ink-2 hover:text-ink">{viewer ? "Dashboard" : "Masuk"}</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
