import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { SubmissionList } from "@/components/submission-list";
import { getSubmissionsForUser } from "@/lib/data";
import { requireViewer } from "@/lib/viewer";
import { withdrawSubmission } from "./actions";

export const metadata: Metadata = { title: "Submission saya" };

export default async function MySubmissionsPage(props: PageProps<"/saya">) {
  const query = await props.searchParams;
  const viewer = await requireViewer("/saya");
  const rows = await getSubmissionsForUser(viewer.userId);

  return (
    <>
      <PageTitle kicker={viewer.profile.username} title="Submission saya">
        Lap time yang ditarik akan hilang dari leaderboard, dan PB kamu kembali ke waktu sebelumnya.{" "}
        <Link className="link" href={`/pemain/${viewer.profile.username}`}>
          Profil publik
        </Link>{" "}
        ·{" "}
        <Link className="link" href="/profil">
          Ubah profil
        </Link>
      </PageTitle>

      {query.baru ? (
        <p className="notice notice-ok mb-6">Terkirim. Lap time kamu menunggu dicek moderator.</p>
      ) : null}

      {rows.length === 0 ? (
        <p className="text-ink-2">
          Belum ada submission. <Link className="link" href="/kirim">Kirim lap time</Link>.
        </p>
      ) : (
        <SubmissionList rows={rows} showStatus withdrawAction={withdrawSubmission} />
      )}
    </>
  );
}
