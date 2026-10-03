"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-next";

const PROVIDERS = ["discord", "google"] as const;
type Provider = (typeof PROVIDERS)[number];

export async function signIn(formData: FormData) {
  const provider = formData.get("provider");
  if (!PROVIDERS.includes(provider as Provider)) redirect("/masuk?galat=provider");

  const next = safeNextPath(formData.get("lanjut"));
  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: { redirectTo: `${origin}/auth/callback?lanjut=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) redirect("/masuk?galat=oauth");
  redirect(data.url);
}
