"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16">
      <h1 className="heading text-[28px]">Terjadi kesalahan</h1>
      <p className="mt-2 text-ink-2">Data gagal dimuat. Coba lagi sebentar.</p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="button" onClick={reset} className="btn btn-ghost">
          Coba lagi
        </button>
        <Link className="link" href="/">
          Beranda
        </Link>
      </div>
    </div>
  );
}
