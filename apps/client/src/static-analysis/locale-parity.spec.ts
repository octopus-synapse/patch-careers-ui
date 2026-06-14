/**
 * i18n locale parity (ported from tryna-monorepo).
 *
 * Guarantees pt-BR and en expose exactly the same key set and the same
 * `{name}` interpolation tokens per key, with no one-sided empty values.
 * Adding/removing a key in only one dictionary fails here.
 */

import { en, ptBR } from "@patch-careers/i18n";
import { describe, expect, it } from "vitest";
import { extractTokens, flattenKeys, missingKeys } from "./utils";

const locales = {
  "pt-BR": flattenKeys(ptBR as Record<string, unknown>),
  en: flattenKeys(en as Record<string, unknown>),
} as const;

const LOCALE_NAMES = Object.keys(locales) as ReadonlyArray<keyof typeof locales>;

const formatMissing = (missing: string[]): string => {
  if (missing.length === 0) return "";
  const head = missing.slice(0, 20).join("\n  - ");
  const tail = missing.length > 20 ? `\n  ... +${missing.length - 20} more` : "";
  return `\n  - ${head}${tail}`;
};

describe("i18n locale parity", () => {
  it("all locales have the same set of keys", () => {
    for (const a of LOCALE_NAMES) {
      for (const b of LOCALE_NAMES) {
        if (a === b) continue;
        const missing = missingKeys(locales[a], locales[b]);
        expect(
          missing,
          `keys present in ${a} but missing in ${b}:${formatMissing(missing)}`,
        ).toEqual([]);
      }
    }
  });

  it("interpolation tokens match across locales", () => {
    const mismatches: string[] = [];
    for (const [key, ptValue] of Object.entries(locales["pt-BR"])) {
      const enValue = locales.en[key];
      if (enValue === undefined) continue; // covered by the parity test
      const ptTokens = extractTokens(ptValue);
      const enTokens = extractTokens(enValue);
      if (ptTokens.length !== enTokens.length || ptTokens.some((t, i) => t !== enTokens[i])) {
        mismatches.push(`${key}: pt-BR=[${ptTokens.join(",")}] vs en=[${enTokens.join(",")}]`);
      }
    }
    expect(
      mismatches,
      `interpolation tokens mismatch:\n  - ${mismatches.slice(0, 20).join("\n  - ")}`,
    ).toEqual([]);
  });

  it("no one-sided empty translation values", () => {
    // Empty in BOTH locales is an intentional blank (e.g. a subtitle a
    // flow renders conditionally); empty in only one is a missing
    // translation.
    const oneSided: string[] = [];
    for (const [key, ptValue] of Object.entries(locales["pt-BR"])) {
      const enValue = locales.en[key];
      if (enValue === undefined) continue;
      if ((ptValue.trim() === "") !== (enValue.trim() === "")) {
        oneSided.push(key);
      }
    }
    expect(oneSided, `one-sided empty values:\n  - ${oneSided.join("\n  - ")}`).toEqual([]);
  });
});
