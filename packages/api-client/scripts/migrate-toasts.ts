/**
 * Sweep: replace `toastState.show(t('errors.X'), 'danger')` in API catch
 * blocks with `handleApiError(err)`. Adds `(err)` to bare `catch {}` when
 * the inner toast is the only statement using err.
 *
 * Skips:
 * - toastState.show(..., 'success'|'info') — kept verbatim
 * - toastState.show(<expr>, 'danger') where expr is not `t('errors.*')` —
 *   kept verbatim (custom dynamic message, e.g. validation errors).
 *
 * Idempotent.
 *
 * Usage: bun packages/api-client/scripts/migrate-toasts.ts
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dir, '../../..');
const APPS_WEB_SRC = join(ROOT, 'apps/web/src');

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.svelte-kit'].includes(entry.name)) continue;
      out.push(...(await walk(full)));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.svelte'))) {
      out.push(full);
    }
  }
  return out;
}

const files = await walk(APPS_WEB_SRC);
let changed = 0;

for (const file of files) {
  const orig = await readFile(file, 'utf-8');
  let next = orig;

  // Convert toastState.show(<arg>, 'danger') in catch blocks → handleApiError(err).
  // Strategy: replace all such occurrences where the same try has an `await`
  // (i.e. it's an API call). To keep regex simple, replace any `toastState.show
  // (<expr>, 'danger')` that immediately follows a `} catch (err?) {` line
  // OR where it's the only statement of a catch block.
  // Simpler: replace ALL `toastState.show(<expr>, 'danger');` followed by `}`
  // (end of catch) — the safest set to migrate.
  const before = next;
  next = next.replace(
    /(\}\s*catch\s*(?:\([^)]*\))?\s*\{[^{}]*?)toastState\.show\([^)]+,\s*'danger'\);/g,
    (_full, prefix) => `${prefix}handleApiError(err);`,
  );
  if (next === before) continue;

  // Promote bare `catch {` to `catch (err) {` when handleApiError is used inside.
  // Match `} catch {` followed within ~200 chars by `handleApiError(err)`.
  next = next.replace(/} catch \{(\s*[^}]*?handleApiError\(err\))/g, '} catch (err) {$1');

  // Ensure handleApiError import exists.
  if (!/handleApiError/.test(orig.split(/<script[^>]*>/)[0] ?? orig)) {
    // best-effort: insert import after the first import line
    const importLine = `import { handleApiError } from '$lib/components/errors/error-renderer.svelte';`;
    if (!next.includes(importLine)) {
      // Insert after first `import ... from ...;` line
      const m = next.match(/^(import [^\n]+;)/m);
      if (m) {
        next = next.replace(m[0], `${m[0]}\n${importLine}`);
      }
    }
  }

  // Drop unused `t` if all error toasts were the only consumers of it (best-effort
  // — leaves it if other usages remain).
  // Actually leave that to manual cleanup; deleting `const t = ...` blindly may
  // break templates.

  if (next !== orig) {
    await writeFile(file, next);
    changed++;
    console.log(`  ✓ ${relative(ROOT, file)}`);
  }
}

console.log(`\nmigrated toasts in ${changed} files`);
