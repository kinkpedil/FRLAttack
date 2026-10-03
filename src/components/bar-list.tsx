// Daftar dengan batang data tipis. Nilai selalu ditulis sebagai teks,
// batang hanya penguat visual (satu hue, ujung membulat 4px dari garis dasar).
export function BarList({ rows }: { rows: { key: string; label: React.ReactNode; value: number; note?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="grid gap-3">
      {rows.map((row) => (
        <li key={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1">
          <span className="truncate text-[14px]">{row.label}</span>
          <span className="num text-[14px]">
            {row.value}
            {row.note ? <span className="ml-1 text-ink-2">{row.note}</span> : null}
          </span>
          <span className="col-span-2 block h-[6px] bg-panel-2">
            <span
              className="block h-full rounded-r-[4px] bg-accent"
              style={{ width: `${row.value === 0 ? 0 : Math.max(2, (row.value / max) * 100)}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
