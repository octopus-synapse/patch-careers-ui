/**
 * `@patch-careers/ui` adoption detector — product code (features / components /
 * routes) MUST build on the design system, not re-implement what it exports
 * (ARCHITECTURE.md §3.1, ADR-0009). The DS itself (`packages/ui`) is exempt: it
 * is where these primitives are built.
 *
 * Rules (low false-positive on purpose):
 *   R1 `touchable` — importing the `Touchable*` family from "react-native".
 *      Use the `Pressable` RN primitive or the DS `Button`.
 *   R2 `divider`   — an inline hairline `<View style={{ height|width: 1,
 *      backgroundColor: … }} />`. Use the DS `Divider` (it takes `color` +
 *      `marginLeft`/`marginRight`).
 *
 * Escape a deliberate exception with `// @style-allow <kind>: <reason>`.
 */

import * as path from "node:path";
import * as ts from "typescript";
import { collectStyleAllow, isAllowed } from "./style-directives";
import { readAllSourceFiles } from "./utils";

export const SRC_DIR = path.join(__dirname, "..");

export type AdoptionRule = "touchable" | "divider";

export interface AdoptionViolation {
  file: string; // relative to apps/client/src
  line: number;
  rule: AdoptionRule;
  detail: string;
}

const TOUCHABLES = new Set([
  "TouchableOpacity",
  "TouchableHighlight",
  "TouchableWithoutFeedback",
  "TouchableNativeFeedback",
]);

/** A `height`/`width` value of exactly 1px or `StyleSheet.hairlineWidth`. */
function isHairlineThickness(init: ts.Expression): boolean {
  if (ts.isNumericLiteral(init)) return init.text === "1";
  return (
    ts.isPropertyAccessExpression(init) &&
    ts.isIdentifier(init.expression) &&
    init.expression.text === "StyleSheet" &&
    init.name.text === "hairlineWidth"
  );
}

/** An inline `style={{…}}` object that paints a hairline line (thickness + fill). */
function isHairlineLineStyle(obj: ts.ObjectLiteralExpression): boolean {
  let hasThinAxis = false;
  let hasFill = false;
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
    const key = prop.name.text;
    if ((key === "height" || key === "width") && isHairlineThickness(prop.initializer)) {
      hasThinAxis = true;
    }
    if (key === "backgroundColor") hasFill = true;
  }
  return hasThinAxis && hasFill;
}

function styleObjectOf(attr: ts.JsxAttribute): ts.ObjectLiteralExpression | null {
  const init = attr.initializer;
  if (init && ts.isJsxExpression(init) && init.expression) {
    if (ts.isObjectLiteralExpression(init.expression)) return init.expression;
  }
  return null;
}

export function detectAdoptionViolations(): AdoptionViolation[] {
  const violations: AdoptionViolation[] = [];
  for (const file of readAllSourceFiles(SRC_DIR)) {
    const text = ts.sys.readFile(file) ?? "";
    const fileRel = path.relative(SRC_DIR, file);
    const directives = collectStyleAllow(text);
    const sf = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const lineOf = (node: ts.Node): number =>
      sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;

    const visit = (node: ts.Node): void => {
      // R1 — Touchable* imported from react-native.
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier) &&
        node.moduleSpecifier.text === "react-native"
      ) {
        const bindings = node.importClause?.namedBindings;
        if (bindings && ts.isNamedImports(bindings)) {
          for (const el of bindings.elements) {
            const name = (el.propertyName ?? el.name).text;
            if (TOUCHABLES.has(name)) {
              const line = lineOf(el);
              if (!isAllowed(directives, line, "touchable")) {
                violations.push({
                  file: fileRel,
                  line,
                  rule: "touchable",
                  detail: `${name} — use the RN Pressable or the DS Button`,
                });
              }
            }
          }
        }
      }

      // R2 — inline hairline divider.
      if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && node.name.text === "style") {
        const obj = styleObjectOf(node);
        if (obj && isHairlineLineStyle(obj)) {
          const line = lineOf(node.parent);
          if (!isAllowed(directives, line, "divider")) {
            violations.push({
              file: fileRel,
              line,
              rule: "divider",
              detail: "inline hairline line — use the DS <Divider color=… marginLeft=… />",
            });
          }
        }
      }

      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  violations.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1));
  return violations;
}
