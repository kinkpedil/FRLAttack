import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PageTitle } from "@/components/page-title";
import { Panel, StatTile } from "@/components/panel";
import { getActiveCars, getEvents, getLayoutBySlugs, getLeaderboard } from "@/lib/data";
import { formatDate, LAYOUT_TYPE_LABEL } from "@/lib/format";
import { formatLapTime } from "@/lib/laptime";
import { getViewer } from "@/lib/viewer";

export async function generateMetadata(props: PageProps<"/sirkuit/[track]/[layout]">): Promise<Metadata> {
  const { track, layout } = await props.params;
  const detail = await getLayoutBySlugs(track, layout);
  return { title: detail ? `${detail.name} (${detail.track.name})` : "Layout tidak ditemukan" };
}

export default async function LayoutPage(props: PageProps<"/sirkuit/[track]/[layout]">) {
  const { track, layout } = await props.params;
  const query = await props.searchParams;
  const carSlug = typeof query.mobil === "string" ? query.mobil : "";

  const detail = await getLayoutBySlugs(track, layout);
  if (!detail) notFound();

  const [cars, viewer, events] = await Promise.all([getActiveCars(), getViewer(), getEvents()]);
  const car = cars.find((c) => c.slug === carSlug) ?? null;
  const [rows, overall] = await Promise.all([
    getLeaderboard(detail.id, car?.id),
    car ? getLeaderboard(detail.id) : null,
  ]);
  const all = overall ?? rows;
  const record = all[0] ?? null;
  const mine = viewer ? all.find((r) => r.user_id === viewer.userId) ?? null : null;
  const liveEvent = events.find((e) => e.status === "live" && e.track_slug === track && e.layout_slug === layout) ?? null;

  return (
    <>
      <PageTitle
        kicker={
          <>
            <Link href="/sirkuit">Sirkuit</Link> / {detail.track.name}
          </>
        }
        title={detail.name}
        actions={
          <Link href={`/kirim?layout=${detail.id}`} className="btn">
            Kirim lap time di sini
          </Link>
        }
      >
        <span className="status mr-2 !text-ink">{LAYOUT_TYPE_LABEL[detail.type]}</span>
        {detail.track.real_world_reference ?? ""}
      </PageTitle>

      {liveEvent ? (
        <p className="notice notice-info mb-5 text-[14px]">
          <span className="status status-live mr-2">LIVE</span>
          <Link className="link" href={`/event/${liveEvent.slug}`}>
            {liveEvent.name}
          </Link>{" "}
          sedang berjalan di layout ini. Kiriman sekarang ikut dihitung.
        </p>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Rekor"
          value={record ? <span className="num text-record">{formatLapTime(record.time_ms)}</span> : "-"}
          note={record ? `${record.username} · ${record.car_name}` : "belum ada"}
        />
        <StatTile label="Tanggal rekor" value={<span className="text-[18px]">{record ? formatDate(record.created_at) : "-"}</span>} />
        <StatTile label="Pemain" value={all.length} note={all.length < 3 ? "dihitung untuk rating mulai 3 pemain" : "dihitung untuk rating"} />
        <StatTile
          label="PB kamu"
          value={mine ? <span className="num">{formatLapTime(mine.time_ms)}</span> : "-"}
          note={mine ? `posisi ${mine.position}` : viewer ? "belum ada" : "masuk untuk melihat"}
        />
      </div>

      <Panel
        title={car ? `Leaderboard ${car.name}` : "Leaderboard"}
        flush
        aside={
          <form method="get" className="flex items-center gap-2">
            <label className="sr-only" htmlFor="mobil">
              Mobil
            </label>
            <select id="mobil" name="mobil" defaultValue={car?.slug ?? ""} className="field !min-h-[32px] !w-auto !py-1 text-[13px]">
              <option value="">Semua mobil</option>
              {cars.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <button type="submit" className="btn btn-ghost !min-h-[32px] !px-3 !text-[12px]">
              Saring
            </button>
          </form>
        }
      >
        {rows.length === 0 ? (
          <p className="p-4 text-[14px] text-ink-2">
            {car ? `Belum ada lap time dengan ${car.name} di layout ini.` : "Belum ada lap time yang diterima di layout ini."}
          </p>
        ) : (
          <LeaderboardTable rows={rows} viewerId={viewer?.userId ?? null} recordMs={record?.time_ms ?? null} />
        )}
      </Panel>
      <p className="mt-3 text-[13px] text-ink-2">Ketuk baris untuk melihat screenshot bukti.</p>
    </>
  );
}
