import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import type { Profile } from "./types";

export type Viewer = { userId: string; profile: Profile };

// Pengguna yang sedang login beserta profilnya. null jika belum login.
export const getViewer = cache(async (): Promise<Viewer | null> => {
  // Selalu per request, juga saat env belum diisi, supaya status login
  // tidak pernah ikut dirender statis saat build.
  await connection();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single<Profile>();
  if (!profile) return null;
  return { userId, profile };
});

export async function requireViewer(next: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/masuk?lanjut=${encodeURIComponent(next)}`);
  return viewer;
}

export async function requireRole(role: "mod" | "admin", next: string): Promise<Viewer> {
  const viewer = await requireViewer(next);
  const allowed = role === "mod" ? ["mod", "admin"] : ["admin"];
  if (!allowed.includes(viewer.profile.role)) redirect("/");
  return viewer;
}
