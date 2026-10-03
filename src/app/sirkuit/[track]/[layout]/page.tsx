import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { getActiveCars, getLayoutBySlugs, getLeaderboard } from "@/lib/data";
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

  const [cars, viewer] = await Promise.all([getActiveCars(), getViewer()]);
  const car = cars.find((c) => c.slug === carSlug) ?? null;
  const [rows, overall] = await Promise.all([
    getLeaderboard(detail.id, car?.id),
    car ? getLeaderboard(detail.id) : null,
  ]);
  const record = (overall ?? rows)[0] ?? null;

  return (
    <>
      <div className="mb-8 border-b border-rule pb-6">
        <p className="label mb-1">
          <Link href="/sirkuit">Sirkuit</Link> / {detail.track.name}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="heading text-[28px]">{detail.name}</h1>
            <p className="mt-1 text-[14px] text-ink-2">
              <span className="status mr-2 !text-ink">{LAYOUT_TYPE_LABEL[detail.type]}</span>
              {detail.track.real_world_reference ?? ""}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="label">Rekor</p>
            {record ? (
              <>
                <p className="num text-[40px] leading-none text-record">{formatLapTime(record.time_ms)}</p>
                <p className="mt-1 text-[14px]">
                  <Link href={`/pemain/${record.username}`}>{record.username}</Link>
                  <span className="text-ink-2">
                    {" "}
                    · {record.car_name} · {formatDate(record.created_at)}
                  </span>
                </p>
              </>
            ) : (
              <p className="num text-[40px] leading-none text-ink-2">{`-'--"---`}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <form method="get" className="flex items-end gap-2">
          <label className="block">
            <span className="label mb-1 block">Mobil</span>
            <select name="mobil" defaultValue={car?.slug ?? ""} className="field !w-auto">
              <option value="">Semua mobil</option>
              {cars.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn btn-ghost">
            Saring
          </button>
        </form>
        <Link href={`/kirim?layout=${detail.id}`} className="btn">
          Kirim lap time di sini
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="notice">
          {car ? `Belum ada lap time dengan ${car.name} di layout ini.` : "Belum ada lap time yang diterima di layout ini."}
        </p>
      ) : (
        <LeaderboardTable rows={rows} viewerId={viewer?.userId ?? null} recordMs={record?.time_ms ?? null} />
      )}
      <p className="mt-3 text-[13px] text-ink-2">Ketuk baris untuk melihat screenshot bukti.</p>
    </>
  );
}
