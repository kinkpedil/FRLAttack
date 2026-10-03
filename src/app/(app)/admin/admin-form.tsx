"use client";

import { useActionState } from "react";
import type { AdminState } from "./actions";

type Props = {
  title: string;
  action: (prev: AdminState, formData: FormData) => Promise<AdminState>;
  submitLabel: string;
  children: React.ReactNode;
};

export function AdminForm({ title, action, submitLabel, children }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="panel grid content-start gap-3 p-4">
      <h3 className="heading text-[16px]">{title}</h3>
      {children}
      {state.error ? <p className="notice notice-error text-[14px]">{state.error}</p> : null}
      {state.ok ? <p className="notice notice-ok text-[14px]">{state.ok}</p> : null}
      <div>
        <button type="submit" className="btn" disabled={pending}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      {children}
    </label>
  );
}
