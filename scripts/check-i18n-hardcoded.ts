#!/usr/bin/env bun

// i18n Hardcoded String Detector — Svelte + TS aware.
//
// Adapts tryna-monorepo's `detector.ts` to Svelte. Walks `.svelte` and
// `.svelte.ts` / `.ts` under `apps/web/src` and reports user-facing
// string literals that aren't wrapped in `t('...')`.
//
// Four rules:
//   R1 — Svelte attribute literal in a UX prop:
//          <Input placeholder="Buscar..." />
//          <Tooltip text="Salvar" />
//   R2 — Svelte attribute expression literal in a UX prop:
//          <Button title={'Salvar'}>
//   R3 — Call arg literal in a UX call (toast.show/confirm/alert/...):
//          toastState.show('Conta criada', 'success')
//          alert('Erro')
//   R4 — Object literal `label`/`title`/`description` in `items=[{...}]`
//        or in a Toast/Confirm payload:
//          <Sidebar items={[{label: 'Início'}]} />
//          toast.show({title: 'Salvo'})
//
// Allowlist (per literal value): URLs, slugs, brand names, locale codes,
// numeric-only / punctuation-only, single chars, common UI shorthand.
// Allowlist (per file): non-app paths (test/, generated/, .svelte-kit/),
// the locale-label module, codegen output.
//
// Baseline: pre-existing violations live in
// `scripts/check-i18n-hardcoded.baseline.json` keyed by `file:line:col`.
// New entries are NOT allowed — the gate fails if the live scan reports
// any (file:line:col, value) that's not in the baseline. Run with
// `--update-baseline` to rewrite the baseline after an intentional sweep.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Glob } from 'bun';

const ROOT = process.cwd();
const SCAN_ROOTS = ['apps/web/src', 'packages/ui/src'];
const BASELINE_PATH = join(ROOT, 'scripts/check-i18n-hardcoded.baseline.json');

const UPDATE = process.argv.includes('--update-baseline');

// ---------------------------------------------------------------------------
// Allowlists
// ---------------------------------------------------------------------------

const EXEMPT_FILE_PATTERNS: RegExp[] = [
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
  /\.d\.ts$/,
  // Locale module owns native language labels by definition.
  /lib\/locale\.svelte\.ts$/,
  // Static dictionaries: source of truth, not consumer.
  /packages\/i18n\//,
];

const UX_ATTRS = new Set([
  'placeholder',
  'title',
  'label',
  'aria-label',
  'ariaLabel',
  'description',
  'message',
  'subtitle',
  'caption',
  'text',
  'errorText',
  'helperText',
  'tooltip',
  'alt',
  'closeLabel',
  'submitLabel',
  'cancelLabel',
  'emptyMessage',
  'noResultsText',
  'loadingText',
]);

const SHOW_LIKE_METHODS = new Set([
  'show',
  'confirm',
  'alert',
  'prompt',
  'success',
  'error',
  'info',
  'warn',
  'warning',
  'danger',
  'notify',
]);

// Receivers that look like UX methods but aren't.
const NON_UX_RECEIVERS = new Set([
  'console',
  'logger',
  'log',
  'Sentry',
  'process',
  'window',
  'globalThis',
]);

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

