import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { getLayoutOverview } from "@/lib/data";
import { LAYOUT_TYPE_LABEL } from "@/lib/format";
import { formatLapTime } from "@/lib/laptime";
import type { LayoutOverviewRow } from "@/lib/types";

export const metadata: Metadata = { title: "Sirkuit" };

export default async function TracksPage() {
  const overview = await getLayoutOverview();

  const tracks = new Map<string, { name: string; slug: string; layouts: LayoutOverviewRow[] }>();
  for (const row of overview) {
    const entry = tracks.get(row.track_id) ?? { name: row.track_name, slug: row.track_slug, layouts: [] };
    entry.layouts.push(row);
    tracks.set(row.track_id, entry);
  }

  return (
    <>
      <PageTitle title="Sirkuit">
        Layout TA (time attack) adalah fokus utama. Layout drift tetap dicatat bila ada yang mengirim.
      </PageTitle>

      {tracks.size === 0 ? <p className="text-ink-2">Belum ada sirkuit terdaftar.</p> : null}

      <div className="panel overflow-x-auto">
        <table className="sheet">
          <thead>
            <tr>
              <th>Layout</th>
              <th>Tipe</th>
              <th className="right">Rekor</th>
              <th>Pemegang</th>
              <th className="right">Pemain</th>
            </tr>
          </thead>
          {[...tracks.values()].map((track) => (
            <tbody key={track.slug}>
              <tr className="group">
                <td colSpan={5} className="!border-b-rule-strong !pt-5">
                  <span className="heading text-[16px]">{track.name}</span>
                </td>
              </tr>
              {track.layouts.map((row) => (
                <tr key={row.layout_id}>
                  <td>
                    <Link className="link" href={`/sirkuit/${row.track_slug}/${row.layout_slug}`}>
                      {row.layout_name}
                    </Link>
                  </td>
                  <td className="label !text-ink">{LAYOUT_TYPE_LABEL[row.layout_type]}</td>
                  <td className="right num">
                    {row.record_ms !== null ? (
                      <span className="text-record">{formatLapTime(row.record_ms)}</span>
                    ) : (
                      <span className="text-ink-2">---</span>
                    )}
                  </td>
                  <td>{row.record_username ?? ""}</td>
                  <td className="right num">{row.driver_count}</td>
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </>
  );
}
