"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  id: z.uuid(),
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().trim().max(500),
});

export type ReviewState = { error?: string };

export async function reviewSubmission(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const parsed = schema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
    reason: [formData.get("preset"), formData.get("reason")].filter((v) => typeof v === "string" && v.trim()).join(". "),
  });
  if (!parsed.success) return { error: "Isian tidak valid." };
  if (parsed.data.decision === "rejected" && !parsed.data.reason) {
    return { error: "Tulis alasan penolakan. Pemain akan membacanya." };
  }

  const supabase = await createClient();
  // review_submission mengecek peran moderator di database.
  const { error } = await supabase.rpc("review_submission", {
    p_submission_id: parsed.data.id,
    p_decision: parsed.data.decision,
    p_reason: parsed.data.reason || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/mod");
  redirect("/mod");
}
