import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatNumber, formatPosition } from "./format";

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

describe("formatDateTime", () => {
  it("menulis jam WIB", () => {
    expect(formatDateTime("2026-10-05T17:00:00Z")).toBe("06 OKT 00:00 WIB");
  });
});

describe("formatNumber", () => {
  it("pemisah ribuan titik", () => {
    expect(formatNumber(2150)).toBe("2.150");
    expect(formatNumber(999)).toBe("999");
  });
});
