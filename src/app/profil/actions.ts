"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

const schema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_.]{3,24}$/, "Nama pengguna 3 sampai 24 karakter: huruf kecil, angka, titik, atau garis bawah."),
  ingame_name: z.string().trim().max(32, "Nama di game maksimal 32 karakter."),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === "" || /^[A-Z]{2}$/.test(v), "Kode negara 2 huruf, contoh ID."),
});

export type ProfileState = { error?: string; ok?: boolean };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sesi login habis. Masuk lagi." };

  const parsed = schema.safeParse({
    username: formData.get("username") ?? "",
    ingame_name: formData.get("ingame_name") ?? "",
    country: formData.get("country") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      username: parsed.data.username,
      ingame_name: parsed.data.ingame_name || null,
      country: parsed.data.country || null,
    })
    .eq("id", viewer.userId);

  if (error) {
    if (error.code === "23505") return { error: "Nama pengguna sudah dipakai." };
    return { error: "Gagal menyimpan profil." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
