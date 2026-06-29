/**
 * Feature-boundary enforcement (ARCHITECTURE.md §2/§6, ADR-0002/ADR-0010).
 *
 * **Zero-tolerance**: a feature MUST NOT import another feature unless the
 * target is a FOUNDATION feature, and every external import of a feature MUST
 * go through its barrel (no deep imports). Shared presentation belongs in
 * `@patch-careers/ui`; shared domain in a foundation feature. To intentionally
 * widen the allowance, change `FOUNDATION_FEATURES` in `architecture-detector.ts`.
 */

import { describe, expect, it } from "vitest";
import { detectImportViolations, type ImportViolation } from "./architecture-detector";

const format = (v: ImportViolation): string =>
  `  ${v.file}:${v.line} [${v.rule}] ${v.specifier} — ${v.detail}`;

describe("feature boundaries", () => {
  it("no cross-feature or deep-import violations", () => {
    const violations = detectImportViolations();
    if (violations.length > 0) {
      const byRule: Record<string, number> = {};
      for (const v of violations) byRule[v.rule] = (byRule[v.rule] ?? 0) + 1;
      const summary = Object.entries(byRule)
        .map(([r, n]) => `${r}=${n}`)
        .join(", ");
      throw new Error(
        `\nFound ${violations.length} feature-boundary violation(s) [${summary}]:\n${violations
          .map(format)
          .join("\n")}\n\n` +
          `Promote shared presentation to @patch-careers/ui, or import the\n` +
          `feature through its barrel. Foundation features live in\n` +
          `FOUNDATION_FEATURES (architecture-detector.ts).\n`,
      );
    }
    expect(violations).toEqual([]);
  });
});
