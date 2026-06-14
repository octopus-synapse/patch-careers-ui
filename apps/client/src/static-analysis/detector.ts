/**
 * i18n hardcoded-string detector — ported from tryna-monorepo's i18n
 * suite and adapted to this app's component vocabulary.
 *
 * Walks .tsx/.ts under `apps/client/src` with the TS compiler API and
 * flags string literals in user-facing positions:
 *
 *   R1. JSX text children of UX text components: <Text>literal</Text>
 *       (including literals reachable through ternary/short-circuit)
 *   R2. JSX attributes that take user-facing strings: placeholder=,
 *       title=, accessibilityLabel=, ... including object/array literal
 *       initializers (`options={{ title: 'X' }}`, `items={[{label}]}`)
 *   R3. Call args of user-facing APIs: Alert.alert('x'), toast.show({...})
 *   R4. Standalone object literals carrying UX prop names:
 *       `const STEPS = [{ label: 'X' }]`
 *   R5. Any string literal with accented Latin characters — pt-BR copy
 *       can't hide in helpers/constants this way (patch-careers addition)
 *
 * Value-level allowlist (numbers, urls, slugs, brand names) keeps the
 * detector conservative: when in doubt it stays silent.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as ts from "typescript";
import { readAllSourceFiles } from "./utils";

export type ViolationRule =
  | "jsx-text"
  | "jsx-attr"
  | "call-arg"
  | "object-prop"
  | "accented-literal";

export interface Violation {
  file: string; // relative to apps/client/src
  line: number;
  column: number;
  rule: ViolationRule;
  text: string; // max 60 chars
  context: string; // e.g. "Text", "EmptyState.title", "Alert.alert#0"
}

export const SRC_DIR = path.join(__dirname, "..");

/** Components whose JSX text children are user-visible copy. */
const UX_TEXT_COMPONENTS = new Set([
  "Text",
  "Animated.Text",
  "DisplayHeading",
  "SubtitleLine",
  "IntroBlock",
  "EditorialLabel",
  "Paragraph",
  "SizableText",
]);

/** JSX attributes / object props whose string values users read. */
const UX_ATTR_PROPS = new Set([
  "placeholder",
  "accessibilityLabel",
  "accessibilityHint",
  "label",
  "activeLabel",
  "errorText",
  "title",
  "subtitle",
  "message",
  "description",
  "ctaLabel",
  "closeLabel",
  "confirmLabel",
  "cancelLabel",
  "destructiveLabel",
  "emptyTitle",
  "emptyDescription",
  "hint",
  "headerTitle",
  "tabBarLabel",
  "successTitle",
  "errorFallback",
]);

const SHOW_LIKE_METHODS = new Set([
  "show",
  "confirm",
  "alert",
  "prompt",
  "success",
  "error",
  "info",
  "warn",
  "warning",
]);

/**
 * `.error/.warn/.info` also exist on non-UX receivers (console, logger).
 * These receivers never trigger R3.
 */
const NON_UX_RECEIVERS = new Set(["console", "logger", "log", "Sentry", "process", "posthog"]);

const BRAND_NAMES = new Set([
  "Patch",
  "Patch Careers",
  "LinkedIn",
  "GitHub",
  "Google",
  "Apple",
  "iOS",
  "Android",
  "MEC",
  "ATS",
  "Logo.dev",
]);

const NUMERIC_OR_PUNCT_RX = /^[\d\s\-–—·:./,%+()]+$/;
const SLUG_RX = /^[a-z][a-zA-Z0-9_-]*$/;
const URL_OR_PATH_RX = /^(https?:|mailto:|\/|\.\.?\/|patchcareers:)/;
const LOCALE_RX = /^[a-z]{2}-[A-Z]{2}$/;
const HAS_LETTER_RX = /\p{L}/u;
const ACCENTED_RX = /[À-ÖØ-öø-ÿ]/;

/**
 * Heuristic for literals that are NOT user-facing copy. Conservative:
 * when unsure, the literal passes (and a human reviews the report).
 */
function isAllowlisted(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 2) return true;
  if (!HAS_LETTER_RX.test(trimmed)) return true; // digits/punctuation/emoji only
  if (NUMERIC_OR_PUNCT_RX.test(trimmed)) return true;
  if (URL_OR_PATH_RX.test(trimmed)) return true;
  if (LOCALE_RX.test(trimmed)) return true;
  if (BRAND_NAMES.has(trimmed)) return true;
  if (trimmed.length <= 20 && SLUG_RX.test(trimmed) && !ACCENTED_RX.test(trimmed)) return true;
  return false;
}

function truncate(s: string, max = 60): string {
  const collapsed = s.replace(/\s+/g, " ").trim();
  return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed;
}

function lineColOf(node: ts.Node, sf: ts.SourceFile) {
  const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
  return { line: line + 1, column: character + 1 };
}

