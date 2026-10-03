export type UserRole = "user" | "mod" | "admin";
export type SubmissionStatus = "pending" | "approved" | "rejected" | "withdrawn";
export type LayoutType = "time_attack" | "drift" | "other";

export type Profile = {
  id: string;
  username: string;
  ingame_name: string | null;
  country: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
};

export type Track = {
  id: string;
  slug: string;
  name: string;
  real_world_reference: string | null;
  sort_order: number;
  is_active: boolean;
};

export type Layout = {
  id: string;
  track_id: string;
  slug: string;
  name: string;
  type: LayoutType;
  sort_order: number;
  is_active: boolean;
};

export type Car = {
  id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_active: boolean;
};

export type Submission = {
  id: string;
  user_id: string;
  layout_id: string;
  car_id: string;
  category_id: string;
  time_ms: number;
  platform: "android" | "ios" | null;
  control: "buttons" | "tilt" | "other" | null;
  game_version: string | null;
  video_url: string | null;
  original_path: string;
  preview_path: string;
  image_width: number;
  image_height: number;
  status: SubmissionStatus;
  reject_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type LeaderboardRow = {
  position: number;
  submission_id: string;
  user_id: string;
  username: string;
  ingame_name: string | null;
  country: string | null;
  car_slug: string;
  car_name: string;
  time_ms: number;
  gap_ms: number;
  created_at: string;
};

export type LayoutOverviewRow = {
  track_id: string;
  track_slug: string;
  track_name: string;
  layout_id: string;
  layout_slug: string;
  layout_name: string;
  layout_type: LayoutType;
  driver_count: number;
  record_ms: number | null;
  record_username: string | null;
  record_car_name: string | null;
  record_at: string | null;
};

export type PersonalBestRow = {
  submission_id: string;
  track_slug: string;
  track_name: string;
  layout_slug: string;
  layout_name: string;
  category_slug: string;
  car_name: string;
  time_ms: number;
  position: number;
  created_at: string;
};

export type Division = "div1" | "div2" | "div3" | "div4" | "div5" | "div6" | "rookie";

export type DriverRating = {
  position: number;
  user_id: string;
  username: string;
  country: string | null;
  rating: number;
  division: Division;
  layouts_driven: number;
  layouts_counted: number;
};

export type LayoutScore = {
  user_id: string;
  layout_id: string;
  time_ms: number;
  record_ms: number;
  driver_count: number;
  score: number | null;
};

export type EventStatus = "upcoming" | "live" | "finished";

export type EventRow = {
  id: string;
  slug: string;
  name: string;
  season_id: string | null;
  season_name: string | null;
  track_slug: string;
  track_name: string;
  layout_slug: string;
  layout_name: string;
  car_name: string | null;
  starts_at: string;
  ends_at: string;
  status: EventStatus;
  participant_count: number;
  leader_username: string | null;
  leader_time_ms: number | null;
};

export type EventResult = {
  position: number;
  submission_id: string;
  user_id: string;
  username: string;
  country: string | null;
  car_name: string;
  time_ms: number;
  gap_ms: number;
  points: number;
  created_at: string;
};

export type Season = {
  id: string;
  slug: string;
  name: string;
  starts_on: string;
  ends_on: string;
};

export type StandingRow = {
  position: number;
  user_id: string;
  username: string;
  country: string | null;
  points: number;
  events_entered: number;
  wins: number;
  best_finish: number;
};
