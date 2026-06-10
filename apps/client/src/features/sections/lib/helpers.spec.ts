import { describe, expect, it } from "vitest";
import { suggestEndDateFromWorkload } from "./helpers";

describe("suggestEndDateFromWorkload", () => {
  it("lands an 8-semester course started in the first half on December", () => {
    // 3200h ≈ 8 semesters: Jan/Feb 2025 → graduates end of 2nd half of 2028.
    expect(suggestEndDateFromWorkload("2025-01-01", 3200)).toBe("2028-12-01");
    expect(suggestEndDateFromWorkload("2025-02-01", 3200)).toBe("2028-12-01");
  });

  it("lands an 8-semester course started in the second half on June", () => {
    expect(suggestEndDateFromWorkload("2025-08-01", 3200)).toBe("2029-06-01");
  });

  it("handles odd semester counts", () => {
    // 2000h ≈ 5 semesters: Feb 2025 → Jun 2027.
    expect(suggestEndDateFromWorkload("2025-02-01", 2000)).toBe("2027-06-01");
  });

  it("rounds workload to the nearest semester", () => {
    // 2400h ≈ 6 semesters: Feb 2025 → Dec 2027.
    expect(suggestEndDateFromWorkload("2025-02-01", 2400)).toBe("2027-12-01");
  });

  it("returns null without a parseable start date or workload", () => {
    expect(suggestEndDateFromWorkload("", 3200)).toBeNull();
    expect(suggestEndDateFromWorkload("2025-01-01", null)).toBeNull();
    expect(suggestEndDateFromWorkload("2025-01-01", 0)).toBeNull();
  });

  it("clamps absurd workloads instead of suggesting decades away", () => {
    // 14-semester cap (7 years): Feb 2025 → Dec 2031 even for a 40000h outlier.
    expect(suggestEndDateFromWorkload("2025-02-01", 40_000)).toBe("2031-12-01");
  });
});
