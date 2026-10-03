import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-12">
      <p className="num text-[40px] leading-none text-ink-2">404</p>
      <h1 className="heading mt-2 text-[28px]">Halaman tidak ditemukan</h1>
      <p className="mt-2">
        <Link className="link" href="/sirkuit">
          Lihat daftar sirkuit
        </Link>
      </p>
    </div>
  );
}
