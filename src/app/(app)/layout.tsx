import { SiteNav } from "@/components/site-nav";
import { getViewer } from "@/lib/viewer";

// Kerangka halaman fitur: sidebar di desktop, bilah atas di HP.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();

  return (
    <div className="min-h-dvh lg:flex">
      <SiteNav username={viewer?.profile.username ?? null} role={viewer?.profile.role ?? null} />
      <div className="min-w-0 flex-1">
        <main className="mx-auto w-full max-w-[1120px] px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
