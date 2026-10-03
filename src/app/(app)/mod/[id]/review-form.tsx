"use client";

import { useActionState } from "react";
import { reviewSubmission, type ReviewState } from "../actions";

const PRESETS = [
  "Lap time di screenshot berbeda dengan yang diisi",
  "Layout atau sirkuit tidak sesuai",
  "Mobil tidak sesuai",
  "Screenshot bukan layar hasil lap",
  "Screenshot terpotong atau tidak terbaca",
  "Tanda-tanda screenshot diedit",
  "Screenshot milik pemain lain",
];

export function ReviewForm({ id, canApprove }: { id: string; canApprove: boolean }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(reviewSubmission, {});

  return (
    <div className="grid gap-6">
      {canApprove ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="decision" value="approved" />
          <button type="submit" className="btn w-full" disabled={pending}>
            Terima
          </button>
        </form>
      ) : null}

      <form action={action} className={`grid gap-3 ${canApprove ? "border-t border-rule pt-5" : ""}`}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="decision" value="rejected" />
        <label className="block">
          <span className="label mb-1 block">Alasan</span>
          <select name="preset" defaultValue="" className="field">
            <option value="">Pilih alasan umum</option>
            {PRESETS.map((preset) => (
              <option key={preset} value={preset}>
                {preset}
              </option>
            ))}
          </select>
        </label>
        <textarea name="reason" rows={3} maxLength={400} placeholder="Catatan untuk pemain (opsional)" className="field" />
        <button type="submit" className="btn btn-danger w-full" disabled={pending}>
          Tolak
        </button>
      </form>

      {state.error ? (
        <p className="notice notice-error" role="alert">
          {state.error}
        </p>
      ) : null}
    </div>
  );
}
