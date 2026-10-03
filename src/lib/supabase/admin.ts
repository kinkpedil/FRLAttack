import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

// Client dengan secret key: melewati RLS. Hanya untuk server, dan hanya
// setelah hak akses dicek di kode pemanggil.
export function createAdminClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error("SUPABASE_SECRET_KEY belum diisi. Lihat .env.example.");
  return createClient(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const SCREENSHOT_BUCKET = "screenshots";
