import Link from "next/link";
import { DivisionBadge } from "@/components/division-badge";
import { EventCard } from "@/components/event-card";
import { Panel } from "@/components/panel";
import { RatingTable } from "@/components/rating-table";
import {
  getDriverRatings,
  getEventResults,
  getEvents,
  getLayoutOverview,
  getSeasons,
  getSeasonStandings,
  getSiteStats,
  pickCurrentSeason,
  requestTime,
} from "@/lib/data";
import { EVENT_STATUS_LABEL, formatDateTime, formatNumber, formatPosition } from "@/lib/format";
import { formatLapTime } from "@/lib/laptime";

const STEPS = [
  { title: "Catat best lap", text: "Main di FR Legends, kejar waktu terbaikmu di layout TA atau layout lain." },
  { title: "Screenshot layar hasil", text: "Ambil screenshot layar hasil lap. Kirim file aslinya, jangan diedit atau dikompres." },
  { title: "Kirim di sini", text: "Pilih layout dan mobil, tulis lap time persis seperti di layar, lalu unggah screenshot." },
  { title: "Dicek moderator", text: "Waktu yang cocok dengan screenshot masuk leaderboard, rating, dan event yang sedang berjalan." },
];

const DIVISION_LADDER = [
  { division: "div1", range: "3.000+" },
  { division: "div2", range: "2.600" },
  { division: "div3", range: "2.200" },
  { division: "div4", range: "1.800" },
  { division: "div5", range: "1.400" },
  { division: "div6", range: "di bawah 1.400" },
];

function SectionHead({ kicker, title, href, linkLabel, children }: {
  kicker: string;
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="label text-accent">{kicker}</p>
      <h2 className="heading text-[28px] lg:text-[32px]">{title}</h2>
      <div className="max-w-[440px] text-ink-2">{children}</div>
      <p className="mt-2">
        <Link href={href} className="btn btn-ghost">
          {linkLabel}
        </Link>
      </p>
    </div>
  );
}

