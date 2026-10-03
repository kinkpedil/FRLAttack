"use client";

import Link from "next/link";
import { useState } from "react";

const LINKS = [
  { href: "/event", label: "Event" },
  { href: "/klasemen", label: "Klasemen" },
  { href: "/sirkuit", label: "Sirkuit" },
  { href: "/statistik", label: "Statistik" },
  { href: "/aturan", label: "Aturan" },
];

export function LandingHeader({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-rule bg-bg">
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-4 py-3 lg:px-8">
        <Link href="/" className="heading text-[20px] tracking-[0.04em]">
          FRL<span className="text-accent">/</span>ATTACK
        </Link>
        <nav aria-label="Menu utama" className="hidden flex-1 items-center gap-6 text-[14px] text-ink-2 md:flex">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          {loggedIn ? (
            <Link href="/dashboard" className="btn btn-ghost !hidden !min-h-[36px] !text-[13px] sm:!inline-flex">
              Dashboard
            </Link>
          ) : (
            <Link href="/masuk" className="hidden text-[14px] text-ink-2 hover:text-ink sm:inline">
              Masuk
            </Link>
          )}
          <Link href="/kirim" className="btn !min-h-[36px] !text-[13px]">
            Kirim<span className="hidden sm:inline">&nbsp;lap time</span>
          </Link>
          <button
            type="button"
            className="btn btn-ghost !min-h-[36px] !px-3 !text-[13px] md:hidden"
            aria-expanded={open}
            aria-controls="menu-landing"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Tutup" : "Menu"}
          </button>
        </div>
      </div>
      {open ? (
        <nav id="menu-landing" aria-label="Menu utama" className="border-t border-rule px-2 py-2 md:hidden">
          <ul>
            {[...LINKS, loggedIn ? { href: "/dashboard", label: "Dashboard" } : { href: "/masuk", label: "Masuk" }].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="nav-link" onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
