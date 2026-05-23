import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatFileSize,
  formatNumber,
  formatRelativeTime,
} from "./format";

describe("formatNumber", () => {
  it("uses the locale-specific thousands separator", () => {
    expect(formatNumber(1234567, "pt-BR")).toBe("1.234.567");
    expect(formatNumber(1234567, "en")).toBe("1,234,567");
  });

  it("forwards Intl options", () => {
    expect(formatNumber(0.5, "en", { style: "percent" })).toBe("50%");
  });
});

describe("formatCurrency", () => {
  it("formats BRL in pt-BR", () => {
    const out = formatCurrency(1234.5, "pt-BR", "BRL");
    expect(out).toMatch(/R\$/);
    expect(out).toContain("1.234,50");
  });

  it("formats USD in en", () => {
    expect(formatCurrency(99, "en", "USD")).toBe("$99.00");
  });
});

describe("formatDate", () => {
  it("renders YYYY-MM-DD strings as dates", () => {
    const out = formatDate("2026-05-23", "en", { year: "numeric", month: "short", day: "numeric" });
    expect(out).toMatch(/May/);
    expect(out).toContain("2026");
  });

  it("accepts Date instances", () => {
    const out = formatDate(new Date("2026-01-15T00:00:00Z"), "en", {
      year: "numeric",
      timeZone: "UTC",
    });
    expect(out).toContain("2026");
  });
});

describe("formatFileSize", () => {
  it("returns bytes for small values", () => {
    expect(formatFileSize(0, "en")).toBe("0 B");
    expect(formatFileSize(999, "en")).toBe("999 B");
  });

  it("scales to kB / MB / GB", () => {
    expect(formatFileSize(1500, "en")).toBe("1.5 kB");
    expect(formatFileSize(2_500_000, "en")).toBe("2.5 MB");
    expect(formatFileSize(3_200_000_000, "en")).toBe("3.2 GB");
  });

  it("respects locale separator", () => {
    expect(formatFileSize(1500, "pt-BR")).toBe("1,5 kB");
  });

  it("clamps invalid input to 0 B", () => {
    expect(formatFileSize(-1, "en")).toBe("0 B");
    expect(formatFileSize(Number.NaN, "en")).toBe("0 B");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-05-23T12:00:00Z").getTime();

  it("returns a fresh-now style label for a few seconds delta", () => {
    const out = formatRelativeTime(now - 5_000, "en", now);
    expect(out.toLowerCase()).toContain("second");
  });

  it("returns minutes for a few-minutes delta", () => {
    const out = formatRelativeTime(now - 5 * 60_000, "en", now);
    expect(out.toLowerCase()).toContain("minute");
  });

  it("returns days for multi-day deltas", () => {
    const out = formatRelativeTime(now - 3 * 24 * 60 * 60_000, "en", now);
    expect(out.toLowerCase()).toMatch(/day|days/);
  });

  it("supports Date inputs", () => {
    const out = formatRelativeTime(new Date(now - 60_000), "en", new Date(now));
    expect(out.toLowerCase()).toContain("minute");
  });

  it("defaults the `to` argument to now", () => {
    const out = formatRelativeTime(Date.now() - 60_000, "en");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });
});