export default async function LandingPage() {
  const [events, ratings, overview, seasons, stats] = await Promise.all([
    getEvents(),
    getDriverRatings(),
    getLayoutOverview(),
    getSeasons(),
    getSiteStats(),
  ]);
  const now = requestTime();

  const live = events.find((e) => e.status === "live") ?? null;
  const upcoming = events.filter((e) => e.status === "upcoming").sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const featured = live ?? upcoming[0] ?? null;
  const season = pickCurrentSeason(seasons);
  const [featuredResults, standings] = await Promise.all([
    featured ? getEventResults(featured.id) : [],
    season ? getSeasonStandings(season.id) : [],
  ]);
  const records = overview.filter((row) => row.record_ms !== null).slice(0, 6);
  const eventList = [...(live ? [live] : []), ...upcoming, ...events.filter((e) => e.status === "finished")].slice(0, 4);

  return (
    <>
      {/* Pembuka: judul konkret di kiri, data event yang sedang berjalan di kanan. */}
      <section className="border-b border-rule">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-center lg:gap-12 lg:px-8 lg:py-16">
          <div>
            <p className="label mb-3 text-accent">FR Legends · Time attack</p>
            <h1 className="heading text-[40px] leading-[1.02] lg:text-[56px]">Leaderboard lap time FR Legends</h1>
            <p className="mt-4 max-w-[520px] text-[17px] text-ink-2">
              Kirim screenshot best lap kamu. Setelah dicek moderator, waktunya masuk leaderboard tiap layout, rating
              pembalap, dan event mingguan.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Link href="/kirim" className="btn !min-h-[44px] !px-5">
                Kirim lap time
              </Link>
              <Link href="/sirkuit" className="link text-[15px]">
                Lihat rekor sirkuit
              </Link>
            </div>
          </div>
          <Panel
            title={featured?.status === "live" ? "Event berjalan" : "Event berikutnya"}
            more={{ href: "/event", label: "Semua event" }}
            flush
          >
            {featured ? (
              <EventCard event={featured} results={featuredResults} now={now} />
            ) : (
              <p className="p-4 text-[14px] text-ink-2">Belum ada event terjadwal.</p>
            )}
          </Panel>
        </div>
      </section>

      {/* Angka situs */}
      <section className="border-b border-rule bg-panel">
        <dl className="mx-auto grid max-w-[1200px] grid-cols-2 px-4 lg:grid-cols-4 lg:px-8">
          {[
            ["Pembalap", stats.drivers],
            ["Lap diterima", stats.approved_laps],
            ["Layout dengan rekor", stats.layouts_with_records],
            ["Event digelar", stats.events_held],
          ].map(([label, value], i) => (
            <div key={label} className={`py-6 ${i % 2 === 1 ? "pl-4 lg:pl-6" : ""} ${i > 0 ? "lg:border-l lg:border-rule lg:pl-6" : ""}`}>
              <dt className="label">{label}</dt>
              <dd className="figure mt-2 text-[32px]">{formatNumber(value as number)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mx-auto grid max-w-[1200px] gap-16 px-4 py-14 lg:gap-24 lg:px-8 lg:py-20">
        {/* Cara kerja */}
        <section aria-labelledby="cara-kerja">
          <p className="label mb-3 text-accent">Cara kerja</p>
          <h2 id="cara-kerja" className="heading mb-6 text-[28px] lg:text-[32px]">
            Dari layar hasil ke leaderboard
          </h2>
          <ol className="panel grid sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className={`p-5 ${i > 0 ? "border-t border-rule sm:border-t-0" : ""} ${i % 2 === 1 ? "sm:border-l sm:border-rule" : ""} ${i >= 2 ? "sm:border-t sm:border-rule lg:border-t-0" : ""} ${i > 0 ? "lg:border-l lg:border-rule" : ""}`}
              >
                <p className="num text-[13px] text-accent">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="heading mt-2 text-[18px]">{step.title}</h3>
                <p className="mt-2 text-[14px] text-ink-2">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[13px] text-ink-2">
            Syarat lengkap screenshot ada di <Link className="link" href="/aturan">halaman aturan</Link>.
          </p>
        </section>

        {/* Event */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start lg:gap-12">
          <SectionHead kicker="Event mingguan" title="Satu layout tiap minggu" href="/event" linkLabel="Buka halaman event">
            Setiap minggu ada satu layout yang diperebutkan, kadang dengan mobil wajib. Posisi akhirmu jadi poin klasemen
            musim. Pemenang mendapat 50 poin, setiap peserta minimal 1.
          </SectionHead>
          <div className="panel overflow-x-auto">
            {eventList.length === 0 ? (
              <p className="p-4 text-[14px] text-ink-2">Belum ada event.</p>
            ) : (
              <table className="sheet">
                <tbody>
                  {eventList.map((e) => (
                    <tr key={e.id}>
                      <td className="w-24">
                        <span className={`status status-${e.status}`}>{EVENT_STATUS_LABEL[e.status]}</span>
                      </td>
                      <td>
                        <Link className="link" href={`/event/${e.slug}`}>
                          {e.name}
                        </Link>
                        <span className="block text-[13px] text-ink-2">
                          {e.status === "upcoming" ? `Mulai ${formatDateTime(e.starts_at)}` : `${e.participant_count} peserta`}
                          {e.car_name ? ` · Wajib ${e.car_name}` : ""}
                        </span>
                      </td>
                      <td className="right hidden sm:table-cell">
                        {e.leader_username ? (
                          <>
                            <span className="text-[13px] text-ink-2">{e.status === "finished" ? "Pemenang" : "Memimpin"}</span>
                            <span className="block">
                              {e.leader_username} <span className="num text-[13px] text-ink-2">{formatLapTime(e.leader_time_ms!)}</span>
                            </span>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Rating */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start lg:gap-12">
          <div>
            <SectionHead kicker="Rating dan divisi" title="Seberapa dekat kamu ke rekor" href="/statistik" linkLabel="Buka leaderboard rating">
              Rating dihitung dari PB kamu di setiap layout dibanding rekornya. Pemegang rekor dapat 1000, lebih lambat dari
              107% rekor dapat 0. Lima layout terbaik dijumlahkan.
            </SectionHead>
            <ul className="mt-6 grid max-w-[320px] gap-1 text-[14px]">
              {DIVISION_LADDER.map((d) => (
                <li key={d.division} className="flex items-center justify-between gap-3">
                  <DivisionBadge division={d.division} />
                  <span className="num text-ink-2">{d.range}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="panel overflow-x-auto">
            {ratings.length === 0 ? (
              <p className="p-4 text-[14px] text-ink-2">Belum ada pembalap.</p>
            ) : (
              <RatingTable rows={ratings.slice(0, 8)} />
            )}
          </div>
        </section>

        {/* Rekor */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start lg:gap-12">
          <SectionHead kicker="Sirkuit" title="Rekor tiap layout" href="/sirkuit" linkLabel="Buka daftar sirkuit">
            Setiap layout punya leaderboard sendiri, bisa disaring per mobil. Setiap waktu bisa dibuka screenshot buktinya.
          </SectionHead>
          <div className="panel overflow-x-auto">
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
                        {row.record_username}
                        <span className="ml-2 hidden text-[13px] text-ink-2 sm:inline">{row.record_car_name}</span>
                      </td>
                      <td className="right num hidden sm:table-cell">{row.driver_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Klasemen */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start lg:gap-12">
          <SectionHead
            kicker="Klasemen"
            title={season ? `Klasemen ${season.name}` : "Klasemen musim"}
            href="/klasemen"
            linkLabel="Buka klasemen lengkap"
          >
            Jumlah poin dari semua event di musim ini. Tidak ada pengurangan untuk minggu yang dilewatkan, jadi ikut
            sebanyak mungkin.
          </SectionHead>
          <div className="panel overflow-x-auto">
            {standings.length === 0 ? (
              <p className="p-4 text-[14px] text-ink-2">{season ? "Belum ada poin." : "Belum ada musim."}</p>
            ) : (
              <table className="sheet">
                <thead>
                  <tr>
                    <th className="right w-12">Pos</th>
                    <th>Pemain</th>
                    <th className="right">Poin</th>
                    <th className="right hidden sm:table-cell">Menang</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.slice(0, 6).map((s) => (
                    <tr key={s.user_id}>
                      <td className="right num">{formatPosition(s.position)}</td>
                      <td>{s.username}</td>
                      <td className="right num">{s.points}</td>
                      <td className="right num hidden sm:table-cell">{s.wins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Penutup */}
        <section className="panel flex flex-col items-start justify-between gap-4 border-l-[3px] !border-l-accent p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="heading text-[24px]">Punya best lap?</h2>
            <p className="mt-1 text-ink-2">Kirim screenshotnya. Login dengan Discord atau Google.</p>
          </div>
          <Link href="/kirim" className="btn !min-h-[44px] !px-5">
            Kirim lap time
          </Link>
        </section>
      </div>
    </>
  );
}
