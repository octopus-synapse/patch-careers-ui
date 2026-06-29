/**
 * Shared escape-hatch directive for the style / DS-adoption specs.
 *
 * A legitimate exception (an animation that needs `StyleSheet`, a measured
 * value, a divider that genuinely isn't one) is marked inline with:
 *
 *   // @style-allow <kind>: <reason>
 *
 * placed on the offending line or the line directly above it. The `<reason>`
 * is REQUIRED — a directive with an empty reason does NOT suppress, so the
 * violation resurfaces and the omission is visible. Kinds in use:
 * `stylesheet`, `inline`, `color`, `divider`, `touchable`.
 */

const DIRECTIVE_RX = /\/\/\s*@style-allow\s+([a-z-]+)\s*:\s*(\S.*)$/;

export interface StyleAllowDirective {
  line: number; // 1-based
  kind: string;
  reason: string;
}

/** Parses every well-formed `@style-allow` directive (non-empty reason) in a file. */
export function collectStyleAllow(text: string): StyleAllowDirective[] {
  const out: StyleAllowDirective[] = [];
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = (lines[i] ?? "").match(DIRECTIVE_RX);
    if (m?.[1] && m[2] && m[2].trim().length > 0) {
      out.push({ line: i + 1, kind: m[1], reason: m[2].trim() });
    }
  }
  return out;
}

/** True if a `kind` violation on `line` is covered by a directive on that line or the one above. */
export function isAllowed(directives: StyleAllowDirective[], line: number, kind: string): boolean {
  return directives.some((d) => d.kind === kind && (d.line === line || d.line === line - 1));
}