const NUMERIC_OR_PUNCT_RX = /^[\d\s\-:./,()%+_$#@*=<>!?'"]+$/;
const SLUG_RX = /^[a-z][a-zA-Z0-9_-]*$/;
const KEBAB_RX = /^[a-z]+(?:-[a-z]+)+$/;
const SCREAMING_SNAKE_RX = /^[A-Z][A-Z0-9_]+$/;
const URL_OR_PATH_RX = /^(https?:|\/|\.\.?\/|mailto:|tel:|#)/;
const LOCALE_RX = /^[a-z]{2}(-[A-Z]{2})?$/;
const HAS_LETTER_RX = /\p{L}/u;
const I18N_KEY_RX = /^[a-zA-Z][\w-]*(?:\.[a-zA-Z][\w-]*)+$/; // looks like an i18n key path
const SIZE_TOKEN_RX = /^(xs|sm|md|lg|xl|2xl|3xl|4xl)$/;
const COLOR_TOKEN_RX =
  /^(neutral|primary|secondary|success|warning|danger|info|muted|accent|ghost|outline|solid|glossy|menu|icon|link|destructive|positive|negative)$/;
const ICON_NAME_RX = /^[A-Z][a-z]+(?:[A-Z][a-z]*)*$/; // e.g. ChevronDown, also Svelte component identifier
const EMOJI_OR_SYMBOL_RX = /^[\p{Emoji}\p{S}\p{P}\s]+$/u;
const HEX_COLOR_RX = /^#[0-9a-fA-F]{3,8}$/;
const CSS_UNIT_RX = /^[-\d.]+(px|em|rem|%|vh|vw|fr)$/;
const _VARIANT_RX = /^[a-z][a-z0-9-]*$/i;

function isAllowlistedLiteral(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  if (trimmed.length === 1) return true;
  if (!HAS_LETTER_RX.test(trimmed)) return true; // pure numbers / punctuation / emoji
  if (NUMERIC_OR_PUNCT_RX.test(trimmed)) return true;
  if (URL_OR_PATH_RX.test(trimmed)) return true;
  if (LOCALE_RX.test(trimmed)) return true;
  if (HEX_COLOR_RX.test(trimmed)) return true;
  if (CSS_UNIT_RX.test(trimmed)) return true;
  if (EMOJI_OR_SYMBOL_RX.test(trimmed)) return true;
  if (BRAND_NAMES.has(trimmed)) return true;
  if (I18N_KEY_RX.test(trimmed)) return true; // looks like an i18n key
  if (SIZE_TOKEN_RX.test(trimmed)) return true;
  if (COLOR_TOKEN_RX.test(trimmed)) return true;
  if (SCREAMING_SNAKE_RX.test(trimmed) && trimmed.length <= 24) return true;
  if (trimmed.length <= 16 && (SLUG_RX.test(trimmed) || KEBAB_RX.test(trimmed))) return true;
  if (trimmed.length <= 30 && ICON_NAME_RX.test(trimmed)) return true;
  // Very short labels that are almost always non-translated (column codes, etc.).
  if (trimmed.length <= 3) return true;
  return false;
}

function isExemptFile(rel: string): boolean {
  return EXEMPT_FILE_PATTERNS.some((re) => re.test(rel));
}

// ---------------------------------------------------------------------------
// Violation type
// ---------------------------------------------------------------------------

type ViolationRule = 'attr' | 'attr-expr' | 'call-arg' | 'object-prop' | 'text-child';

interface Violation {
  file: string;
  line: number;
  col: number;
  rule: ViolationRule;
  value: string;
  context: string; // e.g. `Input.placeholder` or `toast.show#0`
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

// Strip the contents of `<script>...</script>` blocks but PRESERVE line
// numbers (replace with whitespace). Used so template-regex passes don't
// pick up script-block code.
function maskScripts(source: string): string {
  return source.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/g, (full, body) => {
    const open = full.indexOf(body);
    return full.slice(0, open) + body.replace(/[^\n]/g, ' ') + full.slice(open + body.length);
  });
}

// Extract just the <script>...</script> body (with leading whitespace
// padding so line numbers stay aligned).
function extractScriptBody(source: string): string {
  const out = source.split('\n').map(() => '');
  const re = /<script\b[^>]*>([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while (true) {
    m = re.exec(source);
    if (!m) break;
    const before = source.slice(0, m.index);
    const startLine = before.match(/\n/g)?.length ?? 0;
    const innerLines = m[1].split('\n');
    for (let i = 0; i < innerLines.length; i++) {
      out[startLine + i] = innerLines[i];
    }
  }
  return out.join('\n');
}

function lineColFromOffset(source: string, offset: number): { line: number; col: number } {
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

// Regex over Svelte/HTML template attributes. Captures `<Tag prop="literal">`
// and `<Tag prop={'literal'}>` (single literal inside braces).
//
// Matches both component (`[A-Z]`) and lowercase tag names (`<button>`,
// `<input>`, etc.) so plain HTML in routes is still checked.
const TAG_ATTR_RX = /<([A-Za-z][\w.-]*)\b([^>]*?)>/gs;

function scanTemplateAttrs(file: string, source: string, out: Violation[]): void {
  const masked = maskScripts(source);
  TAG_ATTR_RX.lastIndex = 0;
  let tagMatch: RegExpExecArray | null;
  while (true) {
    tagMatch = TAG_ATTR_RX.exec(masked);
    if (!tagMatch) break;
    const tagName = tagMatch[1];
    const attrsBlob = tagMatch[2];
    const tagOffset = tagMatch.index;
    const attrsOffsetInTag = tagMatch[0].indexOf(attrsBlob);

    // For each attribute in this tag.
    const attrRe =
      /\b([a-zA-Z_:][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*(['"`])([^'"`]*?)\4\s*\})/g;
    let am: RegExpExecArray | null;
    while (true) {
      am = attrRe.exec(attrsBlob);
      if (!am) break;
      const attrName = am[1];
      if (!UX_ATTRS.has(attrName)) continue;
      const value = am[2] ?? am[3] ?? am[5] ?? '';
      const fromExpr = Boolean(am[4]);
      // Svelte mustache + JS template-literal interpolation isn't a
      // hardcoded literal. Strip every `{...}` (Svelte) and `${...}`
      // (JS template) substring; if what's left is pure whitespace
      // or a tiny punctuation residue (separators like `%`, `/`, `-`),
      // skip — the value is entirely dynamic content with decorative
      // glyphs around it.
      const stripped = value
        .replace(/\$\{[^}]*\}/g, '')
        .replace(/\{[^}]*\}/g, '')
        .trim();
      const hadInterpolation = stripped.length !== value.trim().length;
      if (hadInterpolation && /^[\s%/\-:,;_·]*$/.test(stripped)) continue;
      if (isAllowlistedLiteral(value)) continue;

      const literalLocalOffset = am.index + am[0].indexOf(value);
      const absOffset = tagOffset + attrsOffsetInTag + literalLocalOffset;
      const { line, col } = lineColFromOffset(source, absOffset);
      const rule: ViolationRule = fromExpr ? 'attr-expr' : 'attr';
      out.push({
        file,
        line,
        col,
        rule,
        value,
        context: `${tagName}.${attrName}`,
      });
    }
  }
}

// Regex over JS-ish code (script block + .ts files) for UX call sites.
// Catches:
//   foo.show('literal'), foo.success('literal'), Alert.alert('literal'),
//   toast.show({title: 'literal'})
const CALL_LITERAL_RX =
  /(?:^|[\s({[,;=])([A-Za-z_$][\w$]*)\s*\.\s*([a-zA-Z_$][\w$]*)\s*\(\s*(['"`])([^'"`]*?)\3/g;

function scanScriptCalls(file: string, source: string, out: Violation[]): void {
  CALL_LITERAL_RX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while (true) {
    m = CALL_LITERAL_RX.exec(source);
    if (!m) break;
    const receiver = m[1];
    const method = m[2];
    if (NON_UX_RECEIVERS.has(receiver)) continue;
    if (!SHOW_LIKE_METHODS.has(method)) continue;
    const value = m[4] ?? '';
    if (isAllowlistedLiteral(value)) continue;

    const literalOffset = m.index + m[0].indexOf(m[3]) + 1;
    const { line, col } = lineColFromOffset(source, literalOffset);
    out.push({
      file,
      line,
      col,
      rule: 'call-arg',
      value,
      context: `${receiver}.${method}#0`,
    });
  }
}

// `confirm('literal')` / `alert('literal')` at top of expression (no receiver).
const BARE_CALL_RX = /(?:^|[\s({[,;=])(confirm|alert|prompt)\s*\(\s*(['"`])([^'"`]*?)\2/g;

function scanBareCalls(file: string, source: string, out: Violation[]): void {
  BARE_CALL_RX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while (true) {
    m = BARE_CALL_RX.exec(source);
    if (!m) break;
    const method = m[1];
    const value = m[3] ?? '';
    if (isAllowlistedLiteral(value)) continue;

    const literalOffset = m.index + m[0].indexOf(m[2]) + 1;
    const { line, col } = lineColFromOffset(source, literalOffset);
    out.push({
      file,
      line,
      col,
      rule: 'call-arg',
      value,
      context: `${method}#0`,
    });
  }
}

// Object property values for UX keys, in any position:
//   { title: 'X', description: 'Y' }
// Catches items=[{label:'X'}] inside attribute expressions AND payloads
// like toast.show({title: 'X'}).
const OBJECT_PROP_RX =
  /(\b(?:title|label|description|message|subtitle|caption|tooltip|placeholder|errorText|helperText|emptyMessage|noResultsText|loadingText|aria-?label)\s*:\s*(['"`]))([^'"`]*?)\2/g;

function scanObjectProps(file: string, source: string, out: Violation[]): void {
  OBJECT_PROP_RX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while (true) {
    m = OBJECT_PROP_RX.exec(source);
    if (!m) break;
    const propName = m[1].split(/\s*:/)[0].trim();
    const value = m[3] ?? '';
    if (isAllowlistedLiteral(value)) continue;

    const literalOffset = m.index + m[1].length;
    const { line, col } = lineColFromOffset(source, literalOffset);
    out.push({
      file,
      line,
      col,
      rule: 'object-prop',
      value,
      context: `obj.${propName}`,
    });
  }
}

// ---------------------------------------------------------------------------
// File walk
// ---------------------------------------------------------------------------

async function* listFiles(): AsyncGenerator<string> {
  for (const root of SCAN_ROOTS) {
    const abs = join(ROOT, root);
    if (!existsSync(abs)) continue;
    for (const pattern of ['**/*.svelte', '**/*.svelte.ts', '**/*.ts']) {
      const glob = new Glob(pattern);
      for await (const rel of glob.scan({ cwd: abs, absolute: false })) {
        yield join(root, rel);
      }
    }
  }
}

// Spawn the Svelte-AST helper (Node ESM, lives under apps/web/scripts/
// so `import 'svelte/compiler'` resolves from apps/web's node_modules).
// It returns JSON-encoded violations for the `text-child` rule.
function runSvelteAstPass(): Violation[] {
  const result = spawnSync('node', ['apps/web/scripts/i18n-text-children.mjs'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) {
    console.error('[i18n-hardcoded] svelte-ast pass failed:');
    if (result.stderr) console.error(result.stderr);
    process.exit(2);
  }
  if (result.stderr) {
    // surface parse-skip warnings, but don't fail.
    process.stderr.write(result.stderr);
  }
  try {
    const parsed = JSON.parse(result.stdout || '[]') as Violation[];
    return parsed.filter((v): v is Violation => !isExemptFile(v.file));
  } catch {
    return [];
  }
}

async function detect(): Promise<Violation[]> {
  const violations: Violation[] = [];
  for await (const file of listFiles()) {
    if (isExemptFile(file)) continue;
    const abs = join(ROOT, file);
    let src: string;
    try {
      src = readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    if (file.endsWith('.svelte')) {
      scanTemplateAttrs(file, src, violations);
      const scriptOnly = extractScriptBody(src);
      scanScriptCalls(file, scriptOnly, violations);
      scanBareCalls(file, scriptOnly, violations);
      scanObjectProps(file, src, violations);
    } else {
      scanScriptCalls(file, src, violations);
      scanBareCalls(file, src, violations);
      scanObjectProps(file, src, violations);
    }
  }

  // R5: Svelte-AST text-child pass. Adds rule 'text-child' violations
  // for <Tag>literal</Tag> in UX components/elements.
  violations.push(...runSvelteAstPass());

  violations.sort((a, b) =>
    a.file === b.file
      ? a.line === b.line
        ? a.col - b.col
        : a.line - b.line
      : a.file < b.file
        ? -1
        : 1,
  );
  return violations;
}

// ---------------------------------------------------------------------------
// Baseline I/O
// ---------------------------------------------------------------------------
//
// Auto-prune model — NO cron job, no manual --update-baseline step:
//
//   Match key is `${file}::${value}` (NOT line:col) so that adding /
//   removing unrelated lines doesn't reshuffle baseline state. Multiple
//   occurrences of the same literal in the same file are tracked by
//   count under the same group.
//
//   On each run:
//     - For each (file, value) group:
//         live[k] > baseline[k]   →  (live − baseline) NEW violations.
//         live[k] ≤ baseline[k]   →  no new; baseline shrinks by the
//                                     surplus (the difference is treated
//                                     as "fixed by this run").
//     - If 0 NEW violations: rewrite baseline.json in place with the
//       current live snapshot (refreshes line/col + drops fixed
//       entries). Exit 0.
//     - If ≥1 NEW violations: report and exit 1 WITHOUT touching the
//       baseline (so the failing PR can't silently absorb its debt).
//
//   --update-baseline still exists as an escape hatch (force-rewrite
//   with all current violations, including new ones).

interface BaselineEntry {
  key: string; // "file:line:col" — current location, regenerated each run
  rule: ViolationRule;
  context: string;
  value: string;
}

interface BaselineFile {
  note: string;
  count: number;
  byRule: Partial<Record<ViolationRule, number>>;
  byFile: Record<string, number>;
  entries: BaselineEntry[];
}

const NOTE =
  'i18n hardcoded violations — surviving debt only. Auto-prunes on every gate run: as soon as a literal is wrapped in t(), the entry vanishes from this file. New entries are NEVER auto-added — a failing run reports them but leaves this file untouched. To force a rebuild (e.g. after a tool refactor that shifts line numbers), run: bun scripts/check-i18n-hardcoded.ts --update-baseline';

function loadBaselineGroups(): Map<string, number> {
  // Group key = `${file}::${value}`, value = expected count.
  const groups = new Map<string, number>();
  if (!existsSync(BASELINE_PATH)) return groups;
  let raw: { entries?: (BaselineEntry | string)[] };
  try {
    raw = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
  } catch {
    return groups;
  }
  for (const e of raw.entries ?? []) {
    if (typeof e === 'string') {
      // Legacy `file:line:col` baseline — no `value` available, so
      // these legacy entries get ignored. Re-baseline once after
      // landing this change to migrate.
      continue;
    }
    const groupKey = `${e.key.split(':')[0]}::${e.value}`;
    groups.set(groupKey, (groups.get(groupKey) ?? 0) + 1);
  }
  return groups;
}

function violationGroupKey(v: Violation): string {
  const truncated = v.value.length > 80 ? `${v.value.slice(0, 77)}…` : v.value;
  return `${v.file}::${truncated}`;
}

function writeBaseline(violations: Violation[]): void {
  const entries: BaselineEntry[] = violations.map((v) => ({
    key: `${v.file}:${v.line}:${v.col}`,
    rule: v.rule,
    context: v.context,
    value: v.value.length > 80 ? `${v.value.slice(0, 77)}…` : v.value,
  }));
  entries.sort((a, b) => {
    if (a.rule !== b.rule) return a.rule < b.rule ? -1 : 1;
    return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
  });

  const byRule: Partial<Record<ViolationRule, number>> = {};
  const byFile: Record<string, number> = {};
  for (const e of entries) {
    byRule[e.rule] = (byRule[e.rule] ?? 0) + 1;
    const file = e.key.split(':')[0];
    byFile[file] = (byFile[file] ?? 0) + 1;
  }
  const sortedByFile = Object.fromEntries(
    Object.entries(byFile).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)),
  );

  const payload: BaselineFile = {
    note: NOTE,
    count: entries.length,
    byRule,
    byFile: sortedByFile,
    entries,
  };
  writeFileSync(BASELINE_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

function readExistingPayload(): string {
  if (!existsSync(BASELINE_PATH)) return '';
  try {
    return readFileSync(BASELINE_PATH, 'utf8');
  } catch {
    return '';
  }
}

function formatViolation(v: Violation): string {
  const truncated = v.value.length > 60 ? `${v.value.slice(0, 57)}…` : v.value;
  return `  ${v.file}:${v.line}:${v.col} [${v.rule}] ${v.context}: "${truncated}"`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const violations = await detect();

if (UPDATE) {
  writeBaseline(violations);
  console.log(`check-i18n-hardcoded: baseline rewritten with ${violations.length} entries`);
  process.exit(0);
}

const expectedGroups = loadBaselineGroups();

// Bucket the live violations by group key and count NEW per group.
const liveGroupCounts = new Map<string, number>();
const liveByGroup = new Map<string, Violation[]>();
for (const v of violations) {
  const gk = violationGroupKey(v);
  liveGroupCounts.set(gk, (liveGroupCounts.get(gk) ?? 0) + 1);
  const list = liveByGroup.get(gk) ?? [];
  list.push(v);
  liveByGroup.set(gk, list);
}

const newViolations: Violation[] = [];
for (const [gk, list] of liveByGroup) {
  const allowed = expectedGroups.get(gk) ?? 0;
  if (list.length > allowed) {
    // First `allowed` are debt; the rest are new.
    newViolations.push(...list.slice(allowed));
  }
}

const ruleCounts: Record<string, number> = {};
for (const v of violations) ruleCounts[v.rule] = (ruleCounts[v.rule] ?? 0) + 1;
const summary = Object.entries(ruleCounts)
  .map(([r, n]) => `${r}=${n}`)
  .join(', ');

if (newViolations.length === 0) {
  // Auto-prune: rewrite baseline to the current snapshot. Refreshes
  // line/col on entries that shifted; drops entries whose literal is
  // no longer found in source. No-op if nothing changed.
  const before = readExistingPayload();
  writeBaseline(violations);
  const after = readExistingPayload();
  if (before !== after) {
    // Count baseline shrinkage by group totals (live vs expected).
    let droppedGroups = 0;
    for (const [gk, expected] of expectedGroups) {
      const live = liveGroupCounts.get(gk) ?? 0;
      if (live < expected) droppedGroups += expected - live;
    }
    console.log(
      `check-i18n-hardcoded: OK (${violations.length} baseline / 0 new) [${summary || '-'}]\n` +
        `  auto-pruned: baseline rewritten in place (${droppedGroups} entr${droppedGroups === 1 ? 'y' : 'ies'} dropped or shifted)`,
    );
  } else {
    console.log(
      `check-i18n-hardcoded: OK (${violations.length} baseline / 0 new) [${summary || '-'}]`,
    );
  }
  process.exit(0);
}

console.error(
  `\ncheck-i18n-hardcoded: ${newViolations.length} NEW hardcoded user-facing string(s) [${summary}]:\n`,
);
for (const v of newViolations.slice(0, 60)) console.error(formatViolation(v));
if (newViolations.length > 60) {
  console.error(`  ... +${newViolations.length - 60} more`);
}
console.error(
  '\nFix: wrap the literal in t("namespace.key") and add the key to packages/i18n/src/dictionaries/{pt-BR,en}.json.\n' +
    'If the literal is intentional (brand name, slug, etc.), extend the allowlist in scripts/check-i18n-hardcoded.ts.\n' +
    'To refresh the baseline after an intentional bulk-edit:\n' +
    '  bun scripts/check-i18n-hardcoded.ts --update-baseline\n',
);
process.exit(1);
