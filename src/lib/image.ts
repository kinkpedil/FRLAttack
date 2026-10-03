import "server-only";
import { createHash } from "node:crypto";
import sharp, { type Metadata as SharpMetadata } from "sharp";

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MIN_SHORT_SIDE = 720;
const FORMATS = { png: "png", jpeg: "jpg", webp: "webp" } as const;

export type ScreenshotInfo = {
  ext: (typeof FORMATS)[keyof typeof FORMATS];
  width: number;
  height: number;
  sha256: string;
  dhash: bigint;
};

export class ScreenshotError extends Error {}

export async function inspectScreenshot(bytes: Buffer): Promise<ScreenshotInfo> {
  if (bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new ScreenshotError("Ukuran file lebih dari 8 MB.");
  }

  let meta: SharpMetadata;
  try {
    meta = await sharp(bytes).metadata();
  } catch {
    throw new ScreenshotError("File bukan gambar yang valid.");
  }

  const format = meta.format as keyof typeof FORMATS | undefined;
  if (!format || !(format in FORMATS)) {
    throw new ScreenshotError("Format harus PNG, JPG, atau WEBP.");
  }

  const width = meta.autoOrient?.width ?? meta.width ?? 0;
  const height = meta.autoOrient?.height ?? meta.height ?? 0;
  if (Math.min(width, height) < MIN_SHORT_SIDE) {
    throw new ScreenshotError(
      `Resolusi terlalu kecil (${width}x${height}). Sisi terpendek minimal ${MIN_SHORT_SIDE} piksel. Kirim file asli, bukan hasil kompres aplikasi chat.`,
    );
  }

  return {
    ext: FORMATS[format],
    width,
    height,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    dhash: await differenceHash(bytes),
  };
}

// dHash 64 bit: perkecil ke 9x8 abu-abu, bandingkan piksel bersebelahan.
// Dipakai untuk menandai gambar yang mirip (misal screenshot sama yang
// disimpan ulang). Dikembalikan sebagai bigint bertanda agar muat di kolom bigint.
export async function differenceHash(bytes: Buffer): Promise<bigint> {
  const pixels = await sharp(bytes)
    .autoOrient()
    .grayscale()
    .resize(9, 8, { fit: "fill" })
    .raw()
    .toBuffer();

  let hash = BigInt(0);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = pixels[y * 9 + x];
      const right = pixels[y * 9 + x + 1];
      hash = (hash << BigInt(1)) | (left > right ? BigInt(1) : BigInt(0));
    }
  }
  return BigInt.asIntN(64, hash);
}

export function hammingDistance(a: bigint, b: bigint): number {
  let x = BigInt.asUintN(64, a ^ b);
  let count = 0;
  while (x > BigInt(0)) {
    count += Number(x & BigInt(1));
    x >>= BigInt(1);
  }
  return count;
}

// Versi tampilan: WEBP, lebar maks 1600, tanpa metadata (EXIF/lokasi).
export async function makePreview(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes)
    .autoOrient()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}
