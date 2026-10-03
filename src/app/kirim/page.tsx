import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { getActiveCars, getActiveLayoutOptions } from "@/lib/data";
import { requireViewer } from "@/lib/viewer";
import { SubmitForm } from "./submit-form";

export const metadata: Metadata = { title: "Kirim lap time" };

export default async function SubmitPage(props: PageProps<"/kirim">) {
  const query = await props.searchParams;
  const viewer = await requireViewer("/kirim");
  const [layouts, cars] = await Promise.all([getActiveLayoutOptions(), getActiveCars()]);
  const requested = typeof query.layout === "string" ? query.layout : null;
  const defaultLayoutId = layouts.some((l) => l.id === requested) ? requested : null;

  return (
    <>
      <PageTitle title="Kirim lap time">
        Pilih layout dan mobil yang sama dengan di screenshot. Baca dulu{" "}
        <Link className="link" href="/aturan">
          aturan screenshot
        </Link>
        .
      </PageTitle>
      <SubmitForm userId={viewer.userId} layouts={layouts} cars={cars} defaultLayoutId={defaultLayoutId} />
    </>
  );
}
