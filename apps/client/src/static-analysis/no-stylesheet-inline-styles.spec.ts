/**
 * Tamagui-first styling enforcement (ADR-0007 / ADR-0008).
 *
 * **Zero-tolerance**: product code styles via Tamagui props + tokens, not raw
 * `StyleSheet`, all-static inline objects, or hardcoded colors. Mark a genuine
 * exception (an animation/measurement that needs the RN style escape) with
 * `// @style-allow <kind>: <reason>`.
 */

import { describe, expect, it } from "vitest";
import { detectStyleViolations, type StyleViolation } from "./style-detector";

const format = (v: StyleViolation): string => `  ${v.file}:${v.line} [${v.rule}] ${v.detail}`;

describe("tamagui-first styling", () => {
  it("no raw StyleSheet / static inline / hardcoded color in product code", () => {
    const violations = detectStyleViolations();
    if (violations.length > 0) {
      const byRule: Record<string, number> = {};
      for (const v of violations) byRule[v.rule] = (byRule[v.rule] ?? 0) + 1;
      const summary = Object.entries(byRule)
        .map(([r, n]) => `${r}=${n}`)
        .join(", ");
      throw new Error(
        `\nFound ${violations.length} styling violation(s) [${summary}]:\n${violations
          .slice(0, 120)
          .map(format)
          .join(
            "\n",
          )}${violations.length > 120 ? `\n  … +${violations.length - 120} more` : ""}\n\n` +
          `Use Tamagui props + @patch-careers/tokens. A genuine exception is marked\n` +
          `inline with "// @style-allow <kind>: <reason>".\n`,
      );
    }
    expect(violations).toEqual([]);
  });
});
