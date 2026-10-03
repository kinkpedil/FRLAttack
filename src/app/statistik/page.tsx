import type { Metadata } from "next";
import Link from "next/link";
import { BarList } from "@/components/bar-list";
import { DivisionBadge } from "@/components/division-badge";
import { PageTitle } from "@/components/page-title";
import { Panel, StatTile } from "@/components/panel";
import { RatingTable } from "@/components/rating-table";
import { getCarUsage, getDriverRatings, getMostActive, getSiteStats } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Statistik" };

const DIVISIONS = ["div1", "div2", "div3", "div4", "div5", "div6", "rookie"] as const;

export default async function StatsPage(props: PageProps<"/statistik">) {
  const query = await props.searchParams;
  const filter = typeof query.divisi === "string" && (DIVISIONS as readonly string[]).includes(query.divisi) ? query.divisi : null;
  const [stats, ratings, active, cars, viewer] = await Promise.all([
    getSiteStats(),
    getDriverRatings(),
    getMostActive(30, 10),
    getCarUsage(),
    getViewer(),
  ]);
  const shown = (filter ? ratings.filter((r) => r.division === filter) : ratings).slice(0, 100);
  const perDivision = DIVISIONS.map((d) => ({ division: d, count: ratings.filter((r) => r.division === d).length }));

  return (
    <>
      <PageTitle title="Statistik">
        Rating dihitung dari PB di setiap layout dibanding rekornya.{" "}
        <Link className="link" href="/aturan#rating">
          Cara hitung rating
        </Link>
      </PageTitle>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Pembalap" value={formatNumber(stats.drivers)} />
        <StatTile label="Lap diterima" value={formatNumber(stats.approved_laps)} />
        <StatTile label="Layout dengan rekor" value={formatNumber(stats.layouts_with_records)} />
        <StatTile label="Event digelar" value={formatNumber(stats.events_held)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start lg:gap-5">
        <Panel title="Leaderboard rating" flush>
          <nav aria-label="Saring divisi" className="flex flex-wrap gap-2 border-b border-rule px-4 py-3">
            <Link href="/statistik" className={`status ${filter ? "status-withdrawn" : "!text-ink"}`} aria-current={filter ? undefined : "page"}>
              SEMUA
            </Link>
            {DIVISIONS.map((d) => (
              <Link key={d} href={`/statistik?divisi=${d}`} aria-current={filter === d ? "page" : undefined}
                className={filter && filter !== d ? "opacity-50 hover:opacity-100" : ""}>
                <DivisionBadge division={d} />
              </Link>
            ))}
          </nav>
          {shown.length === 0 ? (
            <p className="p-4 text-[14px] text-ink-2">Belum ada pembalap di sini.</p>
          ) : (
            <RatingTable rows={shown} viewerId={viewer?.userId} />
          )}
        </Panel>

        <div className="grid content-start gap-4 lg:gap-5">
          <Panel title="Sebaran divisi">
            <BarList
              rows={perDivision.map((d) => ({ key: d.division, label: <DivisionBadge division={d.division} />, value: d.count }))}
            />
          </Panel>

          <Panel title="Paling aktif, 30 hari">
            {active.length === 0 ? (
              <p className="text-[14px] text-ink-2">Belum ada.</p>
            ) : (
              <BarList
                rows={active.map((a) => ({
                  key: a.username,
                  label: <Link href={`/pemain/${a.username}`}>{a.username}</Link>,
                  value: a.lap_count,
                  note: "lap",
                }))}
              />
            )}
          </Panel>

          <Panel title="Mobil terpopuler">
            {cars.length === 0 ? (
              <p className="text-[14px] text-ink-2">Belum ada.</p>
            ) : (
              <BarList
                rows={cars.slice(0, 10).map((c) => ({ key: c.car_slug, label: c.car_name, value: c.driver_count, note: "pemain" }))}
              />
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
