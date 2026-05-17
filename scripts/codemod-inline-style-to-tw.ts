#!/usr/bin/env bun

// codemod-inline-style-to-tw.ts
//
// Rewrites `style="..."` inline-style attributes on Svelte/HTML elements
// into equivalent Tailwind v4 utility classes (arbitrary-value syntax
// where needed) and `style:` Svelte directives when interpolation is
// present. Designed to drain the inline-style debt that violates the
// project's "no inline style / no <style> block in component" rule
// (see ~/.claude/.../feedback_no_inline_style.md).
//
// Scope of patterns we auto-translate. Anything outside this set is
// LEFT IN PLACE and recorded in `codemod-inline-style.unmapped.json`
// for human review.
//
//   - color: <css-var-or-hex>           → text-[...]
//   - background[-color]: <css-var-hex> → bg-[...]
//   - border-color: <css-var-or-hex>    → border-[...]
//   - text-decoration-color: <var>      → decoration-[...]
//   - display: none|flex|block|grid|inline-block → hidden|flex|block|grid|inline-block
//   - width|height: Npx | N% | Nrem     → w-[...] / h-[...]
//   - min-height: Npx | 0 | calc(...)   → min-h-[...]
//   - padding[-X]: Npx                  → p-[...] / px-[...] / py-[...] / pt-[...] etc.
//   - margin[-X]: Npx                   → m-[...] etc.
//   - text-align: left|center|right|justify → text-left|text-center|text-right|text-justify
//   - font-size: Npx                    → text-[Npx]
//   - font-weight: N                    → font-bold (700), font-medium (500), font-[N] (other)
//   - line-height: N                    → leading-[N]
//   - transition-duration: <var>        → uses style: directive (preserved)
//   - transition-timing-function: <var> → uses style: directive (preserved)
//
// Anything with interpolation like `{expr}` is converted to one or more
// `style:property={expr}` Svelte directives. Pure-static segments next
// to interpolations are split: static → class, dynamic → style: directive.
//
// Usage:
//   bun scripts/codemod-inline-style-to-tw.ts             # dry-run (default)
//   bun scripts/codemod-inline-style-to-tw.ts --apply
//   bun scripts/codemod-inline-style-to-tw.ts --apply apps/web/src/foo.svelte

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Glob } from 'bun';

const ROOT = process.cwd();
const APPLY = process.argv.includes('--apply');
const VERBOSE = process.argv.includes('--verbose');
const explicitFiles = process.argv
  .slice(2)
  .filter((a) => !a.startsWith('--'))
  .map((a) => (a.startsWith('/') ? a : join(ROOT, a)));

const SCAN_ROOTS = ['apps/web/src', 'packages/ui/src'];
const UNMAPPED_PATH = join(ROOT, 'scripts/codemod-inline-style.unmapped.json');

// ---------------------------------------------------------------------------
// Translation helpers (declaration → tailwind class / style: directive)
// ---------------------------------------------------------------------------

interface Translation {
  classes: string[];
  directives: Array<{ prop: string; expr: string }>;
  unmapped: string[];
}

const T_RX = {
  num: /^-?\d+(?:\.\d+)?$/,
  px: /^(-?\d+(?:\.\d+)?)px$/,
  rem: /^(-?\d+(?:\.\d+)?)rem$/,
  pct: /^(-?\d+(?:\.\d+)?)%$/,
  hex: /^#[0-9a-fA-F]{3,8}$/,
  cssVar: /^var\(--[\w-]+\)$/,
  cssVarRich: /^var\(--[\w-]+(?:,\s*[^)]+)?\)$/,
  calc: /^calc\([^()]*(?:\([^()]*\)[^()]*)*\)$/,
  hasInterp: /\{[^}]*\}/,
  pureInterp: /^\{([^}]+)\}$/,
};

