import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next";

describe("safeNextPath", () => {
  it.each([
    ["/kirim", "/kirim"],
    ["/sirkuit/gunsai/ta?mobil=ae86", "/sirkuit/gunsai/ta?mobil=ae86"],
    ["https://jahat.example", "/"],
    ["//jahat.example", "/"],
    ["/\\jahat.example", "/"],
    [null, "/"],
  ])("%j menjadi %j", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
