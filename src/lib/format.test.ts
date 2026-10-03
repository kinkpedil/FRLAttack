import { describe, expect, it } from "vitest";
import { formatDate, formatPosition } from "./format";

describe("formatDate", () => {
  it("memakai bulan Indonesia dan WIB", () => {
    expect(formatDate("2026-10-03T05:00:00Z")).toBe("03 OKT 2026");
    // 20:00 UTC = 03:00 WIB keesokan harinya
    expect(formatDate("2026-08-27T20:00:00Z", false)).toBe("28 AGU");
  });
});

describe("formatPosition", () => {
  it("dua digit", () => {
    expect(formatPosition(1)).toBe("01");
    expect(formatPosition(12)).toBe("12");
    expect(formatPosition(120)).toBe("120");
  });
});
