import Link from "next/link";
import { DivisionBadge } from "@/components/division-badge";
import { EventCard } from "@/components/event-card";
import { Panel, StatTile } from "@/components/panel";
import { RatingTable } from "@/components/rating-table";
import {
  getDriverRatings,
  getEventResults,
  getEvents,
  getLayoutOverview,
  getRecentApproved,
  getSeasons,
  getSeasonStandings,
  getSiteStats,
  pickCurrentSeason,
  requestTime,
} from "@/lib/data";
import { formatDate, formatNumber, formatPosition } from "@/lib/format";
import { formatLapTime } from "@/lib/laptime";
import { getViewer } from "@/lib/viewer";

export default async function HomePage() {
  const [viewer, ratings, events, overview, recent, seasons, stats] = await Promise.all([
    getViewer(),
    getDriverRatings(),
    getEvents(),
    getLayoutOverview(),
    getRecentApproved(8),
    getSeasons(),
    getSiteStats(),
  ]);
  const now = requestTime();

  const featured =
    events.find((e) => e.status === "live") ??
    [...events].filter((e) => e.status === "upcoming").sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0] ??
    null;
  const season = pickCurrentSeason(seasons);
  const [featuredResults, standings] = await Promise.all([
    featured ? getEventResults(featured.id) : [],
    season ? getSeasonStandings(season.id) : [],
  ]);

  const mine = viewer ? ratings.find((r) => r.user_id === viewer.userId) ?? null : null;
  const myStanding = viewer ? standings.find((s) => s.user_id === viewer.userId) ?? null : null;
  const records = overview.filter((row) => row.record_ms !== null);

  return (
    <>
      {viewer ? (
        <div className="mb-6">
          <p className="label mb-3">
            Halo, <Link href={`/pemain/${viewer.profile.username}`}>{viewer.profile.username}</Link>
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Rating"
              value={mine ? formatNumber(mine.rating) : "-"}
              note={mine ? <DivisionBadge division={mine.division} /> : "Belum ada lap time diterima"}
            />
            <StatTile
              label="Posisi rating"
              value={mine ? mine.position : "-"}
              note={mine ? `dari ${ratings.length} pemain` : undefined}
            />
            <StatTile
              label="Layout dihitung"
              value={mine ? `${mine.layouts_counted}/${mine.layouts_driven}` : "-"}
              note="maks 5 terbaik dipakai"
            />
            <StatTile
              label={season ? `Poin ${season.name}` : "Poin musim"}
              value={myStanding ? myStanding.points : "-"}
              note={myStanding ? `posisi ${myStanding.position}` : "belum ikut event"}
            />
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <p className="max-w-[620px] text-[17px]">
              Rating, event mingguan, dan leaderboard lap time FR Legends. Setiap waktu punya screenshot bukti yang sudah
              dicek moderator.
            </p>
            <Link href="/masuk" className="btn">
              Masuk untuk ikut
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Pembalap" value={formatNumber(stats.drivers)} />
            <StatTile label="Lap diterima" value={formatNumber(stats.approved_laps)} />
            <StatTile label="Layout dengan rekor" value={formatNumber(stats.layouts_with_records)} />
            <StatTile label="Event digelar" value={formatNumber(stats.events_held)} />
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-5">
        <div className="grid content-start gap-4 lg:gap-5">
          <Panel title={featured?.status === "live" ? "Event berjalan" : "Event berikutnya"} more={{ href: "/event", label: "Semua event" }} flush>
            {featured ? (
              <EventCard event={featured} results={featuredResults} now={now} />
            ) : (
              <p className="p-4 text-[14px] text-ink-2">Belum ada event terjadwal.</p>
            )}
          </Panel>

          <Panel title="Rekor per layout" more={{ href: "/sirkuit", label: "Semua sirkuit" }} flush>
            {records.length === 0 ? (
              <p className="p-4 text-[14px] text-ink-2">Belum ada lap time yang diterima.</p>
            ) : (
              <table className="sheet">
                <thead>
                  <tr>
                    <th>Layout</th>
                    <th className="right">Rekor</th>
                    <th>Pemegang</th>
                    <th className="right hidden sm:table-cell">Pemain</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row) => (
                    <tr key={row.layout_id}>
                      <td>
                        <Link className="link whitespace-nowrap" href={`/sirkuit/${row.track_slug}/${row.layout_slug}`}>
                          {row.layout_name}
                        </Link>
                      </td>
                      <td className="right num text-record">{formatLapTime(row.record_ms!)}</td>
                      <td>
                        <Link href={`/pemain/${row.record_username}`}>{row.record_username}</Link>
                        <span className="ml-2 hidden text-[13px] text-ink-2 sm:inline">{row.record_car_name}</span>
                      </td>
                      <td className="right num hidden sm:table-cell">{row.driver_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="Baru diterima" flush>
            {recent.length === 0 ? (
              <p className="p-4 text-[14px] text-ink-2">Belum ada.</p>
            ) : (
              <table className="sheet">
                <tbody>
                  {recent.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <Link href={`/pemain/${row.username}`}>{row.username}</Link>
                        <span className="block text-[13px] text-ink-2">
                          {row.layout_name} · {row.car_name}
                        </span>
                      </td>
                      <td className="right num">{formatLapTime(row.time_ms)}</td>
                      <td className="right num hidden whitespace-nowrap text-ink-2 sm:table-cell">
                        {formatDate(row.created_at, false)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>

        <div className="grid content-start gap-4 lg:gap-5">
          <Panel title="Rating teratas" more={{ href: "/statistik", label: "Semua" }} flush>
            {ratings.length === 0 ? (
              <p className="p-4 text-[14px] text-ink-2">Belum ada.</p>
            ) : (
              <RatingTable rows={ratings.slice(0, 10)} viewerId={viewer?.userId} compact />
            )}
          </Panel>

          <Panel title={season ? `Klasemen ${season.name}` : "Klasemen"} more={{ href: "/klasemen", label: "Lengkap" }} flush>
            {standings.length === 0 ? (
              <p className="p-4 text-[14px] text-ink-2">{season ? "Belum ada poin." : "Belum ada musim."}</p>
            ) : (
              <table className="sheet">
                <thead>
                  <tr>
                    <th className="right w-12">Pos</th>
                    <th>Pemain</th>
                    <th className="right">Poin</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.slice(0, 8).map((s) => (
                    <tr key={s.user_id} className={s.user_id === viewer?.userId ? "mine" : ""}>
                      <td className="right num">{formatPosition(s.position)}</td>
                      <td>
                        <Link href={`/pemain/${s.username}`}>{s.username}</Link>
                      </td>
                      <td className="right num">{s.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
