const MONTHS = ["JAN", "FEB", "MAR", "APR", "MEI", "JUN", "JUL", "AGU", "SEP", "OKT", "NOV", "DES"];

// 03 OKT 2026 (zona waktu WIB, mayoritas pemain di Indonesia).
export function formatDate(value: string | Date, withYear = true): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const day = String(wib.getUTCDate()).padStart(2, "0");
  const month = MONTHS[wib.getUTCMonth()];
  return withYear ? `${day} ${month} ${wib.getUTCFullYear()}` : `${day} ${month}`;
}

export function formatPosition(position: number): string {
  return String(position).padStart(2, "0");
}

export const LAYOUT_TYPE_LABEL: Record<string, string> = {
  time_attack: "TA",
  drift: "DRIFT",
  other: "LAIN",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "MENUNGGU",
  approved: "DITERIMA",
  rejected: "DITOLAK",
  withdrawn: "DITARIK",
};
