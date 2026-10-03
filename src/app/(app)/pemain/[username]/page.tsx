import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DivisionBadge } from "@/components/division-badge";
import { PageTitle } from "@/components/page-title";
import { Panel, StatTile } from "@/components/panel";
import { RatingChart } from "@/components/rating-chart";
import { SubmissionList } from "@/components/submission-list";
import {
  getDriverRatings,
  getLayoutScores,
  getPersonalBests,
  getRatingHistory,
  getSeasons,
  getSeasonStandings,
  getSubmissionsForUser,
  pickCurrentSeason,
} from "@/lib/data";
import { formatDate, formatNumber, formatPosition } from "@/lib/format";
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

  const [ratings, scores, history, bests, submissions, seasons] = await Promise.all([
    getDriverRatings(),
    getLayoutScores(profile.id),
    getRatingHistory(profile.id),
    getPersonalBests(profile.id),
    getSubmissionsForUser(profile.id, 500),
    getSeasons(),
  ]);
  const season = pickCurrentSeason(seasons);
  const standings = season ? await getSeasonStandings(season.id) : [];

  const rating = ratings.find((r) => r.user_id === profile.id) ?? null;
  const standing = standings.find((s) => s.user_id === profile.id) ?? null;
  const approved = submissions.filter((row) => row.status === "approved");
  const counted = new Set(
    scores
      .filter((s) => s.score !== null)
      .slice(0, 5)
      .map((s) => s.layout_id),
  );

  return (
    <>
      <PageTitle kicker="Pemain" title={profile.username} keepCase>
        <span className="mr-2">{rating ? <DivisionBadge division={rating.division} /> : <DivisionBadge division="rookie" />}</span>
        {[profile.ingame_name ? `Nama di game: ${profile.ingame_name}` : null, profile.country, `Bergabung ${formatDate(profile.created_at)}`]
          .filter(Boolean)
          .join(" · ")}
      </PageTitle>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Rating" value={rating ? formatNumber(rating.rating) : "-"} note={rating ? `posisi ${rating.position} dari ${ratings.length}` : "belum ada lap time diterima"} />
        <StatTile label="Layout dihitung" value={rating ? `${rating.layouts_counted}/${rating.layouts_driven}` : "-"} note="maks 5 terbaik dipakai" />
        <StatTile label={season ? `Poin ${season.name}` : "Poin musim"} value={standing ? standing.points : "-"} note={standing ? `posisi ${standing.position}, ${standing.wins} kemenangan` : undefined} />
        <StatTile label="Lap diterima" value={approved.length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-5">
        <Panel title="Riwayat rating">
          <RatingChart points={history} />
        </Panel>

        <Panel title="Skor per layout" flush>
          {scores.length === 0 ? (
            <p className="p-4 text-[14px] text-ink-2">Belum ada lap time diterima.</p>
          ) : (
            <table className="sheet">
              <thead>
                <tr>
                  <th>Layout</th>
                  <th className="right">Dari rekor</th>
                  <th className="right">Skor</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s) => (
                  <tr key={s.layout_id}>
                    <td>
                      <Link className="link" href={`/sirkuit/${s.track_slug}/${s.layout_slug}`}>
                        {s.layout_name}
                      </Link>
                      {counted.has(s.layout_id) ? null : (
                        <span className="block text-[12px] text-ink-2">
                          {s.score === null ? `belum dihitung (${s.driver_count}/3 pemain)` : "di luar 5 terbaik"}
                        </span>
                      )}
                    </td>
                    <td className="right num">{((s.time_ms / s.record_ms) * 100).toFixed(2)}%</td>
                    <td className={`right num ${counted.has(s.layout_id) ? "" : "text-ink-2"}`}>{s.score === null ? "-" : formatNumber(s.score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:mt-5 lg:gap-5">
        <Panel title="Personal best" flush>
          {bests.length === 0 ? (
            <p className="p-4 text-[14px] text-ink-2">Belum ada lap time yang diterima.</p>
          ) : (
            <table className="sheet">
              <thead>
                <tr>
                  <th>Layout</th>
                  <th className="hidden sm:table-cell">Mobil</th>
                  <th className="right">Lap time</th>
                  <th className="right">Pos</th>
                  <th className="right hidden sm:table-cell">Tgl</th>
                </tr>
              </thead>
              <tbody>
                {bests.map((row) => (
                  <tr key={row.submission_id}>
                    <td>
                      <Link className="link" href={`/sirkuit/${row.track_slug}/${row.layout_slug}`}>
                        {row.layout_name}
                      </Link>
                      <span className="block text-[13px] text-ink-2 sm:hidden">{row.car_name}</span>
                    </td>
                    <td className="hidden sm:table-cell">{row.car_name}</td>
                    <td className={`right num ${row.position === 1 ? "text-record" : ""}`}>{formatLapTime(row.time_ms)}</td>
                    <td className="right num">{formatPosition(row.position)}</td>
                    <td className="right num hidden text-ink-2 sm:table-cell">{formatDate(row.created_at, false)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title="Riwayat lap" flush>
          {approved.length === 0 ? <p className="p-4 text-[14px] text-ink-2">Belum ada.</p> : <SubmissionList rows={approved.slice(0, 30)} />}
        </Panel>
      </div>
    </>
  );
}
