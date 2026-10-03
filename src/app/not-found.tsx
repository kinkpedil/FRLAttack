import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[720px] px-4 py-16">
      <Link href="/" className="heading text-[20px] tracking-[0.04em]">
        FRL<span className="text-accent">/</span>ATTACK
      </Link>
      <p className="num mt-10 text-[40px] leading-none text-ink-2">404</p>
      <h1 className="heading mt-2 text-[28px]">Halaman tidak ditemukan</h1>
      <p className="mt-4 flex flex-wrap gap-4">
        <Link className="link" href="/">
          Beranda
        </Link>
        <Link className="link" href="/sirkuit">
          Daftar sirkuit
        </Link>
      </p>
    </div>
  );
}
