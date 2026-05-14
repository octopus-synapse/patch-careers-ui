#!/usr/bin/env node

// i18n hardcoded-text-children detector — Svelte AST pass.
//
// Helper invoked by `scripts/check-i18n-hardcoded.ts` from the monorepo
// root. Lives under `apps/web/scripts/` so Node can resolve
// `svelte/compiler` via apps/web's node_modules.
//
// Walks `.svelte` files under apps/web/src + packages/ui/src, parses
// each with svelte/compiler, and reports literal text that lives as a
// **child** of a user-facing element/component — the case the regex
// detector can't cleanly catch.
//
// Two child cases:
//   T1. <Tag>literal text</Tag>     (Text node child)
//   T2. <Tag>{'literal'}</Tag>       (ExpressionTag child whose inner
//                                     expression is a string Literal,
//                                     possibly reached via ternary or
//                                     logical short-circuit)
//
// UX_TEXT_TAGS covers headline / button / link surfaces — anywhere
// where the child text is part of the rendered UI. Wrapping all
// `<span>` / `<div>` / `<p>` would be too noisy (those are layout
// containers more often than direct text holders).
//
// Output: JSON array of violations to stdout. One object per finding:
//   { file, line, col, rule: 'text-child', value, context }
// On parse error: skip the file and log to stderr (don't fail the run).

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseSvelte } from 'svelte/compiler';

const ROOT = process.cwd();
const SCAN_ROOTS = ['apps/web/src', 'packages/ui/src'];

const UX_TEXT_TAGS = new Set([
  // Svelte components from packages/ui — anything textual.
  'Button',
  'Label',
  'Heading',
  'Toast',
  'ToastTitle',
  'ToastDescription',
  'Alert',
  'AlertTitle',
  'AlertDescription',
  'Badge',
  'Chip',
  'EmptyState',
  'Tooltip',
  'TooltipContent',
  'Card',
  'CardTitle',
  'CardDescription',
  'Modal',
  'ModalTitle',
  'ModalDescription',
  'Dialog',
  'DialogTitle',
  'DialogDescription',
  'MenuItem',
  'DropdownItem',
  'NavLink',
  'TabTrigger',
  'AccordionTrigger',
  'AccordionContent',
  // HTML elements that almost always hold user-facing text directly.
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'button',
  'a',
  'label',
  'title',
  'caption',
  'figcaption',
  'summary',
  'option',
  'legend',
]);

const EXEMPT_FILE_PATTERNS = [
  /\/\.svelte-kit\//,
  /\/node_modules\//,
  /\/build\//,
  /\/dist\//,
  /\/generated\//,
  /\/test\//,
  /\/__tests__\//,
  /\.spec\./,
  /\.test\./,
  /\.stories\./,
  /lib\/locale\.svelte\.ts$/,
  /packages\/i18n\//,
];

