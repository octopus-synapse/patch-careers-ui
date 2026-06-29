/**
 * `@patch-careers/ui` adoption enforcement (ARCHITECTURE.md §3.1, ADR-0009).
 *
 * **Zero-tolerance**: product code MUST use the design system rather than
 * re-implement it. Mark a genuine exception with `// @style-allow <kind>: <reason>`.
 */

import { describe, expect, it } from "vitest";
import { type AdoptionViolation, detectAdoptionViolations } from "./ui-adoption-detector";

const format = (v: AdoptionViolation): string => `  ${v.file}:${v.line} [${v.rule}] ${v.detail}`;

describe("design-system adoption", () => {
  it("product code does not re-implement DS primitives", () => {
    const violations = detectAdoptionViolations();
    if (violations.length > 0) {
      const byRule: Record<string, number> = {};
      for (const v of violations) byRule[v.rule] = (byRule[v.rule] ?? 0) + 1;
      const summary = Object.entries(byRule)
        .map(([r, n]) => `${r}=${n}`)
        .join(", ");
      throw new Error(
        `\nFound ${violations.length} DS-adoption violation(s) [${summary}]:\n${violations
          .map(format)
          .join("\n")}\n\n` +
          `Use the @patch-careers/ui export instead of re-implementing it. A genuine\n` +
          `exception is marked inline with "// @style-allow <kind>: <reason>".\n`,
      );
    }
    expect(violations).toEqual([]);
  });
});
