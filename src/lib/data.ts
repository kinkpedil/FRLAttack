import "server-only";
import { createClient } from "./supabase/server";
import type { Car, LayoutOverviewRow, LayoutType, LeaderboardRow, PersonalBestRow } from "./types";

// Kumpulan query baca. Semua memakai sesi pengguna sehingga tunduk pada RLS.

function fail(context: string, error: { message: string }): never {
  throw new Error(`${context}: ${error.message}`);
}

export async function getLayoutOverview(): Promise<LayoutOverviewRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_layout_overview");
  if (error) fail("get_layout_overview", error);
  return data as LayoutOverviewRow[];
}

export type RecentLap = {
  id: string;
  time_ms: number;
  created_at: string;
  username: string;
  car_name: string;
  layout_slug: string;
  layout_name: string;
  track_slug: string;
};

export async function getRecentApproved(limit = 10): Promise<RecentLap[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select(
      "id, time_ms, created_at, reviewed_at, profiles!submissions_user_id_fkey(username), cars(name), track_layouts(slug, name, tracks(slug))",
    )
    .eq("status", "approved")
    .order("reviewed_at", { ascending: false })
    .limit(limit);
  if (error) fail("getRecentApproved", error);

  type Row = {
    id: string;
    time_ms: number;
    created_at: string;
    profiles: { username: string };
    cars: { name: string };
    track_layouts: { slug: string; name: string; tracks: { slug: string } };
  };
  return (data as unknown as Row[]).map((row) => ({
    id: row.id,
    time_ms: row.time_ms,
    created_at: row.created_at,
    username: row.profiles.username,
    car_name: row.cars.name,
    layout_slug: row.track_layouts.slug,
    layout_name: row.track_layouts.name,
    track_slug: row.track_layouts.tracks.slug,
  }));
}

export type LayoutDetail = {
  id: string;
  slug: string;
  name: string;
  type: LayoutType;
  track: { id: string; slug: string; name: string; real_world_reference: string | null };
};

export async function getLayoutBySlugs(trackSlug: string, layoutSlug: string): Promise<LayoutDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("track_layouts")
    .select("id, slug, name, type, tracks!inner(id, slug, name, real_world_reference)")
    .eq("slug", layoutSlug)
    .eq("tracks.slug", trackSlug)
    .maybeSingle();
  if (error) fail("getLayoutBySlugs", error);
  if (!data) return null;
  const { tracks, ...layout } = data as unknown as Omit<LayoutDetail, "track"> & { tracks: LayoutDetail["track"] };
  return { ...layout, track: tracks };
}

export async function getOpenCategoryId(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("id").eq("slug", "open").single();
  if (error) fail("getOpenCategoryId", error);
  return data.id as string;
}

export async function getLeaderboard(layoutId: string, carId?: string | null): Promise<LeaderboardRow[]> {
  const supabase = await createClient();
  const categoryId = await getOpenCategoryId();
  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_layout_id: layoutId,
    p_category_id: categoryId,
    p_car_id: carId ?? null,
  });
  if (error) fail("get_leaderboard", error);
  return data as LeaderboardRow[];
}

export async function getActiveCars(): Promise<Car[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cars")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");
  if (error) fail("getActiveCars", error);
  return data as Car[];
}

export type LayoutOption = { id: string; name: string; type: LayoutType; track_name: string };

export async function getActiveLayoutOptions(): Promise<LayoutOption[]> {
  const rows = await getLayoutOverview();
  return rows.map((row) => ({
    id: row.layout_id,
    name: row.layout_name,
    type: row.layout_type,
    track_name: row.track_name,
  }));
}

export async function getPersonalBests(userId: string): Promise<PersonalBestRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_personal_bests", { p_user_id: userId });
  if (error) fail("get_personal_bests", error);
  return data as PersonalBestRow[];
}

export type OwnSubmission = {
  id: string;
  time_ms: number;
  status: "pending" | "approved" | "rejected" | "withdrawn";
  reject_reason: string | null;
  created_at: string;
  car_name: string;
  layout_slug: string;
  layout_name: string;
  track_slug: string;
  track_name: string;
};

// Riwayat submission seorang pemain. Untuk orang lain, RLS hanya
// mengembalikan yang sudah diterima.
export async function getSubmissionsForUser(userId: string, limit = 100): Promise<OwnSubmission[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("submissions")
    .select("id, time_ms, status, reject_reason, created_at, cars(name), track_layouts(slug, name, tracks(slug, name))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("getSubmissionsForUser", error);

  type Row = Omit<OwnSubmission, "car_name" | "layout_slug" | "layout_name" | "track_slug" | "track_name"> & {
    cars: { name: string };
    track_layouts: { slug: string; name: string; tracks: { slug: string; name: string } };
  };
  return (data as unknown as Row[]).map(({ cars, track_layouts, ...row }) => ({
    ...row,
    car_name: cars.name,
    layout_slug: track_layouts.slug,
    layout_name: track_layouts.name,
    track_slug: track_layouts.tracks.slug,
    track_name: track_layouts.tracks.name,
  }));
}
