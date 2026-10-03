import Link from "next/link";
import { getLayoutOverview, getRecentApproved } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { formatLapTime } from "@/lib/laptime";

export default async function HomePage() {
  const [overview, recent] = await Promise.all([getLayoutOverview(), getRecentApproved(10)]);
  const records = overview.filter((row) => row.record_ms !== null);

  return (
    <>
      <section className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
        <p className="max-w-[560px] text-[17px]">
          Leaderboard lap time FR Legends per sirkuit. Setiap waktu di sini punya screenshot bukti yang sudah dicek.
        </p>
        <Link href="/kirim" className="btn">
          Kirim lap time
        </Link>
      </section>

      <section className="mb-12">
        <h2 className="heading mb-3 text-[20px]">Rekor per layout</h2>
        {records.length === 0 ? (
          <p className="text-ink-2">
            Belum ada lap time yang diterima. Lihat <Link className="link" href="/sirkuit">daftar sirkuit</Link>.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="sheet">
              <thead>
                <tr>
                  <th>Layout</th>
                  <th className="right">Rekor</th>
                  <th>Pemegang</th>
                  <th className="hidden sm:table-cell">Mobil</th>
                  <th className="right">Pemain</th>
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
                      <span className="block text-[13px] text-ink-2 sm:hidden">{row.record_car_name}</span>
                    </td>
                    <td className="hidden sm:table-cell">{row.record_car_name}</td>
                    <td className="right num">{row.driver_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="heading mb-3 text-[20px]">Baru diterima</h2>
        {recent.length === 0 ? (
          <p className="text-ink-2">Belum ada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="sheet">
              <thead>
                <tr>
                  <th>Pemain</th>
                  <th>Layout</th>
                  <th className="hidden sm:table-cell">Mobil</th>
                  <th className="right">Lap time</th>
                  <th className="right hidden sm:table-cell">Tgl</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link href={`/pemain/${row.username}`}>{row.username}</Link>
                    </td>
                    <td>
                      <Link className="link whitespace-nowrap" href={`/sirkuit/${row.track_slug}/${row.layout_slug}`}>
                        {row.layout_name}
                      </Link>
                      <span className="block text-[13px] text-ink-2 sm:hidden">{row.car_name}</span>
                    </td>
                    <td className="hidden sm:table-cell">{row.car_name}</td>
                    <td className="right num">{formatLapTime(row.time_ms)}</td>
                    <td className="right num hidden whitespace-nowrap text-ink-2 sm:table-cell">{formatDate(row.created_at, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
