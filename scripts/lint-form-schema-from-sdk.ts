#!/usr/bin/env bun
/**
 * Cat 2 #7 (frontend) — convention from `apps/web/CLAUDE.md`:
 *
 *   > Forms use `createForm({ schema })`. Schema comes from the
 *   > generated SDK: `import { xxxMutationRequestSchema } from 'api-client/zod'`.
 *   > Do not write Zod manually in forms. Email/password rules live
 *   > in the backend (`shared-kernel/schemas/primitives`) and
 *   > propagate via SDK regen.
 *
 * Rationale: backend is the single source of truth for input shapes.
 * A local `z.object({ email: z.string().email(), ... })` in a form
 * diverges silently from the backend's authoritative validation,
 * letting clients submit payloads the server rejects (or vice versa).
 *
 * Rule: any `*.svelte` or `*.ts` file (non-test) that calls
 * `createForm(` must import at least one symbol from `api-client/zod`.
 * Files calling `createForm` AND containing a `z.object(...)` literal
 * are flagged regardless — the second pattern is the explicit
 * antipattern.
 *
 * Inline escape: `// lint-allow-local-zod: <reason>` somewhere in the
 * file, for rare cases where a form composes additional client-side-only
 * fields (e.g. "type-the-word-DELETE" confirmation that the backend
 * doesn't model).
 *
 * Run: bun run scripts/lint-form-schema-from-sdk.ts
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dir, '..');
const APP = join(ROOT, 'apps/web/src');

const CALL_RE = /\bcreateForm\s*[<(]/;
const SDK_IMPORT_RE = /from\s+['"`]api-client\/zod['"`]/;
const ZOD_OBJECT_RE = /\bz\.object\s*\(/;
const ESCAPE_RE = /lint-allow-local-zod:\s*\S/;

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.startsWith('.') || entry === 'node_modules') continue;
    const full = join(dir, entry);
    let stat: ReturnType<typeof statSync>;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) yield* walk(full);
    else if (
      (entry.endsWith('.svelte') || entry.endsWith('.ts')) &&
      !entry.endsWith('.spec.ts') &&
      !entry.endsWith('.test.ts')
    )
      yield full;
  }
}

type Offense = { file: string; reason: string };
const offenses: Offense[] = [];

for (const file of walk(APP)) {
  const rel = relative(ROOT, file);
  // The creator file itself is the abstraction, not a caller.
  if (rel.endsWith('lib/state/create-form.svelte.ts')) continue;
  const src = readFileSync(file, 'utf8');
  if (!CALL_RE.test(src)) continue;
  if (ESCAPE_RE.test(src)) continue;
  if (ZOD_OBJECT_RE.test(src)) {
    offenses.push({
      file: rel,
      reason: 'contains `z.object(...)` next to `createForm(` — use a SDK schema instead',
    });
    continue;
  }
  if (!SDK_IMPORT_RE.test(src)) {
    offenses.push({
      file: rel,
      reason: "calls `createForm(` but no `from 'api-client/zod'` import found",
    });
  }
}

if (offenses.length === 0) {
  console.log('lint-form-schema-from-sdk: 0 violations');
  process.exit(0);
}
console.error(`lint-form-schema-from-sdk: ${offenses.length} violation(s):`);
for (const o of offenses) console.error(`  ${o.file}  ${o.reason}`);
console.error(
  "\nForm schema must come from `import { ... } from 'api-client/zod'` (the generated SDK). " +
    'Email/password rules live in the backend and propagate via SDK regen — backend is the single source of truth.',
);
process.exit(1);