function escapeForArbitrary(value: string): string {
  // Tailwind arbitrary values allow spaces if wrapped with `_`. Spaces
  // inside `var()` and `calc()` are problematic — replace with `_`.
  return value.trim().replace(/\s+/g, '_');
}

function valueLooksRecognizableColor(v: string): boolean {
  const t = v.trim();
  return (
    T_RX.hex.test(t) ||
    T_RX.cssVarRich.test(t) ||
    /^rgb(a)?\(/.test(t) ||
    /^hsl(a)?\(/.test(t) ||
    /^oklch\(/.test(t)
  );
}

function valueIsStaticSize(v: string): boolean {
  const t = v.trim();
  if (
    T_RX.px.test(t) ||
    T_RX.rem.test(t) ||
    T_RX.pct.test(t) ||
    t === '0' ||
    /^-?\d+(?:\.\d+)?(?:em|vh|vw|fr|ch|svh|dvh|lvh)$/.test(t)
  ) {
    return true;
  }
  // Balanced `calc(...)`, `max(...)`, `min(...)`, `clamp(...)` of any
  // nesting depth — no interpolation allowed.
  if (/^(calc|max|min|clamp)\(/.test(t)) {
    let depth = 0;
    for (let i = 0; i < t.length; i++) {
      if (t[i] === '(') depth++;
      else if (t[i] === ')') {
        depth--;
        if (depth === 0 && i !== t.length - 1) return false;
      }
    }
    return depth === 0;
  }
  return false;
}

function asTwSize(v: string): string {
  const t = v.trim();
  if (t === '0') return '0';
  return `[${escapeForArbitrary(t)}]`;
}

function asTwColor(v: string): string {
  return `[${escapeForArbitrary(v)}]`;
}

const SIDE_TO_TW: Record<string, { p: string; m: string }> = {
  top: { p: 'pt', m: 'mt' },
  right: { p: 'pr', m: 'mr' },
  bottom: { p: 'pb', m: 'mb' },
  left: { p: 'pl', m: 'ml' },
};

function translateDeclaration(prop: string, rawValue: string, out: Translation): void {
  const value = rawValue.trim();
  if (!value) return;

  // Detect interpolation. If the whole value is `{expr}`, that's a pure
  // expression → emit style: directive. If it's a mix (`{x}%`), the
  // whole declaration must stay dynamic — emit style: with the original
  // literal (no curly braces, Svelte handles it).
  if (T_RX.hasInterp.test(value)) {
    const pure = value.match(T_RX.pureInterp);
    if (pure) {
      out.directives.push({ prop, expr: pure[1].trim() });
    } else {
      // Mixed: e.g. `{pct}%` or `{w}px`. Convert to JS template
      // literal. We string-concat the `${}` opener so the codemod
      // source itself doesn't contain a template-curly literal
      // (biome's noTemplateCurlyInString).
      const dollar = '$';
      const expr = value.replace(/\{([^}]+)\}/g, `${dollar}{$1}`);
      out.directives.push({ prop, expr: `\`${expr}\`` });
    }
    return;
  }

  // Static value → try to map to Tailwind utility.
  switch (prop) {
    case 'color':
      if (valueLooksRecognizableColor(value)) {
        out.classes.push(`text-${asTwColor(value)}`);
        return;
      }
      break;
    case 'background':
    case 'background-color':
      if (valueLooksRecognizableColor(value)) {
        out.classes.push(`bg-${asTwColor(value)}`);
        return;
      }
      break;
    case 'border-color':
      if (valueLooksRecognizableColor(value)) {
        out.classes.push(`border-${asTwColor(value)}`);
        return;
      }
      break;
    case 'text-decoration-color':
      if (valueLooksRecognizableColor(value)) {
        out.classes.push(`decoration-${asTwColor(value)}`);
        return;
      }
      break;
    case 'display':
      if (value === 'none') {
        out.classes.push('hidden');
        return;
      }
      if (['flex', 'block', 'grid', 'inline-block', 'inline-flex', 'inline'].includes(value)) {
        out.classes.push(value);
        return;
      }
      break;
    case 'width':
    case 'height': {
      const tw = prop === 'width' ? 'w' : 'h';
      if (valueIsStaticSize(value)) {
        out.classes.push(`${tw}-${asTwSize(value)}`);
        return;
      }
      break;
    }
    case 'min-width':
    case 'min-height': {
      const tw = prop === 'min-width' ? 'min-w' : 'min-h';
      if (valueIsStaticSize(value)) {
        out.classes.push(`${tw}-${asTwSize(value)}`);
        return;
      }
      break;
    }
    case 'max-width':
    case 'max-height': {
      const tw = prop === 'max-width' ? 'max-w' : 'max-h';
      if (valueIsStaticSize(value)) {
        out.classes.push(`${tw}-${asTwSize(value)}`);
        return;
      }
      break;
    }
    case 'padding':
    case 'margin': {
      const tw = prop === 'padding' ? 'p' : 'm';
      if (valueIsStaticSize(value)) {
        out.classes.push(`${tw}-${asTwSize(value)}`);
        return;
      }
      // padding: 0 3px → px-[3px] py-0 — only handle the most common
      // 2-value form.
      const parts = value.split(/\s+/);
      if (parts.length === 2 && parts.every(valueIsStaticSize)) {
        out.classes.push(`${tw}y-${asTwSize(parts[0])}`);
        out.classes.push(`${tw}x-${asTwSize(parts[1])}`);
        return;
      }
      break;
    }
    case 'padding-top':
    case 'padding-right':
    case 'padding-bottom':
    case 'padding-left': {
      const side = prop.split('-')[1] as keyof typeof SIDE_TO_TW;
      if (valueIsStaticSize(value)) {
        out.classes.push(`${SIDE_TO_TW[side].p}-${asTwSize(value)}`);
        return;
      }
      break;
    }
    case 'margin-top':
    case 'margin-right':
    case 'margin-bottom':
    case 'margin-left': {
      const side = prop.split('-')[1] as keyof typeof SIDE_TO_TW;
      if (valueIsStaticSize(value)) {
        out.classes.push(`${SIDE_TO_TW[side].m}-${asTwSize(value)}`);
        return;
      }
      break;
    }
    case 'padding-top-bottom':
    case 'padding-block': {
      if (valueIsStaticSize(value)) {
        out.classes.push(`py-${asTwSize(value)}`);
        return;
      }
      break;
    }
    case 'text-align':
      if (['left', 'center', 'right', 'justify'].includes(value)) {
        out.classes.push(`text-${value}`);
        return;
      }
      break;
    case 'font-size':
      if (T_RX.px.test(value) || T_RX.rem.test(value)) {
        out.classes.push(`text-${asTwSize(value)}`);
        return;
      }
      break;
    case 'font-weight':
      if (value === '700' || value === 'bold') {
        out.classes.push('font-bold');
        return;
      }
      if (value === '500' || value === 'medium') {
        out.classes.push('font-medium');
        return;
      }
      if (value === '600' || value === 'semibold') {
        out.classes.push('font-semibold');
        return;
      }
      if (value === '400' || value === 'normal') {
        out.classes.push('font-normal');
        return;
      }
      if (T_RX.num.test(value)) {
        out.classes.push(`font-[${value}]`);
        return;
      }
      break;
    case 'line-height':
      if (T_RX.num.test(value)) {
        out.classes.push(`leading-[${value}]`);
        return;
      }
      if (T_RX.px.test(value) || T_RX.rem.test(value)) {
        out.classes.push(`leading-${asTwSize(value)}`);
        return;
      }
      break;
    case 'border-top':
    case 'border-right':
    case 'border-bottom':
    case 'border-left':
      // e.g. "border-top: 1px solid var(--x)" — too compound, leave for
      // human review unless a follow-up codemod is added.
      break;
    case 'transition-duration':
      // Tailwind: duration-[<value>]
      if (T_RX.cssVarRich.test(value) || /^\d+ms$/.test(value) || /^[\d.]+s$/.test(value)) {
        out.classes.push(`duration-${asTwColor(value)}`);
        return;
      }
      break;
    case 'transition-timing-function':
      // Tailwind: ease-[<value>]
      if (T_RX.cssVarRich.test(value) || /^(linear|ease(-in|-out|-in-out)?)$/.test(value)) {
        out.classes.push(`ease-${asTwColor(value)}`);
        return;
      }
      break;
    case 'transition-property':
      if (T_RX.cssVarRich.test(value) || /^[\w,-\s]+$/.test(value)) {
        out.classes.push(`transition-${asTwColor(value)}`);
        return;
      }
      break;
    case 'transition': {
      // Compound transition: e.g. `width 180ms var(--ease-precise),
      // background 180ms var(--ease-precise)`. Wrap the whole thing in
      // `transition-[...]` if it's static.
      out.classes.push(`transition-${asTwColor(value)}`);
      return;
    }
  }

  // No mapping → emit a stay-as-style directive so behavior is preserved
  // EXACTLY. Caller will keep this in the residual style="" only if
  // explicitly fallbacking; for now, mark unmapped and bail.
  out.unmapped.push(`${prop}: ${value}`);
}

// ---------------------------------------------------------------------------
// Style string parser
// ---------------------------------------------------------------------------
//
// Split a `style="..."` content blob into declarations. We must be
// careful with `{expr}` segments — they may contain `:` or `;` — and
// with `var(--x, fallback)` which contains commas (no special chars
// usually, but be defensive).
function splitDeclarations(blob: string): Array<{ prop: string; value: string }> {
  const decls: Array<{ prop: string; value: string }> = [];
  let depth = 0;
  let brace = 0;
  let start = 0;
  for (let i = 0; i < blob.length; i++) {
    const c = blob[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === '{') brace++;
    else if (c === '}') brace--;
    else if (c === ';' && depth === 0 && brace === 0) {
      const chunk = blob.slice(start, i);
      pushDecl(chunk, decls);
      start = i + 1;
    }
  }
  if (start < blob.length) pushDecl(blob.slice(start), decls);
  return decls;
}

function pushDecl(chunk: string, decls: Array<{ prop: string; value: string }>): void {
  const trimmed = chunk.trim();
  if (!trimmed) return;
  // First `:` outside braces is the prop/value separator.
  let brace = 0;
  let depth = 0;
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === '{') brace++;
    else if (c === '}') brace--;
    else if (c === ':' && depth === 0 && brace === 0) {
      const prop = trimmed.slice(0, i).trim().toLowerCase();
      const value = trimmed.slice(i + 1).trim();
      if (prop && value) decls.push({ prop, value });
      return;
    }
  }
}

// ---------------------------------------------------------------------------
// File rewriting
// ---------------------------------------------------------------------------

interface FileOutcome {
  file: string;
  changed: boolean;
  before: number;
  after: number;
  unmapped: Array<{ line: number; decl: string }>;
}

// Match a single `style="..."` attribute on an element. Note: this is
// HTML-attribute-level — we do NOT try to handle Svelte spread props
// like `{...rest}`.
//
// We capture:
//   group 1 — leading whitespace (so we can preserve indentation)
//   group 2 — the inner blob (no quotes)
const STYLE_ATTR_RX = /(\s+)style="([^"]*)"/g;

