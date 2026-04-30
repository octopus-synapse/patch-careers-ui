import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const API_DIR = join(import.meta.dir, '../src/generated/api');

/**
 * Post-Orval transform: Orval still wraps responses in `{ data, status }`
 * even though customFetch returns the bare body. Strip the wrapper so the
 * exported `xxxResponse200` / `xxxResponseSuccess` types are usable
 * directly. Bring this back from F2 — turns out frontend types broke
 * across the board after we deleted it (the underlying root cause is
 * that many backend routes still don't declare a `response` schema, so
 * `data: void` leaks through; F1 enforcement is only a warning).
 */
async function processFile(filePath: string) {
  let content = await readFile(filePath, 'utf-8');
  let changed = false;

  // Pattern: `export type xxxResponse200 = {\n  data: SomeDto\n  status: 200\n}`
  // Replace with: `export type xxxResponse200 = SomeDto`
  content = content.replace(
    /export type (\w+Response\d+) = \{\s*\n\s*data: ([^\n]+)\s*\n\s*status: \d+\s*\n\}/g,
    (_, name, dtoType) => {
      changed = true;
      return `export type ${name} = ${dtoType}`;
    },
  );

  // Pattern: `export type xxxResponseSuccess = (xxxResponse200) & {\n  headers: Headers;\n};`
  // Replace with: `export type xxxResponseSuccess = xxxResponse200`
  content = content.replace(
    /export type (\w+ResponseSuccess) = \((\w+)\) & \{\s*\n\s*headers: Headers;\s*\n\};/g,
    (_, name, ref) => {
      changed = true;
      return `export type ${name} = ${ref}`;
    },
  );

  if (changed) {
    await writeFile(filePath, content);
  }
  return changed;
}

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

async function main() {
  const files = await walk(API_DIR);
  let changedCount = 0;
  for (const file of files) {
    if (await processFile(file)) changedCount++;
  }
  console.log(`fix-response-types: changed ${changedCount}/${files.length} files`);
}

await main();