// Same allowlist heuristic as the regex detector — keep them in sync.
const NUMERIC_OR_PUNCT_RX = /^[\d\s\-:./,()%+_$#@*=<>!?'"]+$/;
const SLUG_RX = /^[a-z][a-zA-Z0-9_-]*$/;
const KEBAB_RX = /^[a-z]+(?:-[a-z]+)+$/;
const SCREAMING_SNAKE_RX = /^[A-Z][A-Z0-9_]+$/;
const URL_OR_PATH_RX = /^(https?:|\/|\.\.?\/|mailto:|tel:|#)/;
const LOCALE_RX = /^[a-z]{2}(-[A-Z]{2})?$/;
const HAS_LETTER_RX = /\p{L}/u;
const I18N_KEY_RX = /^[a-zA-Z][\w-]*(?:\.[a-zA-Z][\w-]*)+$/;
const SIZE_TOKEN_RX = /^(xs|sm|md|lg|xl|2xl|3xl|4xl)$/;
const COLOR_TOKEN_RX =
  /^(neutral|primary|secondary|success|warning|danger|info|muted|accent|ghost|outline|solid|glossy|menu|icon|link|destructive|positive|negative)$/;
const ICON_NAME_RX = /^[A-Z][a-z]+(?:[A-Z][a-z]*)*$/;
const EMOJI_OR_SYMBOL_RX = /^[\p{Emoji}\p{S}\p{P}\s]+$/u;
const HEX_COLOR_RX = /^#[0-9a-fA-F]{3,8}$/;
const CSS_UNIT_RX = /^[-\d.]+(px|em|rem|%|vh|vw|fr)$/;

const BRAND_NAMES = new Set([
  'Patch Careers',
  'Patch',
  'GitHub',
  'LinkedIn',
  'Google',
  'Apple',
  'Microsoft',
  'iOS',
  'Android',
  'Slack',
  'Discord',
  'Twitter',
  'X',
  'Facebook',
  'Instagram',
  'YouTube',
  'Vercel',
  'Netlify',
  'Bun',
  'Node.js',
  'TypeScript',
  'JavaScript',
  'Svelte',
  'SvelteKit',
  'React',
  'PostgreSQL',
  'Redis',
  'Docker',
  'Cloudinary',
  'AWS',
  'S3',
  'JWT',
  'OAuth',
  'HTTP',
  'HTTPS',
  'URL',
  'UUID',
  'CSV',
  'PDF',
  'JSON',
  'YAML',
  'API',
  'SDK',
  'UI',
  'UX',
  'PR',
  'CI',
  'CD',
  'OK',
  'STAFF',
  'ADMIN',
  'USER',
  'MEMBER',
  'RECRUITER',
]);

function isAllowlisted(value) {
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length === 1) return true;
  if (!HAS_LETTER_RX.test(trimmed)) return true;
  if (NUMERIC_OR_PUNCT_RX.test(trimmed)) return true;
  if (URL_OR_PATH_RX.test(trimmed)) return true;
  if (LOCALE_RX.test(trimmed)) return true;
  if (HEX_COLOR_RX.test(trimmed)) return true;
  if (CSS_UNIT_RX.test(trimmed)) return true;
  if (EMOJI_OR_SYMBOL_RX.test(trimmed)) return true;
  if (BRAND_NAMES.has(trimmed)) return true;
  if (I18N_KEY_RX.test(trimmed)) return true;
  if (SIZE_TOKEN_RX.test(trimmed)) return true;
  if (COLOR_TOKEN_RX.test(trimmed)) return true;
  if (SCREAMING_SNAKE_RX.test(trimmed) && trimmed.length <= 24) return true;
  if (trimmed.length <= 16 && (SLUG_RX.test(trimmed) || KEBAB_RX.test(trimmed))) return true;
  if (trimmed.length <= 30 && ICON_NAME_RX.test(trimmed)) return true;
  if (trimmed.length <= 3) return true;
  return false;
}

function isExemptFile(rel) {
  return EXEMPT_FILE_PATTERNS.some((re) => re.test(rel));
}

// Resolve a (line, col) — 1-based — from an absolute character offset.
function lineColFromOffset(source, offset) {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source[i] === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
  }
  return { line, col };
}

// Collect literal `value`s reachable from an expression node — direct
// Literal, ternary branches, logical short-circuit. Anything else
// (identifiers, calls) is treated as dynamic and skipped.
function collectLiterals(expr) {
  if (!expr || typeof expr !== 'object') return [];
  switch (expr.type) {
    case 'Literal':
      return typeof expr.value === 'string' ? [expr] : [];
    case 'TemplateLiteral':
      // Only flag tagless template strings with NO expressions — those
      // are equivalent to a string literal.
      if (Array.isArray(expr.expressions) && expr.expressions.length === 0) {
        const cooked = expr.quasis?.map((q) => q.value?.cooked ?? '').join('') ?? '';
        return [{ ...expr, value: cooked }];
      }
      return [];
    case 'ConditionalExpression':
      return [...collectLiterals(expr.consequent), ...collectLiterals(expr.alternate)];
    case 'LogicalExpression':
      return [...collectLiterals(expr.left), ...collectLiterals(expr.right)];
    case 'BinaryExpression':
      // `'foo' + ' ' + 'bar'` — flag every literal piece individually.
      if (expr.operator === '+') {
        return [...collectLiterals(expr.left), ...collectLiterals(expr.right)];
      }
      return [];
    default:
      return [];
  }
}

