"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { inspectScreenshot, makePreview, ScreenshotError } from "@/lib/image";
import { parseLapTime } from "@/lib/laptime";
import { createAdminClient, SCREENSHOT_BUCKET } from "@/lib/supabase/admin";
import { getViewer } from "@/lib/viewer";

const MAX_PER_HOUR = 10;

const schema = z.object({
  layoutId: z.uuid({ error: "Pilih layout." }),
  carId: z.uuid({ error: "Pilih mobil." }),
  lapTime: z.string().max(20),
  platform: z.enum(["android", "ios"]).nullable(),
  control: z.enum(["buttons", "tilt", "other"]).nullable(),
  gameVersion: z.string().trim().max(20).nullable(),
  videoUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https:\/\/\S+$/.test(v), "Link video harus diawali https://")
    .nullable(),
  uploadPath: z.string().max(200),
});

export type SubmitInput = z.input<typeof schema>;
export type SubmitResult = { error: string };

export async function createSubmission(input: SubmitInput): Promise<SubmitResult> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Sesi login habis. Masuk lagi lalu kirim ulang." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Isian tidak valid." };
  const values = parsed.data;

  const admin = createAdminClient();
  const bucket = admin.storage.from(SCREENSHOT_BUCKET);

  const uploadPrefix = `incoming/${viewer.userId}/`;
  const uploadPath = values.uploadPath;
  if (!uploadPath.startsWith(uploadPrefix) || uploadPath.includes("..") || uploadPath.slice(uploadPrefix.length).includes("/")) {
    return { error: "Lokasi upload tidak valid." };
  }
  const discardUpload = () => bucket.remove([uploadPath]);

  const lap = parseLapTime(values.lapTime);
  if (!lap.ok) {
    await discardUpload();
    return { error: lap.error };
  }

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", viewer.userId)
    .gte("created_at", since);
  if ((count ?? 0) >= MAX_PER_HOUR) {
    await discardUpload();
    return { error: `Batas ${MAX_PER_HOUR} kiriman per jam tercapai. Coba lagi nanti.` };
  }

  const [{ data: layout }, { data: car }, { data: category }] = await Promise.all([
    admin.from("track_layouts").select("id, is_active, tracks!inner(is_active)").eq("id", values.layoutId).maybeSingle(),
    admin.from("cars").select("id, is_active").eq("id", values.carId).maybeSingle(),
    admin.from("categories").select("id").eq("slug", "open").single(),
  ]);
  const layoutTrack = layout?.tracks as unknown as { is_active: boolean } | undefined;
  if (!layout?.is_active || !layoutTrack?.is_active) {
    await discardUpload();
    return { error: "Layout tidak ditemukan." };
  }
  if (!car?.is_active) {
    await discardUpload();
    return { error: "Mobil tidak ditemukan." };
  }
  if (!category) return { error: "Kategori Open belum ada di database." };

  const { data: blob, error: downloadError } = await bucket.download(uploadPath);
  if (downloadError || !blob) return { error: "Screenshot tidak ditemukan. Upload ulang." };
  const bytes = Buffer.from(await blob.arrayBuffer());

  let info;
  try {
    info = await inspectScreenshot(bytes);
  } catch (err) {
    await discardUpload();
    if (err instanceof ScreenshotError) return { error: err.message };
    throw err;
  }

  // Screenshot yang sama persis: milik orang lain (status apa pun) atau
  // masih aktif milik sendiri.
  const { data: dupes } = await admin
    .from("submissions")
    .select("user_id, status")
    .eq("image_sha256", info.sha256);
  if ((dupes ?? []).some((d) => d.user_id !== viewer.userId || d.status === "pending" || d.status === "approved")) {
    await discardUpload();
    return { error: "Screenshot ini sudah pernah dikirim. Setiap screenshot hanya bisa dipakai satu kali." };
  }

  const id = randomUUID();
  const originalPath = `originals/${id}.${info.ext}`;
  const previewPath = `previews/${id}.webp`;

  const { error: moveError } = await bucket.move(uploadPath, originalPath);
  if (moveError) return { error: "Gagal menyimpan screenshot. Coba lagi." };

  const preview = await makePreview(bytes);
  const { error: previewError } = await bucket.upload(previewPath, preview, { contentType: "image/webp" });
  if (previewError) {
    await bucket.remove([originalPath]);
    return { error: "Gagal menyimpan screenshot. Coba lagi." };
  }

  const { error: insertError } = await admin.from("submissions").insert({
    id,
    user_id: viewer.userId,
    layout_id: values.layoutId,
    car_id: values.carId,
    category_id: category.id,
    time_ms: lap.ms,
    platform: values.platform,
    control: values.control,
    game_version: values.gameVersion || null,
    video_url: values.videoUrl || null,
    original_path: originalPath,
    preview_path: previewPath,
    image_sha256: info.sha256,
    image_dhash: info.dhash.toString(),
    image_width: info.width,
    image_height: info.height,
  });
  if (insertError) {
    await bucket.remove([originalPath, previewPath]);
    if (insertError.code === "23505") {
      return { error: "Screenshot ini sudah pernah dikirim. Setiap screenshot hanya bisa dipakai satu kali." };
    }
    return { error: "Gagal menyimpan submission. Coba lagi." };
  }

  await admin.from("audit_log").insert({
    actor_id: viewer.userId,
    action: "submission.created",
    target_id: id,
    payload: { time_ms: lap.ms },
  });

  redirect("/saya?baru=1");
}
