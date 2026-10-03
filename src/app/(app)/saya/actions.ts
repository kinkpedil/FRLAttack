"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function withdrawSubmission(formData: FormData) {
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  // withdraw_submission sendiri memastikan hanya pemilik yang bisa menarik.
  await supabase.rpc("withdraw_submission", { p_submission_id: id.data });
  revalidatePath("/saya");
}
