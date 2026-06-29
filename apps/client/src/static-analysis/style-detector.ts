/**
 * Tamagui-first styling detector (ADR-0007 / ADR-0008). Product code
 * (`apps/client/src`) styles via Tamagui props + `@patch-careers/tokens`, not
 * raw `StyleSheet`/inline objects/hardcoded colors. The DS (`packages/ui`) is
 * exempt here — it is the layer that builds the styled primitives and may keep
 * `StyleSheet` for animation/measurement (annotated in its own files).
 *
 * Rules (escape any with `// @style-allow <kind>: <reason>`):
 *   `stylesheet` — a `StyleSheet.create(...)` call. Use Tamagui styled props.
 *   `inline`     — a `style={{…}}` whose every value is a STATIC literal. Use
 *                  Tamagui props. (A style object with any dynamic/computed
 *                  value — `insets.top`, an animated value — is allowed.)
 *   `color`      — a hardcoded `#hex` / `rgb()/rgba()` string. Use a token.
 */

import * as path from "node:path";
import * as ts from "typescript";
import { collectStyleAllow, isAllowed } from "./style-directives";
import { readAllSourceFiles } from "./utils";

export const SRC_DIR = path.join(__dirname, "..");

export type StyleRule = "stylesheet" | "inline" | "color";

export interface StyleViolation {
  file: string; // relative to apps/client/src
  line: number;
  rule: StyleRule;
  detail: string;
}

const HEX_RX = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_RX = /^rgba?\(/i;

/** True when a string literal is the value of a `shadowColor:` property. */
function isShadowColorValue(node: ts.Node): boolean {
  const p = node.parent;
  return (
    !!p &&
    ts.isPropertyAssignment(p) &&
    ts.isIdentifier(p.name) &&
    p.name.text === "shadowColor" &&
    p.initializer === node
  );
}

/** A value that is a compile-time-constant literal (no runtime input). */
function isStaticLiteral(node: ts.Expression): boolean {
  if (
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword
  ) {
    return true;
  }
  if (ts.isPrefixUnaryExpression(node)) return isStaticLiteral(node.operand);
  return false;
}

/** True when every property of a `style={{…}}` object is a static literal. */
function isFullyStaticStyleObject(obj: ts.ObjectLiteralExpression): boolean {
  if (obj.properties.length === 0) return false;
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) return false; // spread / shorthand → treat as dynamic
    if (!isStaticLiteral(prop.initializer)) return false;
  }
  return true;
}

export function detectStyleViolations(): StyleViolation[] {
  const violations: StyleViolation[] = [];
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
    const lineOf = (n: ts.Node): number =>
      sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
    const push = (n: ts.Node, rule: StyleRule, detail: string): void => {
      const line = lineOf(n);
      if (!isAllowed(directives, line, rule))
        violations.push({ file: fileRel, line, rule, detail });
    };

    const visit = (node: ts.Node): void => {
      // stylesheet — StyleSheet.create(...)
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) &&
        node.expression.expression.text === "StyleSheet" &&
        node.expression.name.text === "create"
      ) {
        push(node, "stylesheet", "StyleSheet.create — use Tamagui styled props");
      }

      // inline — style={{ …all static… }}
      if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && node.name.text === "style") {
        const init = node.initializer;
        if (init && ts.isJsxExpression(init) && init.expression) {
          if (
            ts.isObjectLiteralExpression(init.expression) &&
            isFullyStaticStyleObject(init.expression)
          ) {
            push(node, "inline", "static inline style — use Tamagui props/tokens");
          }
        }
      }

      // color — hardcoded #hex / rgb() string literal. `shadowColor` is exempt:
      // shadow tint is not a themed surface/text color and tokens don't model it
      // (ADR-0008).
      if (ts.isStringLiteralLike(node) && !isShadowColorValue(node)) {
        const v = node.text.trim();
        if (HEX_RX.test(v) || RGB_RX.test(v)) {
          push(node, "color", `hardcoded color "${v}" — use a @patch-careers/tokens value`);
        }
      }

      ts.forEachChild(node, visit);
    };
    visit(sf);
  }

  violations.sort((a, b) => (a.file === b.file ? a.line - b.line : a.file < b.file ? -1 : 1));
  return violations;
}