function tagNameOf(el: ts.JsxOpeningLikeElement): string {
  const t = el.tagName;
  if (ts.isIdentifier(t)) return t.text;
  return t.getText();
}

function findOwnerTag(attr: ts.JsxAttribute): string {
  const opening = attr.parent.parent;
  return tagNameOf(opening as ts.JsxOpeningLikeElement);
}

function recordViolation(
  out: Violation[],
  sf: ts.SourceFile,
  fileRel: string,
  node: ts.Node,
  rule: ViolationRule,
  rawText: string,
  context: string,
): void {
  const text = truncate(rawText);
  if (!text) return;
  const { line, column } = lineColOf(node, sf);
  out.push({ file: fileRel, line, column, rule, text, context });
}

/**
 * Collects string literals "reachable" from an expression: direct
 * literals, parenthesized, ternary branches and short-circuit operands.
 * No data-flow analysis on purpose.
 */
function collectLiterals(expr: ts.Expression | undefined): ts.StringLiteralLike[] {
  if (!expr) return [];
  if (ts.isStringLiteralLike(expr)) return [expr];
  if (ts.isParenthesizedExpression(expr)) return collectLiterals(expr.expression);
  if (ts.isConditionalExpression(expr)) {
    return [...collectLiterals(expr.whenTrue), ...collectLiterals(expr.whenFalse)];
  }
  if (
    ts.isBinaryExpression(expr) &&
    (expr.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ||
      expr.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
      expr.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)
  ) {
    return [...collectLiterals(expr.left), ...collectLiterals(expr.right)];
  }
  return [];
}

/**
 * Recursive walk over an ObjectLiteralExpression: flags literals on UX
 * prop names, recursing into nested arrays/objects so shapes like
 * `items={[{label:'X'}]}` are covered. `contextPath` accumulates the
 * semantic location (`ConfirmDialog.options[0].label`).
 */
function scanObjectLiteralForUxStrings(
  obj: ts.ObjectLiteralExpression,
  out: Violation[],
  sf: ts.SourceFile,
  fileRel: string,
  contextPath: string,
): void {
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const keyName = ts.isIdentifier(prop.name)
      ? prop.name.text
      : ts.isStringLiteral(prop.name)
        ? prop.name.text
        : null;
    if (!keyName) continue;
    const childPath = `${contextPath}.${keyName}`;

    if (UX_ATTR_PROPS.has(keyName)) {
      for (const lit of collectLiterals(prop.initializer)) {
        if (!isAllowlisted(lit.text)) {
          recordViolation(out, sf, fileRel, lit, "object-prop", lit.text, childPath);
        }
      }
    }

    if (ts.isArrayLiteralExpression(prop.initializer)) {
      prop.initializer.elements.forEach((el, i) => {
        if (ts.isObjectLiteralExpression(el)) {
          scanObjectLiteralForUxStrings(el, out, sf, fileRel, `${childPath}[${i}]`);
        }
      });
    } else if (ts.isObjectLiteralExpression(prop.initializer)) {
      scanObjectLiteralForUxStrings(prop.initializer, out, sf, fileRel, childPath);
    }
  }
}

