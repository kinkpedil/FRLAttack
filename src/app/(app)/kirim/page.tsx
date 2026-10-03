import type { Metadata } from "next";
import Link from "next/link";
import { PageTitle } from "@/components/page-title";
import { getActiveCars, getActiveLayoutOptions, getEvents } from "@/lib/data";
import { requireViewer } from "@/lib/viewer";
import { SubmitForm } from "./submit-form";

export const metadata: Metadata = { title: "Kirim lap time" };

export default async function SubmitPage(props: PageProps<"/kirim">) {
  const query = await props.searchParams;
  const viewer = await requireViewer("/kirim");
  const [layouts, cars, events] = await Promise.all([getActiveLayoutOptions(), getActiveCars(), getEvents()]);
  const liveEvents = events.filter((e) => e.status === "live");
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
      {liveEvents.length > 0 ? (
        <div className="notice notice-info mb-5 grid gap-1 text-[14px]">
          {liveEvents.map((e) => (
            <p key={e.id}>
              <span className="status status-live mr-2">LIVE</span>
              <Link className="link" href={`/event/${e.slug}`}>
                {e.name}
              </Link>
              : kiriman di {e.layout_name}
              {e.car_name ? ` dengan ${e.car_name}` : ""} ikut dihitung.
            </p>
          ))}
        </div>
      ) : null}
      <div className="panel p-4 lg:p-6">
        <SubmitForm userId={viewer.userId} layouts={layouts} cars={cars} defaultLayoutId={defaultLayoutId} />
      </div>
    </>
  );
}