// Match a `class="..."` attribute on the same opening tag (we need it
// to append our new classes). We search from the start of the tag to
// the position of the style attribute.
const CLASS_ATTR_RX = /\bclass="([^"]*)"/;

// Identify the bounds of the opening tag that contains a given offset.
function tagBoundsAt(src: string, offset: number): { start: number; end: number } | null {
  // Walk backward to find the nearest `<` that starts a tag. Track
  // matching `{...}` and quoted-string spans BACKWARDS so we don't
  // confuse `=>` inside an `onclick={() => ...}` block with a real tag
  // boundary `>`. Same for `>` inside a `"...class > foo..."` string.
  let start = -1;
  let brace = 0;
  let quote = '';
  for (let i = offset; i >= 0; i--) {
    const c = src[i];
    if (quote) {
      if (c === quote && src[i - 1] !== '\\') quote = '';
      continue;
    }
    if (c === '"' || c === "'") {
      quote = c;
      continue;
    }
    if (c === '}') brace++;
    else if (c === '{') brace--;
    else if (c === '<' && brace === 0) {
      start = i;
      break;
    } else if (c === '>' && brace === 0) {
      return null; // inside text, not a tag
    }
  }
  if (start === -1) return null;
  // Walk forward, respecting `{...}` braces and quoted strings, to find
  // the matching `>`.
  let fwdBrace = 0;
  let fwdQuote = '';
  for (let i = start + 1; i < src.length; i++) {
    const c = src[i];
    if (fwdQuote) {
      if (c === fwdQuote) fwdQuote = '';
      continue;
    }
    if (c === '"' || c === "'") {
      fwdQuote = c;
      continue;
    }
    if (c === '{') fwdBrace++;
    else if (c === '}') fwdBrace--;
    else if (c === '>' && fwdBrace === 0) {
      return { start, end: i + 1 };
    }
  }
  return null;
}

