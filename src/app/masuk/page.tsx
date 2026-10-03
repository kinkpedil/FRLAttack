import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageTitle } from "@/components/page-title";
import { safeNextPath } from "@/lib/safe-next";
import { getViewer } from "@/lib/viewer";
import { signIn } from "./actions";

export const metadata: Metadata = { title: "Masuk" };

const ERRORS: Record<string, string> = {
  provider: "Pilihan login tidak dikenal.",
  oauth: "Gagal menghubungi layanan login. Coba lagi.",
  callback: "Login dibatalkan atau kedaluwarsa. Coba lagi.",
};

export default async function SignInPage(props: PageProps<"/masuk">) {
  const query = await props.searchParams;
  const next = safeNextPath(query.lanjut);
  if (await getViewer()) redirect(next);
  const error = typeof query.galat === "string" ? ERRORS[query.galat] : undefined;

  return (
    <>
      <PageTitle title="Masuk">
        Akun dibutuhkan untuk mengirim lap time. Email dari akun yang kamu pilih dipakai untuk login dan tidak pernah
        ditampilkan.
      </PageTitle>
      {error ? <p className="notice notice-error mb-6">{error}</p> : null}
      <div className="flex max-w-[320px] flex-col gap-3">
        <form action={signIn}>
          <input type="hidden" name="provider" value="discord" />
          <input type="hidden" name="lanjut" value={next} />
          <button type="submit" className="btn w-full">
            Masuk dengan Discord
          </button>
        </form>
        <form action={signIn}>
          <input type="hidden" name="provider" value="google" />
          <input type="hidden" name="lanjut" value={next} />
          <button type="submit" className="btn btn-ghost w-full">
            Masuk dengan Google
          </button>
        </form>
      </div>
    </>
  );
}
