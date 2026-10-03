import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { formatDate } from "@/lib/format";
import { formatLapTime } from "@/lib/laptime";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/viewer";

export const metadata: Metadata = { title: "Moderasi" };

type QueueRow = {
  id: string;
  time_ms: number;
  created_at: string;
  profiles: { username: string };
  cars: { name: string };
  track_layouts: { name: string };
};

export default async function ModQueuePage() {
  await requireRole("mod", "/mod");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("id, time_ms, created_at, profiles!submissions_user_id_fkey(username), cars(name), track_layouts(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw new Error(error.message);
  const rows = data as unknown as QueueRow[];

  return (
    <>
      <PageTitle kicker="Moderasi" title={`Antrian (${rows.length})`}>
        Yang paling lama menunggu ada di atas.
      </PageTitle>
      {rows.length === 0 ? (
        <p className="text-ink-2">Antrian kosong.</p>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="sheet">
            <thead>
              <tr>
                <th>Masuk</th>
                <th>Pemain</th>
                <th>Layout</th>
                <th>Mobil</th>
                <th className="right">Lap time</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="num whitespace-nowrap text-ink-2">{formatDate(row.created_at, false)}</td>
                  <td>{row.profiles.username}</td>
                  <td>{row.track_layouts.name}</td>
                  <td>{row.cars.name}</td>
                  <td className="right num">{formatLapTime(row.time_ms)}</td>
                  <td className="right">
                    <Link className="link" href={`/mod/${row.id}`}>
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
