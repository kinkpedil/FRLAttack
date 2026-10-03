import "server-only";
import { createClient } from "./supabase/server";
import type {
  Car,
  DriverRating,
  EventResult,
  EventRow,
  LayoutOverviewRow,
  LayoutScore,
  LayoutType,
  LeaderboardRow,
  PersonalBestRow,
  Season,
  StandingRow,
} from "./types";

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

// ---------------------------------------------------------------------------
// Rating, event, musim, statistik (docs/RATING.md)
// ---------------------------------------------------------------------------

export async function getDriverRatings(): Promise<DriverRating[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_driver_ratings");
  if (error) fail("get_driver_ratings", error);
  return data as DriverRating[];
}

export type LayoutScoreDetail = LayoutScore & { layout_name: string; layout_slug: string; track_slug: string };

export async function getLayoutScores(userId: string): Promise<LayoutScoreDetail[]> {
  const supabase = await createClient();
  const [{ data, error }, overview] = await Promise.all([
    supabase.rpc("get_driver_layout_scores", { p_user_id: userId }),
    getLayoutOverview(),
  ]);
  if (error) fail("get_driver_layout_scores", error);
  const layouts = new Map(overview.map((row) => [row.layout_id, row]));
  return (data as LayoutScore[])
    .filter((row) => layouts.has(row.layout_id))
    .map((row) => {
      const layout = layouts.get(row.layout_id)!;
      return { ...row, layout_name: layout.layout_name, layout_slug: layout.layout_slug, track_slug: layout.track_slug };
    })
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}

export type RatingPoint = { taken_on: string; rating: number; division: string };

export async function getRatingHistory(userId: string, limit = 90): Promise<RatingPoint[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rating_snapshots")
    .select("taken_on, rating, division")
    .eq("user_id", userId)
    .order("taken_on", { ascending: false })
    .limit(limit);
  if (error) fail("getRatingHistory", error);
  return (data as RatingPoint[]).reverse();
}

export async function getEvents(seasonId?: string | null): Promise<EventRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_events", { p_season_id: seasonId ?? null });
  if (error) fail("get_events", error);
  return data as EventRow[];
}

export async function getEventResults(eventId: string): Promise<EventResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_event_results", { p_event_id: eventId });
  if (error) fail("get_event_results", error);
  return data as EventResult[];
}

export async function getSeasons(): Promise<Season[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("seasons").select("*").order("starts_on", { ascending: false });
  if (error) fail("getSeasons", error);
  return data as Season[];
}

// Musim yang sedang berjalan; jika tidak ada, musim terbaru yang sudah mulai.
export function pickCurrentSeason(seasons: Season[], today = todayWib()): Season | null {
  return (
    seasons.find((s) => s.starts_on <= today && today <= s.ends_on) ??
    seasons.find((s) => s.starts_on <= today) ??
    seasons[0] ??
    null
  );
}

export function todayWib(): string {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function getSeasonStandings(seasonId: string): Promise<StandingRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_season_standings", { p_season_id: seasonId });
  if (error) fail("get_season_standings", error);
  return data as StandingRow[];
}

export type SiteStats = { drivers: number; approved_laps: number; layouts_with_records: number; events_held: number };

export async function getSiteStats(): Promise<SiteStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_site_stats").single();
  if (error) fail("get_site_stats", error);
  return data as SiteStats;
}

export type ActiveDriver = { username: string; country: string | null; lap_count: number; layout_count: number };

export async function getMostActive(days = 30, limit = 10): Promise<ActiveDriver[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_most_active", { p_days: days, p_limit: limit });
  if (error) fail("get_most_active", error);
  return data as ActiveDriver[];
}

export type CarUsage = { car_slug: string; car_name: string; driver_count: number; lap_count: number };

export async function getCarUsage(): Promise<CarUsage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_car_usage");
  if (error) fail("get_car_usage", error);
  return data as CarUsage[];
}

// Waktu request, untuk hitung mundur awal yang dirender server.
export function requestTime(): number {
  return Date.now();
}
