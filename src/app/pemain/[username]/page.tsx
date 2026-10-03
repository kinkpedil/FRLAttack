import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/page-title";
import { SubmissionList } from "@/components/submission-list";
import { getPersonalBests, getSubmissionsForUser } from "@/lib/data";
import { formatDate, formatPosition } from "@/lib/format";
import { formatLapTime } from "@/lib/laptime";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

async function getProfile(username: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("username", username.toLowerCase()).maybeSingle<Profile>();
  return data;
}

export async function generateMetadata(props: PageProps<"/pemain/[username]">): Promise<Metadata> {
  const { username } = await props.params;
  return { title: username };
}

export default async function PlayerPage(props: PageProps<"/pemain/[username]">) {
  const { username } = await props.params;
  const profile = await getProfile(username);
  if (!profile) notFound();

  const [bests, history] = await Promise.all([getPersonalBests(profile.id), getSubmissionsForUser(profile.id, 50)]);
  const approved = history.filter((row) => row.status === "approved");

  return (
    <>
      <PageTitle kicker="Pemain" title={profile.username} keepCase>
        {[profile.ingame_name ? `Nama di game: ${profile.ingame_name}` : null, profile.country, `Bergabung ${formatDate(profile.created_at)}`]
          .filter(Boolean)
          .join(" · ")}
      </PageTitle>

      <section className="mb-12">
        <h2 className="heading mb-3 text-[20px]">Personal best</h2>
        {bests.length === 0 ? (
          <p className="text-ink-2">Belum ada lap time yang diterima.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="sheet">
              <thead>
                <tr>
                  <th>Layout</th>
                  <th>Mobil</th>
                  <th className="right">Lap time</th>
                  <th className="right">Pos</th>
                  <th className="right">Tgl</th>
                </tr>
              </thead>
              <tbody>
                {bests.map((row) => (
                  <tr key={row.submission_id}>
                    <td>
                      <Link className="link" href={`/sirkuit/${row.track_slug}/${row.layout_slug}`}>
                        {row.layout_name}
                      </Link>
                    </td>
                    <td>{row.car_name}</td>
                    <td className={`right num ${row.position === 1 ? "text-record" : ""}`}>{formatLapTime(row.time_ms)}</td>
                    <td className="right num">{formatPosition(row.position)}</td>
                    <td className="right num text-ink-2">{formatDate(row.created_at, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="heading mb-3 text-[20px]">Riwayat</h2>
        {approved.length === 0 ? <p className="text-ink-2">Belum ada.</p> : <SubmissionList rows={approved} />}
      </section>
    </>
  );
}