function isUxTag(node) {
  return (
    (node.type === 'RegularElement' || node.type === 'Component' || node.type === 'SvelteElement') &&
    typeof node.name === 'string' &&
    UX_TEXT_TAGS.has(node.name)
  );
}

function scanFile(file, source, out) {
  let ast;
  try {
    ast = parseSvelte(source, { modern: true });
  } catch (err) {
    process.stderr.write(`[i18n-text-children] parse skip: ${file}: ${err?.message ?? err}\n`);
    return;
  }

  const visit = (node) => {
    if (!node || typeof node !== 'object') return;

    if (isUxTag(node) && node.fragment && Array.isArray(node.fragment.nodes)) {
      for (const child of node.fragment.nodes) {
        if (!child || typeof child !== 'object') continue;

        if (child.type === 'Text') {
          const raw = String(child.data ?? '');
          const trimmed = raw.trim();
          if (!trimmed || isAllowlisted(trimmed)) continue;
          const offset = typeof child.start === 'number' ? child.start : 0;
          // start points at the beginning of the original whitespace —
          // bump past the leading whitespace to land on the first
          // letter of the actual visible text.
          const wsLen = raw.length - raw.trimStart().length;
          const { line, col } = lineColFromOffset(source, offset + wsLen);
          out.push({
            file,
            line,
            col,
            rule: 'text-child',
            value: trimmed,
            context: `${node.name}<text>`,
          });
        } else if (child.type === 'ExpressionTag') {
          for (const lit of collectLiterals(child.expression)) {
            const val = String(lit.value ?? '');
            if (!val.trim() || isAllowlisted(val)) continue;
            const offset = typeof lit.start === 'number' ? lit.start : child.start ?? 0;
            const { line, col } = lineColFromOffset(source, offset);
            out.push({
              file,
              line,
              col,
              rule: 'text-child',
              value: val,
              context: `${node.name}<{expr}>`,
            });
          }
        }
      }
    }

    // Recurse into anything that could carry more elements.
    for (const key of Object.keys(node)) {
      if (key === 'parent' || key === 'start' || key === 'end' || key === 'metadata') continue;
      const value = node[key];
      if (Array.isArray(value)) {
        for (const child of value) visit(child);
      } else if (value && typeof value === 'object' && value.type) {
        visit(value);
      }
    }
  };

  visit(ast);
}

const SKIP_DIRS = new Set(['node_modules', '.svelte-kit', 'build', 'dist', 'generated']);

function* walk(dir, rootPrefix) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full, rootPrefix);
    } else if (entry.isFile() && entry.name.endsWith('.svelte')) {
      yield full;
    }
  }
}

function* listSvelteFiles() {
  for (const root of SCAN_ROOTS) {
    const abs = join(ROOT, root);
    if (!existsSync(abs)) continue;
    try {
      const stat = statSync(abs);
      if (!stat.isDirectory()) continue;
    } catch {
      continue;
    }
    for (const full of walk(abs, abs)) {
      yield full.slice(ROOT.length + 1);
    }
  }
}

function main() {
  const violations = [];
  for (const rel of listSvelteFiles()) {
    if (isExemptFile(rel)) continue;
    const abs = join(ROOT, rel);
    let src;
    try {
      src = readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    scanFile(rel, src, violations);
  }
  process.stdout.write(`${JSON.stringify(violations)}\n`);
}

try {
  main();
} catch (err) {
  process.stderr.write(`[i18n-text-children] fatal: ${err?.stack ?? err}\n`);
  process.exit(2);
}
