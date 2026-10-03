"use client";

import { useMemo, useState, useTransition } from "react";
import { formatLapTime, parseLapTime } from "@/lib/laptime";
import { createClient } from "@/lib/supabase/browser";
import type { LayoutOption } from "@/lib/data";
import type { Car } from "@/lib/types";
import { createSubmission } from "./actions";

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

type Props = {
  userId: string;
  layouts: LayoutOption[];
  cars: Car[];
  defaultLayoutId: string | null;
};

export function SubmitForm({ userId, layouts, cars, defaultLayoutId }: Props) {
  const [lapTime, setLapTime] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const parsed = useMemo(() => (lapTime.trim() ? parseLapTime(lapTime) : null), [lapTime]);

  const groups = useMemo(() => {
    const map = new Map<string, LayoutOption[]>();
    for (const layout of layouts) {
      map.set(layout.track_name, [...(map.get(layout.track_name) ?? []), layout]);
    }
    return [...map.entries()];
  }, [layouts]);

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const selected = event.target.files?.[0] ?? null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFile(null);
    if (!selected) return;
    if (!TYPES[selected.type]) {
      setError("Format harus PNG, JPG, atau WEBP.");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setError("Ukuran file lebih dari 8 MB.");
      return;
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    if (!parsed?.ok) {
      setError(parsed?.error ?? "Lap time wajib diisi.");
      return;
    }
    if (!file) {
      setError("Pilih screenshot dulu.");
      return;
    }

    startTransition(async () => {
      setStep("Mengunggah screenshot");
      const path = `incoming/${userId}/${crypto.randomUUID()}.${TYPES[file.type]}`;
      let uploadFailed = false;
      try {
        const { error: uploadError } = await createClient()
          .storage.from("screenshots")
          .upload(path, file, { contentType: file.type, upsert: false });
        uploadFailed = Boolean(uploadError);
      } catch {
        uploadFailed = true;
      }
      if (uploadFailed) {
        setStep(null);
        setError("Upload gagal. Periksa koneksi lalu coba lagi.");
        return;
      }

      setStep("Memeriksa dan menyimpan");
      const text = (name: string) => {
        const value = form.get(name);
        return typeof value === "string" && value !== "" ? value : null;
      };
      const result = await createSubmission({
        layoutId: String(form.get("layout") ?? ""),
        carId: String(form.get("car") ?? ""),
        lapTime,
        platform: text("platform") as "android" | "ios" | null,
        control: text("control") as "buttons" | "tilt" | "other" | null,
        gameVersion: text("game_version"),
        videoUrl: text("video_url"),
        uploadPath: path,
      });
      // Jika berhasil, action melakukan redirect dan baris ini tidak dijalankan.
      setStep(null);
      setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-8 md:grid-cols-[1fr_320px]">
      <div className="grid content-start gap-5">
        <label className="block">
          <span className="label mb-1 block">Layout</span>
          <select name="layout" required defaultValue={defaultLayoutId ?? ""} className="field">
            <option value="" disabled>
              Pilih layout
            </option>
            {groups.map(([track, items]) => (
              <optgroup key={track} label={track}>
                {items.map((layout) => (
                  <option key={layout.id} value={layout.id}>
                    {layout.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="label mb-1 block">Mobil</span>
          <select name="car" required defaultValue="" className="field">
            <option value="" disabled>
              Pilih mobil
            </option>
            {cars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="label mb-1 block">Lap time</span>
          <input
            name="lap_time"
            required
            autoComplete="off"
            spellCheck={false}
            placeholder={`1'24"320`}
            value={lapTime}
            onChange={(e) => setLapTime(e.target.value)}
            className="field num !text-[20px]"
          />
          <span className="mt-1 block text-[13px]" aria-live="polite">
            {parsed === null ? (
              <span className="text-ink-2">Tulis persis seperti di layar, sampai milidetik.</span>
            ) : parsed.ok ? (
              <span className="text-pb">
                Terbaca: <span className="num">{formatLapTime(parsed.ms)}</span>
              </span>
            ) : (
              <span className="text-alert">{parsed.error}</span>
            )}
          </span>
        </label>

        <fieldset>
          <legend className="label mb-1">Platform</legend>
          <div className="flex gap-5">
            <label className="flex items-center gap-2">
              <input type="radio" name="platform" value="android" /> Android
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="platform" value="ios" /> iOS
            </label>
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="label mb-1 block">Kontrol</span>
            <select name="control" defaultValue="" className="field">
              <option value="">Tidak diisi</option>
              <option value="buttons">Tombol</option>
              <option value="tilt">Tilt</option>
              <option value="other">Lainnya</option>
            </select>
          </label>
          <label className="block">
            <span className="label mb-1 block">Versi game (opsional)</span>
            <input name="game_version" maxLength={20} placeholder="0.4.x" className="field" />
          </label>
        </div>

        <label className="block">
          <span className="label mb-1 block">Link video (opsional)</span>
          <input name="video_url" type="url" maxLength={300} placeholder="https://" className="field" />
          <span className="mt-1 block text-[13px] text-ink-2">Bisa diminta moderator untuk rekor dan Top 3.</span>
        </label>
      </div>

      <div className="grid content-start gap-3">
        <label className="block">
          <span className="label mb-1 block">Screenshot layar hasil</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onFileChange}
            className="block w-full text-[14px] file:mr-3 file:cursor-pointer file:border file:border-ink file:bg-transparent file:px-3 file:py-2 file:text-ink"
          />
        </label>
        <div className="flex aspect-[16/9] items-center justify-center border border-dashed border-ink-2">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- pratinjau file lokal
            <img src={previewUrl} alt="Pratinjau screenshot" className="max-h-full max-w-full" />
          ) : (
            <span className="px-4 text-center text-[13px] text-ink-2">PNG, JPG, atau WEBP. Maks 8 MB. File asli.</span>
          )}
        </div>

        {error ? (
          <p className="notice notice-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn w-full" disabled={pending}>
          {pending ? `${step ?? "Mengirim"}...` : "Kirim"}
        </button>
        <p className="text-[13px] text-ink-2">
          Setelah dikirim, lap time dicek moderator sebelum masuk leaderboard.
        </p>
      </div>
    </form>
  );
}
