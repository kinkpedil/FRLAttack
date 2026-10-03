import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, SCREENSHOT_BUCKET } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/viewer";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Mengarahkan ke signed URL screenshot. Hak akses mengikuti RLS submissions:
// publik untuk yang diterima, pemilik dan moderator untuk sisanya.
// ?asli=1 memberi file asli, khusus moderator.
export async function GET(request: NextRequest, ctx: RouteContext<"/bukti/[id]">) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return new NextResponse("Tidak ditemukan", { status: 404 });

  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("preview_path, original_path")
    .eq("id", id)
    .maybeSingle();
  if (!data) return new NextResponse("Tidak ditemukan", { status: 404 });

  let path = data.preview_path as string;
  if (request.nextUrl.searchParams.get("asli") === "1") {
    const viewer = await getViewer();
    if (!viewer || (viewer.profile.role !== "mod" && viewer.profile.role !== "admin")) {
      return new NextResponse("Tidak diizinkan", { status: 403 });
    }
    path = data.original_path as string;
  }

  const { data: signed, error } = await createAdminClient()
    .storage.from(SCREENSHOT_BUCKET)
    .createSignedUrl(path, 300);
  if (error || !signed) return new NextResponse("Gagal memuat gambar", { status: 502 });

  const response = NextResponse.redirect(signed.signedUrl, 302);
  response.headers.set("Cache-Control", "private, max-age=240");
  return response;
}
