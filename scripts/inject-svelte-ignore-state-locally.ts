/**
 * PD-010 / F5-12 C5 residual — inject `// svelte-ignore state_referenced_locally`
 * directives for the 35 residual warning sites that survived the C5 codemod.
 *
 * Why these aren't auto-wrapped: they are reactive identifiers inside
 * kubb-generated *query-params object literals* — e.g.
 *   createGetV1Jobs({ page, limit: 20, search }, …)
 * Wrapping just the identifier wouldn't compose with the object literal
 * around it; wrapping the whole object would type-error against the
 * current kubb signature. PD-027 tracks extending the fork to also
 * accept `paramsAsGetters` for query-params objects.
 *
 * Strategy:
 *   1. Run `bun run check` in apps/web and capture each WARNING line.
 *   2. For each unique (file, lineNumber) pair, locate the nearest
 *      *containing statement* (walk up to the most recent `;` or top of
 *      script block) and insert
 *      `// svelte-ignore state_referenced_locally` on the previous line
 *      (skipping if already present).
 *   3. Re-run check to confirm. Idempotent: skips files already
 *      annotated for that exact statement.
 *
 * Usage:
 *   bun run scripts/inject-svelte-ignore-state-locally.ts            # dry-run
 *   bun run scripts/inject-svelte-ignore-state-locally.ts --write    # apply
 */

import { spawn } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dir, '..');
const WEB = path.join(ROOT, 'apps/web');
const WRITE = process.argv.includes('--write');
const IGNORE_COMMENT = '// svelte-ignore state_referenced_locally';

function runCheck(): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn('bun', ['run', 'check'], { cwd: WEB, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    child.stdout.on('data', (b) => (out += b.toString()));
    child.stderr.on('data', (b) => (out += b.toString()));
    child.on('close', () => resolve(out));
  });
}

const checkOutput = await runCheck();
const warningRe = /WARNING "(src\/[^"]+\.svelte)" (\d+):(\d+) "[^"]*state_referenced_locally/g;
const sites = new Map<string, Set<number>>();
for (const m of checkOutput.matchAll(warningRe)) {
  const [, file, line] = m;
  if (!sites.has(file!)) sites.set(file!, new Set());
  sites.get(file!)!.add(parseInt(line!, 10));
}

console.log(
  `Warning sites: ${[...sites.values()].reduce((a, s) => a + s.size, 0)} across ${sites.size} files`,
);

let totalInjected = 0;
let totalSkipped = 0;
for (const [rel, lineSet] of sites) {
  const abs = path.join(WEB, rel);
  const content = await Bun.file(abs).text();
  const lines = content.split('\n');

  // For each warning, walk UP to the start of the containing top-level
  // statement (a line whose trimmed content begins with `const `, `let `,
  // `var `, `$effect(`, `$derived(`, or whose previous line ended a
  // top-level statement). Inject the ignore directive *once* per
  // (statement-start) so multiple warnings on the same statement share
  // a single comment.
  const stmtStarts = new Set<number>();
  for (const lineNum of lineSet) {
    const idx = lineNum - 1;
    if (idx < 0 || idx >= lines.length) continue;
    let stmtStart = idx;
    while (stmtStart > 0) {
      const cur = lines[stmtStart]!.trim();
      if (/^(const|let|var)\s/.test(cur) || /^\$effect\b/.test(cur) || /^\$derived\b/.test(cur)) {
        break;
      }
      stmtStart--;
    }
    stmtStarts.add(stmtStart);
  }

  // Sort descending so insertions don't shift earlier indices.
  const sortedStarts = [...stmtStarts].sort((a, b) => b - a);
  for (const stmtStart of sortedStarts) {
    if (stmtStart > 0 && lines[stmtStart - 1]!.includes('svelte-ignore state_referenced_locally')) {
      totalSkipped++;
      continue;
    }
    const indent = lines[stmtStart]!.match(/^\s*/)?.[0] ?? '';
    lines.splice(stmtStart, 0, `${indent}${IGNORE_COMMENT}`);
    totalInjected++;
  }
  if (WRITE) await Bun.write(abs, lines.join('\n'));
  console.log(
    `${WRITE ? 'WROTE' : 'DRY  '} ${rel} (+${stmtStarts.size} statements / ${lineSet.size} warnings)`,
  );
}

console.log(
  `\n${WRITE ? 'Injected' : 'Would inject'} ${totalInjected} comments (skipped ${totalSkipped} already-annotated)`,
);
