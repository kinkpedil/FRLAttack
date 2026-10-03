// Tujuan bawaan setelah login.
export const DEFAULT_NEXT = "/dashboard";

// Hanya izinkan path internal untuk redirect setelah login.
export function safeNextPath(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_NEXT;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return DEFAULT_NEXT;
  return value;
}
