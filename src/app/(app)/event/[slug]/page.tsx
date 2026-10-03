import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Countdown } from "@/components/countdown";
import { PageTitle } from "@/components/page-title";
import { Panel, StatTile } from "@/components/panel";
import { getEventResults, getEvents, requestTime } from "@/lib/data";
import { EVENT_STATUS_LABEL, formatDateTime, formatPosition } from "@/lib/format";
import { formatGap, formatLapTime } from "@/lib/laptime";
import { getViewer } from "@/lib/viewer";

async function findEvent(slug: string) {
  const events = await getEvents();
  return events.find((e) => e.slug === slug) ?? null;
}

export async function generateMetadata(props: PageProps<"/event/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const event = await findEvent(slug);
  return { title: event?.name ?? "Event tidak ditemukan" };
}

export default async function EventPage(props: PageProps<"/event/[slug]">) {
  const { slug } = await props.params;
  const event = await findEvent(slug);
  if (!event) notFound();

  const [results, viewer] = await Promise.all([getEventResults(event.id), getViewer()]);
  const now = requestTime();
  const live = event.status === "live";

  return (
    <>
      <PageTitle
        kicker={
          <>
            <Link href="/event">Event</Link>
            {event.season_name ? ` / ${event.season_name}` : ""}
          </>
        }
        title={event.name}
        actions={
          live ? (
            <Link href="/kirim" className="btn">
              Ikut event
            </Link>
          ) : null
        }
      >
        <span className={`status status-${event.status} mr-2`}>{EVENT_STATUS_LABEL[event.status]}</span>
        <Link className="link" href={`/sirkuit/${event.track_slug}/${event.layout_slug}`}>
          {event.layout_name}
        </Link>
        {event.car_name ? ` · Wajib ${event.car_name}` : " · Semua mobil"}
      </PageTitle>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Mulai" value={<span className="text-[16px] sm:text-[18px]">{formatDateTime(event.starts_at)}</span>} />
        <StatTile label="Selesai" value={<span className="text-[16px] sm:text-[18px]">{formatDateTime(event.ends_at)}</span>} />
        <StatTile
          label={live ? "Sisa waktu" : event.status === "upcoming" ? "Mulai dalam" : "Status"}
          value={
            event.status === "finished" ? (
              "Selesai"
            ) : (
              <span className="whitespace-nowrap text-[22px] sm:text-[28px]">
                <Countdown target={live ? event.ends_at : event.starts_at} now={now} />
              </span>
            )
          }
        />
        <StatTile label="Peserta" value={results.length} />
      </div>

      <Panel title={event.status === "finished" ? "Hasil akhir" : "Hasil sementara"} flush>
        {results.length === 0 ? (
          <p className="p-4 text-[14px] text-ink-2">
            {event.status === "upcoming"
              ? "Event belum dimulai. Lap time yang dikirim sebelum periode event tidak dihitung."
              : "Belum ada lap time yang diterima."}
          </p>
        ) : (
          <table className="sheet">
            <thead>
              <tr>
                <th className="right w-12">Pos</th>
                <th>Pemain</th>
                <th className="hidden sm:table-cell">Mobil</th>
                <th className="right">Lap time</th>
                <th className="right hidden sm:table-cell">Selisih</th>
                <th className="right">Poin</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.submission_id} className={r.user_id === viewer?.userId ? "mine" : ""}>
                  <td className="right num">{formatPosition(r.position)}</td>
                  <td>
                    <Link href={`/pemain/${r.username}`}>{r.username}</Link>
                    {r.country ? <span className="label ml-2">{r.country}</span> : null}
                    <span className="block text-[13px] text-ink-2 sm:hidden">{r.car_name}</span>
                  </td>
                  <td className="hidden sm:table-cell">{r.car_name}</td>
                  <td className={`right num ${r.position === 1 ? "text-record" : ""}`}>{formatLapTime(r.time_ms)}</td>
                  <td className="right num hidden text-ink-2 sm:table-cell">{formatGap(r.gap_ms)}</td>
                  <td className="right num">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <p className="mt-3 text-[13px] text-ink-2">
        Dihitung: lap time di {event.layout_name}
        {event.car_name ? ` dengan ${event.car_name}` : ""} yang dikirim selama periode event dan sudah diterima
        moderator. Kiriman yang masih menunggu review akan muncul setelah diterima.
      </p>
    </>
  );
}
