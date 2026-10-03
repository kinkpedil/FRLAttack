import type { Metadata } from "next";
import { PageTitle } from "@/components/page-title";
import { requireViewer } from "@/lib/viewer";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Ubah profil" };

export default async function ProfilePage() {
  const viewer = await requireViewer("/profil");
  return (
    <>
      <PageTitle title="Ubah profil" />
      <div className="panel max-w-[520px] p-4 lg:p-6">
        <ProfileForm profile={viewer.profile} />
      </div>
    </>
  );
}
