import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { formatDateTime, formatPosition, EVENT_STATUS_LABEL } from "@/lib/format";
import { formatGap, formatLapTime } from "@/lib/laptime";
import type { EventResult, EventRow } from "@/lib/types";

// Ringkasan satu event untuk dashboard: status, layout, sisa waktu, 5 teratas.
export function EventCard({ event, results, now }: { event: EventRow; results: EventResult[]; now: number }) {
  const live = event.status === "live";
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 px-4 pt-4">
        <div className="min-w-0">
          <p className="mb-1 flex items-center gap-2">
            <span className={`status status-${event.status}`}>{EVENT_STATUS_LABEL[event.status]}</span>
            {event.season_name ? <span className="label">{event.season_name}</span> : null}
          </p>
          <h3 className="heading text-[22px]">
            <Link href={`/event/${event.slug}`}>{event.name}</Link>
          </h3>
          <p className="mt-1 text-[14px] text-ink-2">
            <Link className="link" href={`/sirkuit/${event.track_slug}/${event.layout_slug}`}>
              {event.layout_name}
            </Link>
            {event.car_name ? ` · Wajib ${event.car_name}` : " · Semua mobil"}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="label">{live ? "Berakhir dalam" : event.status === "upcoming" ? "Mulai dalam" : "Selesai"}</p>
          <p className="figure mt-1 text-[24px]">
            {event.status === "finished" ? (
              <span className="text-[16px]">{formatDateTime(event.ends_at)}</span>
            ) : (
              <Countdown target={live ? event.ends_at : event.starts_at} now={now} />
            )}
          </p>
        </div>
      </div>

      {results.length === 0 ? (
        <p className="px-4 py-4 text-[14px] text-ink-2">
          {event.status === "upcoming" ? `Dibuka ${formatDateTime(event.starts_at)}.` : "Belum ada lap time yang diterima."}
        </p>
      ) : (
        <table className="sheet mt-3">
          <thead>
            <tr>
              <th className="right w-12">Pos</th>
              <th>Pemain</th>
              <th className="right">Lap time</th>
              <th className="right hidden sm:table-cell">Selisih</th>
              <th className="right">Poin</th>
            </tr>
          </thead>
          <tbody>
            {results.slice(0, 5).map((r) => (
              <tr key={r.submission_id}>
                <td className="right num">{formatPosition(r.position)}</td>
                <td>
                  <Link href={`/pemain/${r.username}`}>{r.username}</Link>
                  <span className="ml-2 text-[13px] text-ink-2">{r.car_name}</span>
                </td>
                <td className={`right num ${r.position === 1 ? "text-record" : ""}`}>{formatLapTime(r.time_ms)}</td>
                <td className="right num hidden text-ink-2 sm:table-cell">{formatGap(r.gap_ms)}</td>
                <td className="right num">{r.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="flex flex-wrap gap-2 border-t border-rule px-4 py-3">
        <Link href={`/event/${event.slug}`} className="btn btn-ghost !min-h-[34px] !text-[13px]">
          Hasil lengkap
        </Link>
        {live ? (
          <Link href="/kirim" className="btn !min-h-[34px] !text-[13px]">
            Ikut event
          </Link>
        ) : null}
      </div>
    </div>
  );
}