function visit(node: ts.Node, sf: ts.SourceFile, fileRel: string, out: Violation[]): void {
  // R1: JSX children of UX text components.
  if (ts.isJsxElement(node)) {
    const tag = tagNameOf(node.openingElement);
    if (UX_TEXT_COMPONENTS.has(tag)) {
      for (const child of node.children) {
        if (ts.isJsxText(child)) {
          const raw = child.getText().replace(/\s+/g, " ").trim();
          if (raw && !isAllowlisted(raw)) {
            recordViolation(out, sf, fileRel, child, "jsx-text", raw, tag);
          }
        } else if (ts.isJsxExpression(child)) {
          for (const lit of collectLiterals(child.expression)) {
            if (!isAllowlisted(lit.text)) {
              recordViolation(out, sf, fileRel, lit, "jsx-text", lit.text, tag);
            }
          }
          // Template children: <Text>{`${n} vagas`}</Text>
          if (child.expression && ts.isTemplateExpression(child.expression)) {
            const staticText = [
              child.expression.head.text,
              ...child.expression.templateSpans.map((s) => s.literal.text),
            ].join(" ");
            if (HAS_LETTER_RX.test(staticText) && !isAllowlisted(staticText)) {
              recordViolation(out, sf, fileRel, child.expression, "jsx-text", staticText, tag);
            }
          }
        }
      }
    }
  }

  // R2: user-facing JSX attribute — direct literal, ternary/short-circuit,
  // or object/array literal initializer.
  if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name)) {
    const propName = node.name.text;
    const init = node.initializer;
    if (init) {
      if (UX_ATTR_PROPS.has(propName)) {
        const candidates: ts.StringLiteralLike[] = [];
        if (ts.isStringLiteral(init)) {
          candidates.push(init);
        } else if (ts.isJsxExpression(init)) {
          candidates.push(...collectLiterals(init.expression));
        }
        for (const lit of candidates) {
          if (!isAllowlisted(lit.text)) {
            recordViolation(
              out,
              sf,
              fileRel,
              lit,
              "jsx-attr",
              lit.text,
              `${findOwnerTag(node)}.${propName}`,
            );
          }
        }
      }
      if (ts.isJsxExpression(init) && init.expression) {
        const expr = init.expression;
        const ownerCtx = `${findOwnerTag(node)}.${propName}`;
        if (ts.isObjectLiteralExpression(expr)) {
          scanObjectLiteralForUxStrings(expr, out, sf, fileRel, ownerCtx);
        } else if (ts.isArrayLiteralExpression(expr)) {
          expr.elements.forEach((el, i) => {
            if (ts.isObjectLiteralExpression(el)) {
              scanObjectLiteralForUxStrings(el, out, sf, fileRel, `${ownerCtx}[${i}]`);
            }
          });
        }
      }
    }
  }

  // R3: Alert.alert(...) and toast-like .show/.success/... calls.
  if (ts.isCallExpression(node)) {
    const expr = node.expression;
    if (
      ts.isPropertyAccessExpression(expr) &&
      ts.isIdentifier(expr.expression) &&
      expr.expression.text === "Alert" &&
      ts.isIdentifier(expr.name) &&
      expr.name.text === "alert"
    ) {
      for (let i = 0; i < Math.min(node.arguments.length, 2); i++) {
        for (const lit of collectLiterals(node.arguments[i])) {
          if (!isAllowlisted(lit.text)) {
            recordViolation(out, sf, fileRel, lit, "call-arg", lit.text, `Alert.alert#${i}`);
          }
        }
      }
    } else if (
      ts.isPropertyAccessExpression(expr) &&
      ts.isIdentifier(expr.name) &&
      SHOW_LIKE_METHODS.has(expr.name.text) &&
      !(ts.isIdentifier(expr.expression) && NON_UX_RECEIVERS.has(expr.expression.text))
    ) {
      const arg0 = node.arguments[0];
      const callContext = `${expr.expression.getText()}.${expr.name.text}`;
      if (arg0) {
        for (const lit of collectLiterals(arg0)) {
          if (!isAllowlisted(lit.text)) {
            recordViolation(out, sf, fileRel, lit, "call-arg", lit.text, `${callContext}#0`);
          }
        }
        if (ts.isObjectLiteralExpression(arg0)) {
          scanObjectLiteralForUxStrings(arg0, out, sf, fileRel, callContext);
        }
      }
    }
  }

  // R4: standalone object literals (`const STEPS = [{ label: 'X' }]`).
  if (ts.isObjectLiteralExpression(node) && !hasUpstreamHandledAncestor(node)) {
    scanObjectLiteralForUxStrings(node, out, sf, fileRel, "object");
  }

  // R5: accented pt-BR copy anywhere (helpers, constants, fallbacks).
  if (ts.isStringLiteralLike(node) && ACCENTED_RX.test(node.text) && !isAllowlisted(node.text)) {
    recordViolation(out, sf, fileRel, node, "accented-literal", node.text, "literal");
  }
  if (ts.isTemplateExpression(node)) {
    const staticText = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(" ");
    if (ACCENTED_RX.test(staticText)) {
      recordViolation(out, sf, fileRel, node, "accented-literal", staticText, "template");
    }
  }

  ts.forEachChild(node, (c) => visit(c, sf, fileRel, out));
}

/**
 * `true` when an ancestor is a JsxAttribute (R2 already scanned) or a
 * CallExpression argument (R3 already scanned) — suppresses R4 dupes.
 */
function hasUpstreamHandledAncestor(node: ts.Node): boolean {
  let p: ts.Node | undefined = node.parent;
  while (p) {
    if (ts.isJsxAttribute(p) || ts.isCallExpression(p)) return true;
    if (ts.isArrayLiteralExpression(p)) {
      const gp = p.parent;
      if (gp && (ts.isJsxExpression(gp) || ts.isCallExpression(gp))) return true;
    }
    if (ts.isPropertyAssignment(p)) return true;
    p = p.parent;
  }
  return false;
}

/** Runs detection over apps/client/src; output sorted for stable diffs. */
export function detect(): Violation[] {
  const violations: Violation[] = [];
  for (const file of readAllSourceFiles(SRC_DIR)) {
    const src = fs.readFileSync(file, "utf8");
    const sf = ts.createSourceFile(
      file,
      src,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    const fileRel = path.relative(SRC_DIR, file);
    visit(sf, sf, fileRel, violations);
  }

  // R5 overlaps R1–R4 for accented strings — keep the first hit per node.
  const seen = new Set<string>();
  const deduped = violations.filter((v) => {
    const key = `${v.file}:${v.line}:${v.column}:${v.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduped.sort((a, b) =>
    a.file === b.file ? a.line - b.line || a.column - b.column : a.file < b.file ? -1 : 1,
  );
  return deduped;
}
