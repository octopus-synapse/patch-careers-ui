import type { Translator } from "@patch-careers/i18n";
import { describe, expect, it } from "vitest";
import { validateProfileField } from "./profile-validation";
import {
  EDUCATION_ITEMS,
  EXPERIENCE_ITEMS,
  FORM_FIXTURES,
  makeTestUsername,
} from "./test-fixtures";

const t = ((key: string) => key) as unknown as Translator;
const DATE_RE = /^\d{4}-\d{2}-01$/;
const DEGREE_TYPES = new Set([
  "HIGH_SCHOOL",
  "TECHNICAL",
  "BACHELOR",
  "MASTER",
  "DOCTORATE",
  "BOOTCAMP",
  "SELF_TAUGHT",
]);
const STATUSES = new Set(["IN_PROGRESS", "COMPLETED", "PAUSED", "DROPPED"]);

describe("onboarding test fixtures", () => {
  it("generates a schema-valid, unique-ish username", () => {
    expect(makeTestUsername()).toMatch(/^[a-z0-9]{3,30}$/);
  });

  it("profile fixtures pass the real profile-field validators", () => {
    const profile = {
      ...FORM_FIXTURES.personal,
      ...FORM_FIXTURES.headline,
      ...FORM_FIXTURES.links,
    };
    for (const [key, value] of Object.entries(profile)) {
      expect(validateProfileField(key, value, t), `${key} should be valid`).toBeNull();
    }
  });

  it("experience items carry the required content keys and YYYY-MM-01 dates", () => {
    expect(EXPERIENCE_ITEMS).toHaveLength(3);
    for (const item of EXPERIENCE_ITEMS) {
      const c = item.content ?? {};
      expect(c.company).toBeTruthy();
      expect(c.role).toBeTruthy();
      expect(String(c.startDate)).toMatch(DATE_RE);
      if (c.endDate) expect(String(c.endDate)).toMatch(DATE_RE);
    }
  });

  it("education items use valid enum values and dates", () => {
    expect(EDUCATION_ITEMS).toHaveLength(2);
    for (const item of EDUCATION_ITEMS) {
      const c = item.content ?? {};
      expect(c.institution).toBeTruthy();
      expect(DEGREE_TYPES.has(String(c.degreeType))).toBe(true);
      expect(STATUSES.has(String(c.status))).toBe(true);
      expect(String(c.startDate)).toMatch(DATE_RE);
    }
  });
});
