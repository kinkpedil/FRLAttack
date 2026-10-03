// Lap time disimpan sebagai milidetik (integer).
// Format tampilan mengikuti format yang diduga dipakai di layar game: 1'24"320.
// Konfirmasi dari sampel screenshot Fase 0 sebelum rilis.

export const MIN_LAP_MS = 1_000;
export const MAX_LAP_MS = 3_600_000;

export function formatLapTime(ms: number): string {
  const minutes = Math.floor(ms / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1000);
  const millis = ms % 1000;
  return `${minutes}'${String(seconds).padStart(2, "0")}"${String(millis).padStart(3, "0")}`;
}

export function formatGap(ms: number): string {
  if (ms <= 0) return "---";
  const seconds = Math.floor(ms / 1000);
  const millis = ms % 1000;
  return `+${seconds}.${String(millis).padStart(3, "0")}`;
}

export type ParseResult = { ok: true; ms: number } | { ok: false; error: string };

// Menerima: 1'24"320, 1'24.320, 1:24.320, 1:24:320, 84.320, 84"320.
// Milidetik wajib 3 angka, supaya cocok persis dengan layar game.
const WITH_MINUTES = /^(\d{1,2})\s*['’:]\s*(\d{1,2})\s*["”.:,]\s*(\d+)$/;
const SECONDS_ONLY = /^(\d{1,4})\s*["”.,]\s*(\d+)$/;

export function parseLapTime(input: string): ParseResult {
  const value = input.trim();
  if (value === "") return { ok: false, error: "Lap time wajib diisi." };

  let minutes = 0;
  let seconds: number;
  let fraction: string;

  const withMinutes = WITH_MINUTES.exec(value);
  const secondsOnly = withMinutes ? null : SECONDS_ONLY.exec(value);

  if (withMinutes) {
    minutes = Number(withMinutes[1]);
    seconds = Number(withMinutes[2]);
    fraction = withMinutes[3];
    if (seconds >= 60) return { ok: false, error: "Detik harus di bawah 60." };
  } else if (secondsOnly) {
    seconds = Number(secondsOnly[1]);
    fraction = secondsOnly[2];
  } else {
    return { ok: false, error: `Format tidak dikenali. Tulis seperti di layar game, contoh 1'24"320.` };
  }

  if (fraction.length !== 3) {
    return { ok: false, error: "Milidetik harus 3 angka, contoh 1'24\"320." };
  }

  const ms = minutes * 60_000 + seconds * 1000 + Number(fraction);
  if (ms < MIN_LAP_MS || ms > MAX_LAP_MS) {
    return { ok: false, error: "Lap time di luar batas wajar." };
  }
  return { ok: true, ms };
}
