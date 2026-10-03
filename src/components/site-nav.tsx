"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Props = {
  username: string | null;
  role: "user" | "mod" | "admin" | null;
};

const MAIN = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/event", label: "Event" },
  { href: "/klasemen", label: "Klasemen" },
  { href: "/sirkuit", label: "Sirkuit" },
  { href: "/statistik", label: "Statistik" },
  { href: "/aturan", label: "Aturan" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({ username, role, onNavigate }: Props & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const item = (href: string, label: string) => (
    <li key={href}>
      <Link
        href={href}
        className="nav-link"
        aria-current={isActive(pathname, href) ? "page" : undefined}
        onClick={onNavigate}
      >
        {label}
      </Link>
    </li>
  );

  return (
    <nav aria-label="Menu utama" className="flex flex-col gap-6">
      <ul>{MAIN.map((m) => item(m.href, m.label))}</ul>

      {role === "mod" || role === "admin" ? (
        <div>
          <p className="label px-3 pb-1">Staf</p>
          <ul>
            {item("/mod", "Moderasi")}
            {role === "admin" ? item("/admin", "Admin") : null}
          </ul>
        </div>
      ) : null}

      <div>
        <p className="label px-3 pb-1">Akun</p>
        {username ? (
          <ul>
            {item(`/pemain/${username}`, username)}
            {item("/saya", "Submission saya")}
            {item("/profil", "Ubah profil")}
            <li>
              <form action="/keluar" method="post">
                <button type="submit" className="nav-link w-full text-left">
                  Keluar
                </button>
              </form>
            </li>
          </ul>
        ) : (
          <ul>{item("/masuk", "Masuk")}</ul>
        )}
      </div>
    </nav>
  );
}

export function SiteNav(props: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* HP: bilah atas */}
      <div className="sticky top-0 z-20 border-b border-rule bg-panel lg:hidden">
        <div className="flex items-center gap-3 px-4 py-2">
          <Link href="/" className="heading mr-auto text-[18px] tracking-[0.04em]">
            FRL<span className="text-accent">/</span>ATTACK
          </Link>
          <Link href="/kirim" className="btn !min-h-[34px] !px-3 !text-[13px]">
            Kirim
          </Link>
          <button
            type="button"
            className="btn btn-ghost !min-h-[34px] !px-3 !text-[13px]"
            aria-expanded={open}
            aria-controls="menu-hp"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Tutup" : "Menu"}
          </button>
        </div>
        {open ? (
          <div id="menu-hp" className="border-t border-rule px-2 py-3">
            <NavList {...props} onNavigate={() => setOpen(false)} />
          </div>
        ) : null}
      </div>

      {/* Desktop: sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-rule bg-panel px-3 py-5 lg:flex">
        <Link href="/" className="heading px-3 text-[20px] tracking-[0.04em]">
          FRL<span className="text-accent">/</span>ATTACK
        </Link>
        <div className="px-3">
          <Link href="/kirim" className="btn w-full">
            Kirim lap time
          </Link>
        </div>
        <NavList {...props} />
        <p className="mt-auto px-3 text-[12px] leading-snug text-ink-2">
          Proyek komunitas, tidak berafiliasi dengan pembuat FR Legends.
        </p>
      </aside>
    </>
  );
}
