import Link from "next/link";
import { DivisionBadge } from "@/components/division-badge";
import { formatNumber, formatPosition } from "@/lib/format";
import type { DriverRating } from "@/lib/types";

export function RatingTable({ rows, viewerId, compact = false }: { rows: DriverRating[]; viewerId?: string | null; compact?: boolean }) {
  return (
    <table className="sheet">
      <thead>
        <tr>
          <th className="right w-12">Pos</th>
          <th>Pemain</th>
          <th>Divisi</th>
          <th className="right">Rating</th>
          {compact ? null : <th className="right hidden sm:table-cell">Layout</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.user_id} className={r.user_id === viewerId ? "mine" : ""}>
            <td className="right num">{formatPosition(r.position)}</td>
            <td>
              <Link href={`/pemain/${r.username}`}>{r.username}</Link>
              {r.country && !compact ? <span className="label ml-2">{r.country}</span> : null}
            </td>
            <td>
              <DivisionBadge division={r.division} />
            </td>
            <td className="right num">{formatNumber(r.rating)}</td>
            {compact ? null : (
              <td className="right num hidden text-ink-2 sm:table-cell">
                {r.layouts_counted}/{r.layouts_driven}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
