"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-12">
      <h1 className="heading text-[28px]">Terjadi kesalahan</h1>
      <p className="mt-2 text-ink-2">Data gagal dimuat. Coba lagi sebentar.</p>
      <button type="button" onClick={reset} className="btn btn-ghost mt-4">
        Coba lagi
      </button>
    </div>
  );
}
