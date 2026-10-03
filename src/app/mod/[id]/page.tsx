import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/page-title";
import { StatusLabel } from "@/components/status-label";
import { getLeaderboard } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { formatGap, formatLapTime } from "@/lib/laptime";
import { createClient } from "@/lib/supabase/server";
import type { Submission, SubmissionStatus } from "@/lib/types";
import { requireRole } from "@/lib/viewer";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Review" };

type Detail = Submission & {
  profiles: { username: string; ingame_name: string | null; created_at: string };
  cars: { name: string };
  track_layouts: { id: string; name: string; tracks: { name: string } };
};

type Similar = {
  submission_id: string;
  username: string;
  status: SubmissionStatus;
  time_ms: number;
  distance: number;
  created_at: string;
};

const PLATFORM: Record<string, string> = { android: "Android", ios: "iOS" };
const CONTROL: Record<string, string> = { buttons: "Tombol", tilt: "Tilt", other: "Lainnya" };

export default async function ReviewPage(props: PageProps<"/mod/[id]">) {
  const { id } = await props.params;
  await requireRole("mod", `/mod/${id}`);
  const supabase = await createClient();

  const { data } = await supabase
    .from("submissions")
    .select(
      "*, profiles!submissions_user_id_fkey(username, ingame_name, created_at), cars(name), track_layouts(id, name, tracks(name))",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const sub = data as unknown as Detail;

  const [{ data: similar }, { data: history }, board] = await Promise.all([
    supabase.rpc("find_similar_submissions", { p_submission_id: id, p_max_distance: 6 }),
    supabase.from("submissions").select("status").eq("user_id", sub.user_id),
    getLeaderboard(sub.layout_id),
  ]);

  const counts = { approved: 0, rejected: 0, pending: 0, withdrawn: 0 };
  for (const row of (history ?? []) as { status: SubmissionStatus }[]) counts[row.status] += 1;

  const record = board[0] ?? null;
  const ownBest = board.find((row) => row.user_id === sub.user_id) ?? null;
  const flags: string[] = [];
  if (record && sub.time_ms < record.time_ms) flags.push(`Lebih cepat dari rekor (${formatLapTime(record.time_ms)}).`);
  if (!record) flags.push("Belum ada rekor di layout ini.");
  if (counts.approved < 3) flags.push(`Akun baru: baru ${counts.approved} submission diterima.`);
  if (!sub.profiles.ingame_name) flags.push("Pemain belum mengisi nama di game.");

  return (
    <>
      <PageTitle kicker={`Moderasi / ${sub.track_layouts.tracks.name}`} title={sub.track_layouts.name}>
        <Link className="link" href="/mod">
          Kembali ke antrian
        </Link>
      </PageTitle>

      <div className="grid gap-8 md:grid-cols-[1fr_300px]">
        <div>
          <a href={`/bukti/${sub.id}?asli=1`} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element -- URL bertanda tangan */}
            <img src={`/bukti/${sub.id}?asli=1`} alt="Screenshot asli" className="block h-auto w-full border border-ink" />
          </a>
          <p className="mt-2 text-[13px] text-ink-2">
            File asli {sub.image_width}x{sub.image_height}. Ketuk gambar untuk membuka ukuran penuh.
          </p>

          <h2 className="heading mb-2 mt-8 text-[16px]">Gambar mirip</h2>
          <p className="mb-3 text-[13px] text-ink-2">
            Layar hasil game selalu bertata letak sama, jadi kemiripan tinggi belum tentu gambar yang sama. Jarak 0
            sampai 2 patut dicek berdampingan.
          </p>
          {((similar ?? []) as Similar[]).length === 0 ? (
            <p className="text-[14px] text-ink-2">Tidak ada.</p>
          ) : (
            <table className="sheet">
              <thead>
                <tr>
                  <th className="right">Jarak</th>
                  <th>Pemain</th>
                  <th className="right">Lap time</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {((similar ?? []) as Similar[]).map((row) => (
                  <tr key={row.submission_id}>
                    <td className="right num">{row.distance}</td>
                    <td>{row.username}</td>
                    <td className="right num">{formatLapTime(row.time_ms)}</td>
                    <td>
                      <StatusLabel status={row.status} />
                    </td>
                    <td className="right">
                      <a className="link" href={`/bukti/${row.submission_id}?asli=1`} target="_blank" rel="noreferrer">
                        Lihat
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside className="grid content-start gap-6">
          <div>
            <p className="label">Diisi pemain</p>
            <p className="num text-[32px] leading-tight">{formatLapTime(sub.time_ms)}</p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[14px]">
              <dt className="text-ink-2">Pemain</dt>
              <dd>{sub.profiles.username}</dd>
              <dt className="text-ink-2">Nama game</dt>
              <dd>{sub.profiles.ingame_name ?? "-"}</dd>
              <dt className="text-ink-2">Mobil</dt>
              <dd>{sub.cars.name}</dd>
              <dt className="text-ink-2">Platform</dt>
              <dd>{sub.platform ? PLATFORM[sub.platform] : "-"}</dd>
              <dt className="text-ink-2">Kontrol</dt>
              <dd>{sub.control ? CONTROL[sub.control] : "-"}</dd>
              <dt className="text-ink-2">Versi</dt>
              <dd>{sub.game_version ?? "-"}</dd>
              <dt className="text-ink-2">Video</dt>
              <dd className="break-all">
                {sub.video_url ? (
                  <a className="link" href={sub.video_url} target="_blank" rel="noreferrer nofollow">
                    Buka
                  </a>
                ) : (
                  "-"
                )}
              </dd>
              <dt className="text-ink-2">Dikirim</dt>
              <dd className="num">{formatDate(sub.created_at)}</dd>
              <dt className="text-ink-2">Status</dt>
              <dd>
                <StatusLabel status={sub.status} />
              </dd>
            </dl>
          </div>

          <div className="text-[14px]">
            <p className="label mb-1">Konteks</p>
            <p>
              Rekor:{" "}
              <span className="num">{record ? `${formatLapTime(record.time_ms)} (${record.username})` : "-"}</span>
            </p>
            <p>
              PB pemain ini:{" "}
              <span className="num">{ownBest ? formatLapTime(ownBest.time_ms) : "-"}</span>
              {ownBest && sub.time_ms > ownBest.time_ms ? (
                <span className="num text-slower"> (kiriman ini {formatGap(sub.time_ms - ownBest.time_ms)})</span>
              ) : null}
            </p>
            <p>
              Riwayat: {counts.approved} diterima, {counts.rejected} ditolak, {counts.pending} menunggu
            </p>
          </div>

          {flags.length > 0 ? (
            <ul className="notice grid gap-1 text-[14px]">
              {flags.map((flag) => (
                <li key={flag}>{flag}</li>
              ))}
            </ul>
          ) : null}

          {sub.status === "pending" || sub.status === "approved" ? (
            <ReviewForm id={sub.id} canApprove={sub.status === "pending"} />
          ) : (
            <p className="text-ink-2">{sub.reject_reason ?? "Sudah ditarik pemain."}</p>
          )}
        </aside>
      </div>
    </>
  );
}
