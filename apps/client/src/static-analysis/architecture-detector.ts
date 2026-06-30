/**
 * Architecture boundary detector — enforces the feature-graph rules from
 * ARCHITECTURE.md §2/§6 and ADR-0002/ADR-0010 that Biome `noRestrictedImports`
 * cannot express (it matches package names, not the feature graph).
 *
 * Walks .ts/.tsx under `apps/client/src` with the TS compiler API and inspects
 * every `import`/`export … from "@/features/<G>…"` specifier:
 *
 *   CROSS-FEATURE — a file inside `features/<F>/` importing `@/features/<G>`
 *     with `G !== F` and `G` not a FOUNDATION feature. Shared presentation must
 *     be promoted to `@patch-careers/ui`; shared domain lives in a foundation
 *     feature (ADR-0010). Horizontal feature→feature coupling is otherwise banned.
 *
 *   DEEP-IMPORT — any importer (feature, route or app component) reaching past a
 *     feature barrel (`@/features/<G>/lib|hooks|components|model|types…`) from
 *     OUTSIDE feature `G`. Cross-feature/external imports go through `index.ts`
 *     only (ARCHITECTURE.md §6).
 *
 * The app→feature edge (a route/component importing a feature barrel) is allowed
 * and not reported.
 */

import * as path from "node:path";
import * as ts from "typescript";
import { readAllSourceFiles } from "./utils";

export const SRC_DIR = path.join(__dirname, "..");

/**
 * Features that MAY be imported by other features (shared domain). ADR-0010.
 * `fit` + `match` are the scoring foundation: `match` consumes `fit`'s profile
 * status (gating) and `resumes`; the Jobs tab consumes `match`'s Recomendadas
 * section + breakdown. Both are cross-cutting score primitives, not leaf UI.
 */
export const FOUNDATION_FEATURES = new Set(["sections", "resumes", "fit", "match"]);

export type ImportRule = "cross-feature" | "deep-import";

export interface ImportViolation {
  file: string; // relative to apps/client/src
  line: number;
  rule: ImportRule;
  specifier: string;
  detail: string;
}

/** `@/features/<feature>` optionally followed by a deep `/sub/path`. */
const FEATURE_SPECIFIER_RX = /^@\/features\/([a-z0-9-]+)(\/.*)?$/;

/** Feature owning a source file, derived from `features/<F>/…`; null otherwise. */
function owningFeature(fileRel: string): string | null {
  const m = fileRel.match(/^features[/\\]([a-z0-9-]+)[/\\]/);
  return m?.[1] ?? null;
}

/** Module specifiers of every static `import`/`export … from "…"` + line. */
function moduleSpecifiers(sf: ts.SourceFile): Array<{ value: string; line: number }> {
  const out: Array<{ value: string; line: number }> = [];
  for (const stmt of sf.statements) {
    const spec =
      (ts.isImportDeclaration(stmt) || ts.isExportDeclaration(stmt)) && stmt.moduleSpecifier;
    if (spec && ts.isStringLiteral(spec)) {
      const { line } = sf.getLineAndCharacterOfPosition(spec.getStart(sf));
      out.push({ value: spec.text, line: line + 1 });
    }
  }
  return out;
}

export function detectImportViolations(): ImportViolation[] {
  const violations: ImportViolation[] = [];
  for (const file of readAllSourceFiles(SRC_DIR)) {
    const fileRel = path.relative(SRC_DIR, file);
    const sf = ts.createSourceFile(
      file,
      ts.sys.readFile(file) ?? "",
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const fromFeature = owningFeature(fileRel);

    for (const { value, line } of moduleSpecifiers(sf)) {
      const m = value.match(FEATURE_SPECIFIER_RX);
      if (!m) continue;
      const target = m[1] as string;
      const deep = m[2]; // "/lib/x" etc., or undefined for the bare barrel

      // Importing a sibling feature's internals from anywhere outside that feature.
      if (deep && fromFeature !== target) {
        violations.push({
          file: fileRel,
          line,
          rule: "deep-import",
          specifier: value,
          detail: `import "@/features/${target}" via its barrel, not "${value}"`,
        });
        continue;
      }

      // Horizontal feature→feature coupling (only foundation features are shareable).
      if (fromFeature && fromFeature !== target && !FOUNDATION_FEATURES.has(target)) {
        violations.push({
          file: fileRel,
          line,
          rule: "cross-feature",
          specifier: value,
          detail: `feature "${fromFeature}" imports feature "${target}" — promote shared presentation to @patch-careers/ui (foundation = ${[...FOUNDATION_FEATURES].join(", ")})`,
        });
      }
    }
  }

  violations.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1));
  return violations;
}