function offsetToLine(src: string, offset: number): number {
  let line = 1;
  for (let i = 0; i < offset && i < src.length; i++) {
    if (src[i] === '\n') line++;
  }
  return line;
}

function rewriteFile(filePath: string, src: string): { content: string; outcome: FileOutcome } {
  const outcome: FileOutcome = {
    file: relative(ROOT, filePath),
    changed: false,
    before: 0,
    after: 0,
    unmapped: [],
  };

  // Count existing style="" occurrences before.
  outcome.before = (src.match(/\sstyle="/g) ?? []).length;

  // Collect every style attribute with its bounds.
  type Match = {
    fullStart: number;
    fullEnd: number;
    leading: string;
    inner: string;
    tagStart: number;
    tagEnd: number;
  };
  const matches: Match[] = [];
  let m: RegExpExecArray | null;
  STYLE_ATTR_RX.lastIndex = 0;
  while (true) {
    m = STYLE_ATTR_RX.exec(src);
    if (!m) break;
    const bounds = tagBoundsAt(src, m.index);
    if (!bounds) continue;
    matches.push({
      fullStart: m.index,
      fullEnd: m.index + m[0].length,
      leading: m[1],
      inner: m[2],
      tagStart: bounds.start,
      tagEnd: bounds.end,
    });
  }

  // Apply rewrites back-to-front so offsets stay valid.
  let out = src;
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    const decls = splitDeclarations(match.inner);
    if (decls.length === 0) continue;

    const xlate: Translation = { classes: [], directives: [], unmapped: [] };
    for (const d of decls) translateDeclaration(d.prop, d.value, xlate);

    // If ANY declaration is unmapped, we don't touch this style attr —
    // record and skip. Partial rewrites are too risky (would silently
    // drop the unmapped declaration's effect).
    if (xlate.unmapped.length > 0) {
      const line = offsetToLine(src, match.fullStart);
      for (const u of xlate.unmapped) outcome.unmapped.push({ line, decl: u });
      continue;
    }

    // No-op (declarations all collapsed to nothing).
    if (xlate.classes.length === 0 && xlate.directives.length === 0) continue;

    // Build the replacement chunk to splice into the tag.
    const directivesStr = xlate.directives
      .map((d) => `${match.leading}style:${d.prop}={${d.expr}}`)
      .join('');

    // Merge with existing class="" if present. The tag's bounds tell us
    // where to look.
    const tagBlock = out.slice(match.tagStart, match.tagEnd);
    const styleStartInTag = match.fullStart - match.tagStart;
    const styleEndInTag = match.fullEnd - match.tagStart;

    let newTagBlock: string;

    if (xlate.classes.length === 0) {
      // No new classes to merge — just replace the style="" with the
      // directives.
      newTagBlock =
        tagBlock.slice(0, styleStartInTag) + directivesStr + tagBlock.slice(styleEndInTag);
    } else {
      const newClassesStr = xlate.classes.join(' ');
      const classMatch = tagBlock.match(CLASS_ATTR_RX);
      if (classMatch) {
        // Merge into existing class. Append at end (preserving prior
        // order). Then remove the style attribute and append directives.
        const merged = `${classMatch[1].trim()} ${newClassesStr}`.trim();
        const updatedClassAttr = `class="${merged}"`;
        // Replace existing class attr, then remove style attr.
        let working = tagBlock.replace(CLASS_ATTR_RX, updatedClassAttr);
        // Recompute style attr position after class replacement (length
        // may have shifted).
        const newStyleRx = new RegExp(
          `${match.leading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}style="${match.inner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`,
        );
        working = working.replace(newStyleRx, directivesStr);
        newTagBlock = working;
      } else {
        // No class attr — insert one in place of style attr.
        const replacement = `${match.leading}class="${newClassesStr}"${directivesStr}`;
        newTagBlock =
          tagBlock.slice(0, styleStartInTag) + replacement + tagBlock.slice(styleEndInTag);
      }
    }

    out = out.slice(0, match.tagStart) + newTagBlock + out.slice(match.tagEnd);
  }

  outcome.after = (out.match(/\sstyle="/g) ?? []).length;
  outcome.changed = out !== src;
  return { content: out, outcome };
}

// ---------------------------------------------------------------------------
// CLI entry
// ---------------------------------------------------------------------------

async function* listFiles(): AsyncGenerator<string> {
  if (explicitFiles.length > 0) {
    for (const f of explicitFiles) yield f;
    return;
  }
  for (const root of SCAN_ROOTS) {
    const abs = join(ROOT, root);
    if (!existsSync(abs)) continue;
    const glob = new Glob('**/*.svelte');
    for await (const rel of glob.scan({ cwd: abs, absolute: false })) {
      yield join(abs, rel);
    }
  }
}

async function main(): Promise<void> {
  const outcomes: FileOutcome[] = [];
  for await (const file of listFiles()) {
    const src = readFileSync(file, 'utf8');
    if (!src.includes('style="')) continue;
    const { content, outcome } = rewriteFile(file, src);
    outcomes.push(outcome);
    if (APPLY && outcome.changed) writeFileSync(file, content);
  }

  const totalBefore = outcomes.reduce((s, o) => s + o.before, 0);
  const totalAfter = outcomes.reduce((s, o) => s + o.after, 0);
  const changedFiles = outcomes.filter((o) => o.changed);
  const unmapped = outcomes.flatMap((o) => o.unmapped.map((u) => ({ file: o.file, ...u })));

  const banner = APPLY ? 'APPLY' : 'DRY-RUN';
  console.log(
    `\ncodemod-inline-style-to-tw [${banner}]:` +
      `\n  scanned ${outcomes.length} files with style="" attrs` +
      `\n  ${changedFiles.length} files changed` +
      `\n  ${totalBefore} → ${totalAfter} style="" occurrences (${totalBefore - totalAfter} eliminated)` +
      `\n  ${unmapped.length} declarations left unmapped (see ${relative(ROOT, UNMAPPED_PATH)})`,
  );

  if (VERBOSE) {
    for (const o of changedFiles) {
      console.log(`  - ${o.file}: ${o.before} → ${o.after}`);
    }
  }

  writeFileSync(
    UNMAPPED_PATH,
    `${JSON.stringify({ count: unmapped.length, items: unmapped }, null, 2)}\n`,
  );
}

await main();
