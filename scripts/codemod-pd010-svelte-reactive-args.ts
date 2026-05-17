/**
 * PD-010 / F5-12 C5 — codemod: wrap reactive args passed to kubb hooks.
 *
 * Two transforms (idempotent, conservative):
 *
 * 1. **Path-param wrap**: when the first arg to a `createXxx` hook that
 *    actually *takes* a path-param (detected by scanning the generated SDK
 *    for `PathParams[` signatures) is a bare identifier and not already a
 *    function, wrap it as `() => name`. Hooks without path params (e.g.
 *    `createGetV1Users` whose first arg is a query-params object) are
 *    skipped — wrapping their first arg would type-error.
 *
 * 2. **enabled wrap**: only inside a kubb hook call's argument list and
 *    only when nested under a `query: { ... enabled: <expr> ... }`. The
 *    custom `enabled:` properties of non-kubb helpers (`useSseSubscribe`,
 *    etc.) keep their narrow types untouched.
 *
 * Idempotent. Runs only on `.svelte` files under `apps/web/src/`.
 *
 * Usage:
 *   bun run scripts/codemod-pd010-svelte-reactive-args.ts            # dry-run
 *   bun run scripts/codemod-pd010-svelte-reactive-args.ts --write    # apply
 */

import path from 'node:path';
import { Glob } from 'bun';

const ROOT = path.resolve(import.meta.dir, '..');
const SRC = path.join(ROOT, 'apps/web/src');
const SDK_HOOKS = path.join(ROOT, 'packages/api-client/src/generated/hooks');
const WRITE = process.argv.includes('--write');

// --- Build the path-param-hook whitelist by scanning the generated SDK ---
async function buildPathParamHookSet(): Promise<Set<string>> {
  const set = new Set<string>();
  const glob = new Glob('**/*.ts');
  for await (const rel of glob.scan({ cwd: SDK_HOOKS })) {
    const file = await Bun.file(path.join(SDK_HOOKS, rel)).text();
    // Walk every `export function createXxx(...)` and check its signature
    // (the slice up to the first `{`) for `PathParams[`.
    const fns = file.matchAll(/export\s+function\s+(create[A-Z][A-Za-z0-9]+)\b/g);
    for (const m of fns) {
      const start = m.index!;
      const braceIdx = file.indexOf('{', start);
      const sig = braceIdx === -1 ? file.slice(start) : file.slice(start, braceIdx);
      if (sig.includes('PathParams[')) set.add(m[1]!);
    }
  }
  return set;
}

const PATH_PARAM_HOOKS = await buildPathParamHookSet();
console.log(`Loaded ${PATH_PARAM_HOOKS.size} path-param hooks from SDK`);

