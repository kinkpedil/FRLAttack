import { describe, expect, it } from "vitest";
import { formatGap, formatLapTime, parseLapTime } from "./laptime";

describe("formatLapTime", () => {
  it("memakai format layar game", () => {
    expect(formatLapTime(84_320)).toBe(`1'24"320`);
    expect(formatLapTime(65_005)).toBe(`1'05"005`);
    expect(formatLapTime(9_870)).toBe(`0'09"870`);
    expect(formatLapTime(600_000)).toBe(`10'00"000`);
  });
});

describe("formatGap", () => {
  it("menulis selisih dalam detik", () => {
    expect(formatGap(0)).toBe("---");
    expect(formatGap(412)).toBe("+0.412");
    expect(formatGap(12_050)).toBe("+12.050");
  });
});

describe("parseLapTime", () => {
  it.each([
    [`1'24"320`, 84_320],
    [`1'24.320`, 84_320],
    [`1:24.320`, 84_320],
    [`1:24:320`, 84_320],
    [` 1’24”320 `, 84_320],
    [`84.320`, 84_320],
    [`84"320`, 84_320],
    [`0'59"999`, 59_999],
  ])("membaca %s", (input, ms) => {
    expect(parseLapTime(input)).toEqual({ ok: true, ms });
  });

  it.each([``, `abc`, `1'24"32`, `1'24"3200`, `1'60"000`, `0'00"500`, `99'00"000`])("menolak %j", (input) => {
    expect(parseLapTime(input).ok).toBe(false);
  });

  it("bolak-balik dengan formatLapTime", () => {
    for (const ms of [1_000, 59_999, 84_320, 123_456, 3_599_999]) {
      expect(parseLapTime(formatLapTime(ms))).toEqual({ ok: true, ms });
    }
  });
});
