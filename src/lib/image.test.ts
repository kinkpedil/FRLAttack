import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { differenceHash, hammingDistance, inspectScreenshot, makePreview, ScreenshotError } = await import("./image");

async function gradient(width: number, height: number, format: "png" | "jpeg" | "gif" = "png", flip = false) {
  const raw = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = Math.floor(((flip ? width - x : x) / width) * 255);
      raw.set([v, (y * 255) / height, 128], (y * width + x) * 3);
    }
  }
  return sharp(raw, { raw: { width, height, channels: 3 } }).toFormat(format).toBuffer();
}

describe("inspectScreenshot", () => {
  it("membaca ukuran, format, dan hash", async () => {
    const png = await gradient(1600, 720);
    const info = await inspectScreenshot(png);
    expect(info).toMatchObject({ ext: "png", width: 1600, height: 720 });
    expect(info.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("menolak resolusi kecil", async () => {
    await expect(inspectScreenshot(await gradient(800, 400))).rejects.toThrow(/Resolusi terlalu kecil/);
  });

  it("menolak format lain", async () => {
    await expect(inspectScreenshot(await gradient(1600, 720, "gif"))).rejects.toThrow(/Format harus/);
  });

  it("menolak file bukan gambar", async () => {
    await expect(inspectScreenshot(Buffer.from("bukan gambar"))).rejects.toBeInstanceOf(ScreenshotError);
  });
});

describe("differenceHash", () => {
  it("gambar sama yang disimpan ulang tetap mirip, gambar berbeda jauh", async () => {
    const png = await gradient(1600, 720);
    const jpeg = await sharp(png).jpeg({ quality: 70 }).toBuffer();
    const other = await gradient(1600, 720, "png", true);

    const a = await differenceHash(png);
    expect(hammingDistance(a, await differenceHash(jpeg))).toBeLessThanOrEqual(4);
    expect(hammingDistance(a, await differenceHash(other))).toBeGreaterThan(20);
  });

  it("muat di bigint bertanda 64 bit", async () => {
    const hash = await differenceHash(await gradient(1600, 720));
    expect(hash >= -(BigInt(2) ** BigInt(63)) && hash < BigInt(2) ** BigInt(63)).toBe(true);
  });
});

describe("makePreview", () => {
  it("mengecilkan ke WEBP maks 1600", async () => {
    const preview = await makePreview(await gradient(2400, 1080));
    const meta = await sharp(preview).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(1600);
  });
});
