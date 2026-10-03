"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Semua penulisan memakai sesi pengguna: RLS hanya mengizinkan admin.

export type AdminState = { error?: string; ok?: string };

const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9-]{1,40}$/, "Slug: huruf kecil, angka, tanda minus.");
const name = z.string().trim().min(1, "Nama wajib diisi.").max(60);
const sortOrder = z.coerce.number().int().min(0).max(10000).default(0);

function explain(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "Slug sudah dipakai.";
  if (error.code === "42501") return "Hanya admin.";
  if (error.code === "23514") return "Isian tidak memenuhi syarat (slug sirkuit dan mobil minimal 2 karakter).";
  return error.message;
}

function done(message: string): AdminState {
  revalidatePath("/", "layout");
  return { ok: message };
}

export async function createTrack(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const parsed = z
    .object({ slug, name, real_world_reference: z.string().trim().max(120), sort_order: sortOrder })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase
    .from("tracks")
    .insert({ ...parsed.data, real_world_reference: parsed.data.real_world_reference || null });
  return error ? { error: explain(error) } : done(`Sirkuit ${parsed.data.name} ditambahkan.`);
}

export async function createLayout(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const parsed = z
    .object({
      track_id: z.uuid("Pilih sirkuit."),
      slug,
      name,
      type: z.enum(["time_attack", "drift", "other"]),
      sort_order: sortOrder,
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.from("track_layouts").insert(parsed.data);
  return error ? { error: explain(error) } : done(`Layout ${parsed.data.name} ditambahkan.`);
}

export async function createCar(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const parsed = z.object({ slug, name, sort_order: sortOrder }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.from("cars").insert(parsed.data);
  return error ? { error: explain(error) } : done(`Mobil ${parsed.data.name} ditambahkan.`);
}

export async function setRole(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const parsed = z
    .object({ username: z.string().trim().min(3), role: z.enum(["user", "mod", "admin"]) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Isi nama pengguna dan peran." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_role", { p_username: parsed.data.username, p_role: parsed.data.role });
  return error ? { error: explain(error) } : done(`Peran ${parsed.data.username} sekarang ${parsed.data.role}.`);
}

const TABLES = { tracks: "tracks", layouts: "track_layouts", cars: "cars" } as const;

export async function toggleActive(formData: FormData): Promise<void> {
  const parsed = z
    .object({ table: z.enum(["tracks", "layouts", "cars"]), id: z.uuid(), active: z.enum(["true", "false"]) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase
    .from(TABLES[parsed.data.table])
    .update({ is_active: parsed.data.active === "true" })
    .eq("id", parsed.data.id);
  revalidatePath("/", "layout");
}

// Input datetime-local ("2026-10-05T00:00") dibaca sebagai WIB.
const wibDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Isi tanggal dan jam.")
  .transform((v) => new Date(`${v}:00+07:00`).toISOString());

export async function createSeason(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const parsed = z
    .object({
      slug,
      name,
      starts_on: z.iso.date("Isi tanggal mulai."),
      ends_on: z.iso.date("Isi tanggal selesai."),
    })
    .refine((v) => v.ends_on >= v.starts_on, "Tanggal selesai harus setelah tanggal mulai.")
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.from("seasons").insert(parsed.data);
  return error ? { error: explain(error) } : done(`Musim ${parsed.data.name} dibuat.`);
}

export async function createEvent(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const parsed = z
    .object({
      name: z.string().trim().min(1, "Nama wajib diisi.").max(80),
      slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]{2,60}$/, "Slug: huruf kecil, angka, tanda minus."),
      layout_id: z.uuid("Pilih layout."),
      car_id: z.union([z.literal(""), z.uuid()]).transform((v) => v || null),
      season_id: z.union([z.literal(""), z.uuid()]).transform((v) => v || null),
      starts_at: wibDateTime,
      ends_at: wibDateTime,
      notes: z.string().trim().max(500).transform((v) => v || null),
    })
    .refine((v) => v.ends_at > v.starts_at, "Waktu selesai harus setelah waktu mulai.")
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.from("events").insert(parsed.data);
  return error ? { error: explain(error) } : done(`Event ${parsed.data.name} dibuat.`);
}

export async function deleteEvent(formData: FormData): Promise<void> {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id.data);
  revalidatePath("/", "layout");
}
