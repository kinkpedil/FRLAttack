import Link from "next/link";

type Props = {
  title: string;
  more?: { href: string; label: string };
  aside?: React.ReactNode;
  flush?: boolean;
  className?: string;
  children: React.ReactNode;
};

// Panel dashboard. flush = isi menempel ke tepi (untuk tabel).
export function Panel({ title, more, aside, flush = false, className = "", children }: Props) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <h2 className="label !text-ink">{title}</h2>
        {more ? (
          <Link href={more.href} className="text-[13px] text-ink-2 hover:text-ink">
            {more.label}
          </Link>
        ) : (
          aside
        )}
      </div>
      <div className={flush ? "overflow-x-auto" : "panel-body"}>{children}</div>
    </section>
  );
}

export function StatTile({ label, value, note }: { label: string; value: React.ReactNode; note?: React.ReactNode }) {
  return (
    <div className="panel px-4 py-3">
      <p className="label">{label}</p>
      <p className="figure mt-2 text-[28px]">{value}</p>
      {note ? <p className="mt-1 text-[13px] text-ink-2">{note}</p> : null}
    </div>
  );
}
