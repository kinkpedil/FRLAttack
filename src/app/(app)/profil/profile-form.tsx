"use client";

import { useActionState } from "react";
import type { Profile } from "@/lib/types";
import { updateProfile, type ProfileState } from "./actions";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});

  return (
    <form action={action} className="grid max-w-[420px] gap-5">
      <label className="block">
        <span className="label mb-1 block">Nama pengguna</span>
        <input name="username" defaultValue={profile.username} required className="field" />
        <span className="mt-1 block text-[13px] text-ink-2">Tampil di leaderboard dan alamat profil.</span>
      </label>
      <label className="block">
        <span className="label mb-1 block">Nama di game</span>
        <input name="ingame_name" defaultValue={profile.ingame_name ?? ""} maxLength={32} className="field" />
        <span className="mt-1 block text-[13px] text-ink-2">
          Isi persis seperti di FR Legends. Dipakai moderator untuk mencocokkan screenshot.
        </span>
      </label>
      <label className="block">
        <span className="label mb-1 block">Negara</span>
        <input
          name="country"
          defaultValue={profile.country ?? ""}
          maxLength={2}
          placeholder="ID"
          className="field !w-24 uppercase"
        />
      </label>
      {state.error ? <p className="notice notice-error">{state.error}</p> : null}
      {state.ok ? <p className="notice notice-ok">Profil disimpan.</p> : null}
      <div>
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );
}
