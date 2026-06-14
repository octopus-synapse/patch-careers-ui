/**
 * i18n hardcoded-string enforcement (ported from tryna-monorepo).
 *
 * **Zero-tolerance**: fails on ANY violation — every user-facing string
 * must go through `t()` (or `labelFor` for enum labels). Intentional
 * literals (brand names etc.) belong in the allowlist in `detector.ts`,
 * not in a baseline.
 */

import { describe, expect, it } from "vitest";
import { detect, type Violation } from "./detector";

const formatViolation = (v: Violation): string =>
  `  ${v.file}:${v.line}:${v.column} [${v.rule}] ${v.context}: "${v.text}"`;

describe("i18n hardcoded strings", () => {
  it("zero hardcoded user-facing strings allowed", () => {
    const violations = detect();
    if (violations.length > 0) {
      const lines = violations.slice(0, 80).map(formatViolation).join("\n");
      const tail = violations.length > 80 ? `\n  ... +${violations.length - 80} more` : "";
      const byRule: Record<string, number> = {};
      for (const v of violations) byRule[v.rule] = (byRule[v.rule] ?? 0) + 1;
      const summary = Object.entries(byRule)
        .map(([r, n]) => `${r}=${n}`)
        .join(", ");
      throw new Error(
        `\nFound ${violations.length} hardcoded user-facing string(s) [${summary}]:\n${lines}${tail}\n\n` +
          `Wrap each in t('...') backed by @patch-careers/i18n. If a literal is\n` +
          `intentional (brand name, technical token), update the allowlist in detector.ts.\n`,
      );
    }
    expect(violations).toEqual([]);
  });
});