// --- Helpers ---
const HOOK_NAME_RE = /\b(create(?:Get|Post|Put|Delete|Patch)[A-Z][A-Za-z0-9]+)\s*\(/g;

function isBareIdentifier(arg: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(arg.trim());
}
function isReservedIdent(name: string): boolean {
  return name === 'undefined' || name === 'null' || name === 'true' || name === 'false';
}
function isAlreadyGetter(arg: string): boolean {
  const t = arg.trim();
  return t.startsWith('()') || t.startsWith('(') || t.startsWith('function');
}

/** Returns the substring up to (excluding) the next top-level `,` or `)`/`}`. */
function readUntilTopLevelTerminator(
  src: string,
  start: number,
  terminators: string,
): { text: string; end: number; terminator: string | null } {
  let depth = 0;
  let i = start;
  let inString: '"' | "'" | '`' | null = null;
  while (i < src.length) {
    const ch = src[i]!;
    if (inString) {
      if (ch === '\\' && i + 1 < src.length) {
        i += 2;
        continue;
      }
      if (ch === inString) inString = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      i++;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') {
      if (depth === 0 && terminators.includes(ch)) {
        return { text: src.slice(start, i), end: i, terminator: ch };
      }
      depth--;
    } else if (ch === ',' && depth === 0 && terminators.includes(',')) {
      return { text: src.slice(start, i), end: i, terminator: ',' };
    }
    i++;
  }
  return { text: src.slice(start), end: src.length, terminator: null };
}

/** Find the matching close paren for an opening at `openIdx` (which points
 *  AT the `(`). Returns the index of the `)`. */
function findMatchingClose(src: string, openIdx: number): number {
  let depth = 0;
  let i = openIdx;
  let inString: '"' | "'" | '`' | null = null;
  while (i < src.length) {
    const ch = src[i]!;
    if (inString) {
      if (ch === '\\' && i + 1 < src.length) {
        i += 2;
        continue;
      }
      if (ch === inString) inString = null;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch;
      i++;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

// (earlier dead variant kept inline as `wrapEnabledNested` below; this stub
// remains so a manual reviewer can compare strategies if needed.)
function _wrapEnabledInRange(
  src: string,
  argsStart: number,
  argsEnd: number,
): { out: string; changed: number } {
  // Find every `query:` inside the range, then inside its object body find `enabled:`.
  let out = src.slice(0, argsStart);
  let i = argsStart;
  let changed = 0;
  while (i < argsEnd) {
    // Try to match `query:` next.
    const queryMatch = /\bquery\s*:\s*\{/g;
    queryMatch.lastIndex = i;
    const m = queryMatch.exec(src);
    if (!m || m.index >= argsEnd) {
      out += src.slice(i, argsEnd);
      i = argsEnd;
      break;
    }
    out += src.slice(i, m.index + m[0].length);
    const objStart = m.index + m[0].length;
    // Walk to matching `}`.
    let depth = 1;
    let j = objStart;
    let inString: '"' | "'" | '`' | null = null;
    while (j < src.length && depth > 0) {
      const ch = src[j]!;
      if (inString) {
        if (ch === '\\' && j + 1 < src.length) {
          j += 2;
          continue;
        }
        if (ch === inString) inString = null;
        j++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        inString = ch;
        j++;
        continue;
      }
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth === 0) break;
      j++;
    }
    const objEnd = j; // index of closing `}`
    // Within [objStart, objEnd), find `enabled:`.
    const inner = src.slice(objStart, objEnd);
    const enabledRe = /\benabled\s*:\s*/g;
    let innerOut = '';
    let cursor = 0;
    let em: RegExpExecArray | null;
    while ((em = enabledRe.exec(inner))) {
      const vStart = em.index + em[0].length;
      const read = readUntilTopLevelTerminator(inner, vStart, ',}');
      const valText = read.text.trim();
      if (!valText) continue;
      if (isAlreadyGetter(valText)) continue;
      if (valText === 'true' || valText === 'false') continue;
      innerOut += `${inner.slice(cursor, em.index) + em[0]}() => ${valText}`;
      cursor = read.end;
      changed++;
    }
    innerOut += inner.slice(cursor);
    out += innerOut;
    i = objEnd;
  }
  return { out: out + src.slice(i, argsEnd) + src.slice(argsEnd), changed };
}

function transformScript(src: string): {
  out: string;
  pathChanged: number;
  enabledChanged: number;
} {
  let pathChanged = 0;
  let enabledChanged = 0;
  // Two-pass: first wrap path params (changes call shape but not byte offsets we care about), then enabled.
  // To keep offsets consistent we operate in a single forward walk, rebuilding the string.
  let out = '';
  let cursor = 0;
  HOOK_NAME_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HOOK_NAME_RE.exec(src))) {
    const fnName = m[1]!;
    const callOpen = m.index + m[0].length - 1; // index of `(`
    const argsStart = callOpen + 1;
    const callClose = findMatchingClose(src, callOpen);
    if (callClose === -1) continue;
    const argsEnd = callClose;

    // 1) path-param wrap on first arg (only if hook is whitelisted)
    const firstArg = readUntilTopLevelTerminator(src, argsStart, ',)');
    let firstArgReplacement: string | null = null;
    if (
      PATH_PARAM_HOOKS.has(fnName) &&
      isBareIdentifier(firstArg.text) &&
      !isReservedIdent(firstArg.text.trim()) &&
      !isAlreadyGetter(firstArg.text)
    ) {
      firstArgReplacement = `() => ${firstArg.text.trim()}`;
      pathChanged++;
    }

    // Emit text from cursor to argsStart.
    out += src.slice(cursor, argsStart);
    // Emit first arg (replaced or original) up to firstArg.end.
    if (firstArgReplacement) {
      out += firstArgReplacement;
    } else {
      out += src.slice(argsStart, firstArg.end);
    }

    // 2) enabled wrap on the remaining region [firstArg.end, argsEnd).
    const rest = src.slice(firstArg.end, argsEnd);
    const restWrapped = wrapEnabledNested(rest);
    enabledChanged += restWrapped.changed;
    out += restWrapped.out;

    // Move cursor.
    cursor = argsEnd;
    // Advance regex past this call to avoid re-matching nested kubb calls in args.
    HOOK_NAME_RE.lastIndex = argsEnd;
  }
  out += src.slice(cursor);
  return { out, pathChanged, enabledChanged };
}

/** Inside a chunk of args, find each `query: { ... enabled: <expr> ... }` and wrap. */
function wrapEnabledNested(src: string): { out: string; changed: number } {
  let out = '';
  let cursor = 0;
  let changed = 0;
  const queryRe = /\bquery\s*:\s*\{/g;
  let qm: RegExpExecArray | null;
  while ((qm = queryRe.exec(src))) {
    const objStart = qm.index + qm[0].length;
    // Walk to matching `}` of query.
    let depth = 1;
    let j = objStart;
    let inString: '"' | "'" | '`' | null = null;
    while (j < src.length && depth > 0) {
      const ch = src[j]!;
      if (inString) {
        if (ch === '\\' && j + 1 < src.length) {
          j += 2;
          continue;
        }
        if (ch === inString) inString = null;
        j++;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        inString = ch;
        j++;
        continue;
      }
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      if (depth === 0) break;
      j++;
    }
    const objEnd = j;
    out += src.slice(cursor, objStart);
    const inner = src.slice(objStart, objEnd);
    const enabledRe = /\benabled\s*:\s*/g;
    let innerCursor = 0;
    let innerOut = '';
    let em: RegExpExecArray | null;
    while ((em = enabledRe.exec(inner))) {
      const vStart = em.index + em[0].length;
      const read = readUntilTopLevelTerminator(inner, vStart, ',}');
      const valText = read.text.trim();
      if (!valText || isAlreadyGetter(valText) || valText === 'true' || valText === 'false')
        continue;
      innerOut += `${inner.slice(innerCursor, em.index) + em[0]}() => ${valText}`;
      innerCursor = read.end;
      changed++;
    }
    innerOut += inner.slice(innerCursor);
    out += innerOut;
    cursor = objEnd;
    queryRe.lastIndex = objEnd;
  }
  out += src.slice(cursor);
  return { out, changed };
}

// --- Walk all .svelte files ---
const glob = new Glob('**/*.svelte');
const files = await Array.fromAsync(glob.scan({ cwd: SRC }));

let totalFiles = 0;
let totalPath = 0;
let totalEnabled = 0;

for (const rel of files) {
  const abs = path.join(SRC, rel);
  const original = await Bun.file(abs).text();
  const scriptRe = /(<script[^>]*>)([\s\S]*?)(<\/script>)/g;
  let out = '';
  let lastEnd = 0;
  let perFilePath = 0;
  let perFileEnabled = 0;
  let mm: RegExpExecArray | null;
  while ((mm = scriptRe.exec(original))) {
    const [whole, open, body, close] = mm;
    const r = transformScript(body!);
    perFilePath += r.pathChanged;
    perFileEnabled += r.enabledChanged;
    out += original.slice(lastEnd, mm.index) + open + r.out + close;
    lastEnd = mm.index + whole?.length;
  }
  out += original.slice(lastEnd);
  if (out !== original) {
    totalFiles++;
    totalPath += perFilePath;
    totalEnabled += perFileEnabled;
    console.log(
      `${WRITE ? 'WRITE' : 'DRY  '} ${rel} (path=${perFilePath}, enabled=${perFileEnabled})`,
    );
    if (WRITE) await Bun.write(abs, out);
  }
}

console.log(`\n${WRITE ? 'Wrote' : 'Would write'} ${totalFiles} files`);
console.log(`  path-param wraps: ${totalPath}`);
console.log(`  enabled wraps:    ${totalEnabled}`);
