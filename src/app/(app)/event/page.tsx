import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { Panel } from "@/components/panel";
import { getEvents } from "@/lib/data";
import { EVENT_STATUS_LABEL, formatDateTime } from "@/lib/format";
import { formatLapTime } from "@/lib/laptime";
import type { EventRow } from "@/lib/types";

export const metadata: Metadata = { title: "Event" };

function EventTable({ rows }: { rows: EventRow[] }) {
  return (
    <table className="sheet">
      <thead>
        <tr>
          <th>Event</th>
          <th className="hidden md:table-cell">Periode</th>
          <th className="right">Peserta</th>
          <th className="hidden sm:table-cell">Pemimpin</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((e) => (
          <tr key={e.id}>
            <td>
              <span className={`status status-${e.status} mr-2`}>{EVENT_STATUS_LABEL[e.status]}</span>
              <Link className="link" href={`/event/${e.slug}`}>
                {e.name}
              </Link>
              <span className="block text-[13px] text-ink-2">
                {e.layout_name}
                {e.car_name ? ` · Wajib ${e.car_name}` : ""}
                {e.season_name ? ` · ${e.season_name}` : ""}
              </span>
            </td>
            <td className="num hidden whitespace-nowrap text-[13px] text-ink-2 md:table-cell">
              {formatDateTime(e.starts_at)}
              <br />
              {formatDateTime(e.ends_at)}
            </td>
            <td className="right num">{e.participant_count}</td>
            <td className="hidden sm:table-cell">
              {e.leader_username ? (
                <>
                  {e.leader_username}
                  <span className="num ml-2 text-[13px] text-ink-2">{formatLapTime(e.leader_time_ms!)}</span>
                </>
              ) : (
                <span className="text-ink-2">-</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function EventsPage() {
  const events = await getEvents();
  const live = events.filter((e) => e.status === "live");
  const upcoming = events.filter((e) => e.status === "upcoming").sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const finished = events.filter((e) => e.status === "finished");

  return (
    <>
      <PageTitle title="Event">
        Tiap minggu satu layout. Kirim lap time di layout itu selama periode event, posisi akhirmu jadi poin klasemen
        musim. <Link className="link" href="/aturan#event">Aturan poin</Link>
      </PageTitle>

      {events.length === 0 ? <p className="notice">Belum ada event.</p> : null}

      <div className="grid gap-4 lg:gap-5">
        {live.length > 0 ? (
          <Panel title="Berjalan" flush>
            <EventTable rows={live} />
          </Panel>
        ) : null}
        {upcoming.length > 0 ? (
          <Panel title="Akan datang" flush>
            <EventTable rows={upcoming} />
          </Panel>
        ) : null}
        {finished.length > 0 ? (
          <Panel title="Selesai" flush>
            <EventTable rows={finished} />
          </Panel>
        ) : null}
      </div>
    </>
  );
}
