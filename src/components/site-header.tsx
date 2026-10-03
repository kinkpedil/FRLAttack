import Link from "next/link";
import { getViewer } from "@/lib/viewer";

export async function SiteHeader() {
  const viewer = await getViewer();
  const role = viewer?.profile.role;

  return (
    <header className="border-b-2 border-ink">
      <div className="mx-auto flex max-w-[960px] flex-wrap items-baseline gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="heading text-[20px] tracking-[0.04em]">
          FRLATTACK
        </Link>
        <nav className="order-last flex w-full flex-wrap items-baseline gap-x-5 gap-y-1 text-[14px] sm:order-none sm:w-auto sm:flex-1">
          <Link href="/sirkuit">Sirkuit</Link>
          <Link href="/kirim">Kirim lap time</Link>
          <Link href="/aturan">Aturan</Link>
          {role === "mod" || role === "admin" ? <Link href="/mod">Moderasi</Link> : null}
          {role === "admin" ? <Link href="/admin">Admin</Link> : null}
        </nav>
        <div className="ml-auto flex items-baseline gap-x-4 text-[14px] sm:ml-0">
          {viewer ? (
            <>
              <Link href="/saya" className="font-medium">
                {viewer.profile.username}
              </Link>
              <form action="/keluar" method="post">
                <button type="submit" className="text-ink-2 underline-offset-2 hover:underline">
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <Link href="/masuk" className="font-medium">
              Masuk
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
