import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const API_DIR = join(import.meta.dir, '../src/generated/api');

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
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.name.endsWith('.ts')) files.push(full);
  }
  return files;
}

const files = await walk(API_DIR);
let count = 0;
for (const f of files) {
  if (await processFile(f)) count++;
}
console.log(`Fixed response types in ${count} files`);
