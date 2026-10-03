import type { Metadata } from "next";
import Link from "next/link";
import { DivisionBadge } from "@/components/division-badge";
import { PageTitle } from "@/components/page-title";
import { Panel } from "@/components/panel";
import { getDriverRatings, getSeasons, getSeasonStandings, pickCurrentSeason } from "@/lib/data";
import { formatDate, formatPosition } from "@/lib/format";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { title: "Klasemen" };

export default async function StandingsPage(props: PageProps<"/klasemen">) {
  const query = await props.searchParams;
  const [seasons, viewer, ratings] = await Promise.all([getSeasons(), getViewer(), getDriverRatings()]);
  const requested = typeof query.musim === "string" ? seasons.find((s) => s.slug === query.musim) : undefined;
  const season = requested ?? pickCurrentSeason(seasons);
  const standings = season ? await getSeasonStandings(season.id) : [];
  const divisions = new Map(ratings.map((r) => [r.user_id, r.division]));

  return (
    <>
      <PageTitle title={season ? `Klasemen ${season.name}` : "Klasemen"}>
        {season
          ? `${formatDate(season.starts_on)} sampai ${formatDate(season.ends_on)}. Poin dari semua event di musim ini, event yang sedang berjalan ikut dihitung sementara.`
          : "Belum ada musim."}
      </PageTitle>

      {seasons.length > 1 ? (
        <nav aria-label="Pilih musim" className="mb-4 flex flex-wrap gap-2">
          {seasons.map((s) => (
            <Link
              key={s.id}
              href={`/klasemen?musim=${s.slug}`}
              className={`btn !min-h-[32px] !text-[13px] ${s.id === season?.id ? "" : "btn-ghost"}`}
              aria-current={s.id === season?.id ? "page" : undefined}
            >
              {s.name}
            </Link>
          ))}
        </nav>
      ) : null}

      {season ? (
        <Panel title="Klasemen pembalap" flush>
          {standings.length === 0 ? (
            <p className="p-4 text-[14px] text-ink-2">Belum ada poin di musim ini.</p>
          ) : (
            <table className="sheet">
              <thead>
                <tr>
                  <th className="right w-12">Pos</th>
                  <th>Pemain</th>
                  <th className="hidden sm:table-cell">Divisi</th>
                  <th className="right">Poin</th>
                  <th className="right">Event</th>
                  <th className="right hidden sm:table-cell">Menang</th>
                  <th className="right hidden sm:table-cell">Terbaik</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s) => (
                  <tr key={s.user_id} className={s.user_id === viewer?.userId ? "mine" : ""}>
                    <td className="right num">{formatPosition(s.position)}</td>
                    <td>
                      <Link href={`/pemain/${s.username}`}>{s.username}</Link>
                      {s.country ? <span className="label ml-2">{s.country}</span> : null}
                    </td>
                    <td className="hidden sm:table-cell">
                      <DivisionBadge division={divisions.get(s.user_id) ?? "rookie"} />
                    </td>
                    <td className="right num">{s.points}</td>
                    <td className="right num">{s.events_entered}</td>
                    <td className="right num hidden sm:table-cell">{s.wins}</td>
                    <td className="right num hidden sm:table-cell">P{s.best_finish}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      ) : null}
    </>
  );
}
