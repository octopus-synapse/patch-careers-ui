/**
 * Codemod: migrate apps/web from Orval+svelte-query@6 to Kubb+svelte-query@5.
 *
 * Transforms applied:
 *   1. Rename `getXxxQueryKey` → `XxxQueryKey` (Kubb drops the `get` prefix)
 *   2. Hook signature: `createXxx(params, { options })` → `createXxx({ ...params, options })`
 *      [skipped — verify per call site is not safe automatically]
 *   3. Store auto-subscribe: vars holding `createXxx(...)` results get `$` prefix
 *      on `.data/.isLoading/.isPending/.mutate/.refetch/.error/.isError/.isSuccess/.isFetching/.mutateAsync`
 *   4. v5 breaking changes sweep (`keepPreviousData: true` → `placeholderData`, `cacheTime` → `gcTime`)
 *
 * Idempotent: running twice is safe (already-renamed identifiers don't re-match).
 *
 * Usage: bun packages/api-client/scripts/migrate-to-kubb.ts
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { Node, Project, SyntaxKind } from 'ts-morph';

const ROOT = join(import.meta.dir, '../../..');
const APPS_WEB_SRC = join(ROOT, 'apps/web/src');

// Names of svelte-query hook return-value props that need `$` prefix on stores.
const STORE_PROPS = new Set([
  'data',
  'isLoading',
  'isPending',
  'isError',
  'isSuccess',
  'isFetching',
  'isFetched',
  'isRefetching',
  'isStale',
  'error',
  'refetch',
  'mutate',
  'mutateAsync',
  'reset',
  'status',
  'fetchStatus',
  'failureCount',
  'failureReason',
  'dataUpdatedAt',
  'errorUpdatedAt',
  'queryKey',
  'variables',
  'submittedAt',
]);

interface SdkExports {
  hooks: Set<string>;
  queryKeyRenames: Map<string, string>; // getXxxQueryKey → XxxQueryKey
  allExports: Set<string>; // every name exported by api-client (types, consts, fns)
  zodExports: Set<string>; // every name exported by api-client/zod
}

async function walk(dir: string, predicate: (path: string) => boolean): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.svelte-kit' ||
        entry.name === 'generated'
      )
        continue;
      out.push(...(await walk(full, predicate)));
    } else if (entry.isFile() && predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

async function collectSdkExports(): Promise<SdkExports> {
  const hooks = new Set<string>();
  const queryKeys = new Set<string>();
  const allExports = new Set<string>();
  const zodExports = new Set<string>();

  const generatedDir = join(ROOT, 'packages/api-client/src/generated');
  const allFiles = await walk(generatedDir, (p) => p.endsWith('.ts'));
  for (const file of allFiles) {
    const src = await readFile(file, 'utf-8');
    const isZod = file.includes('/zod/');
    // Generic export catcher: `export (type|interface|const|function|class|enum) Name`
    for (const m of src.matchAll(
      /export\s+(?:type|interface|const|function|class|enum|abstract\s+class)\s+(\w+)/g,
    )) {
      const name = m[1];
      if (isZod) zodExports.add(name);
      else allExports.add(name);
    }
    if (!isZod) {
      for (const m of src.matchAll(/export\s+(?:function|const)\s+(create[A-Z]\w+)/g)) {
        hooks.add(m[1]);
      }
      for (const m of src.matchAll(/export\s+const\s+(\w+QueryKey)\s*=/g)) {
        queryKeys.add(m[1]);
      }
    }
  }
  const queryKeyRenames = new Map<string, string>();
  for (const qk of queryKeys) {
    const legacy = `get${qk[0].toUpperCase()}${qk.slice(1)}`;
    queryKeyRenames.set(legacy, qk);
  }
  return { hooks, queryKeyRenames, allExports, zodExports };
}

interface FileResult {
  path: string;
  changed: boolean;
  hookVars: Set<string>; // variable names holding createXxx() results
  notes: string[];
}

function transformSource(
  sourceText: string,
  filename: string,
  sdk: SdkExports,
  isSvelteScript = false,
): { newText: string; hookVars: Set<string>; changed: boolean } {
  // `.svelte` script blocks use Svelte store auto-subscribe (`$query.data`).
  // `.ts` files (including `.svelte.ts` runes-state) must use `get(query).data`
  // because Svelte 5 runes don't auto-subscribe outside .svelte components.
  const useGetSubscribe = !isSvelteScript;
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99, // ESNext
      module: 99, // ESNext
      jsx: 4, // Preserve
      allowImportingTsExtensions: true,
      noEmit: true,
    },
    skipAddingFilesFromTsConfig: true,
  });
  const sf = project.createSourceFile(filename, sourceText, { overwrite: true });

  let changed = false;
  const hookVars = new Set<string>();

  // ── 1. Rename getXxxQueryKey → XxxQueryKey + ad-hoc renames ──────
  // Map: legacy Orval name → Kubb name. Includes:
  //   - getXxxQueryKey → xxxQueryKey (built dynamically from SDK exports)
  //   - XxxBody → XxxMutationRequest (Orval body suffix → Kubb mutation suffix)
  //   - XxxBody<Field> enum → XxxMutationRequest<Field>EnumKey
  //   - Auth2fa → Auth2Fa (Kubb capitalizes the "2Fa" segment)
  const renames = new Map(sdk.queryKeyRenames);
  // Hardcoded body suffix renames (verified against Kubb output)
  const BODY_RENAMES: Array<[RegExp, string]> = [
    [/^(\w+)Body$/, '$1MutationRequest'],
    [/^(\w+)BodyJobType$/, '$1MutationRequestJobTypeEnumKey'],
    [/^(\w+)BodyApplyMode$/, '$1MutationRequestApplyModeEnumKey'],
    [/^(\w+)BodySliders$/, '$1MutationRequestSliders'],
    [/^TwoFactorAuthAuth2fa(\w*)$/, 'TwoFactorAuthAuth2Fa$1'],
    [/^createTwoFactorAuthAuth2fa(\w*)$/, 'createTwoFactorAuthAuth2Fa$1'],
    [/^getTwoFactorAuthAuth2fa(\w+)QueryKey$/, 'twoFactorAuthAuth2Fa$1QueryKey'],
  ];
  function legacyToModern(name: string, isZod = false): string | null {
    const direct = renames.get(name);
    if (direct) return direct;
    const pool = isZod ? sdk.zodExports : sdk.allExports;
    for (const [re, repl] of BODY_RENAMES) {
      if (re.test(name)) {
        const target = name.replace(re, repl);
        if (pool.has(target)) return target;
      }
    }
    // Zod-specific: PascalCase type → camelCase Schema export
    //   AuthLoginBody (Orval)             → authLoginMutationRequestSchema (Kubb)
    //   AuthLoginMutationRequest (already-renamed) → authLoginMutationRequestSchema
    if (isZod) {
      const tryCamelSchema = (base: string) => {
        const camel = base[0].toLowerCase() + base.slice(1);
        const target = `${camel}Schema`;
        return pool.has(target) ? target : null;
      };
      // First try: name as-is + camelCase + "Schema"
      const direct = tryCamelSchema(name);
      if (direct) return direct;
      // Body suffix → MutationRequest schema
      const m = name.match(/^(\w+)Body$/);
      if (m) {
        const target = tryCamelSchema(`${m[1]}MutationRequest`);
        if (target) return target;
      }
    }
    return null;
  }

  // Build per-file rename map by walking imports first.
  const fileRenames = new Map<string, string>();

  // Walk import declarations, rename named imports.
  for (const importDecl of sf.getImportDeclarations()) {
    const moduleName = importDecl.getModuleSpecifierValue();
    const isApiImport = moduleName === 'api-client' || moduleName === 'api-client/zod';
    if (!isApiImport) continue;
    const isZod = moduleName === 'api-client/zod';
    for (const named of importDecl.getNamedImports()) {
      const name = named.getName();
      const renamedTo = legacyToModern(name, isZod);
      if (renamedTo) {
        named.setName(renamedTo);
        fileRenames.set(name, renamedTo);
        changed = true;
      }
    }
  }
  // Walk identifiers in the body, rename only what was renamed in imports.
  if (fileRenames.size > 0) {
    sf.forEachDescendant((node) => {
      if (Node.isIdentifier(node)) {
        const text = node.getText();
        const renamedTo = fileRenames.get(text);
        if (renamedTo && node.getParent()?.getKind() !== SyntaxKind.PropertyAccessExpression) {
          node.replaceWithText(renamedTo);
          changed = true;
        }
      }
    });
  }

  // ── 1.5. Unwrap arrow `() => (literal)` in hook call arguments ───
  // Orval style: `createXxx(() => ({...}), () => ({query: {...}}))`
  // Kubb style:  `createXxx({...}, {query: {...}})`
  sf.forEachDescendant((node) => {
    if (Node.isCallExpression(node)) {
      const expr = node.getExpression();
      if (Node.isIdentifier(expr) && sdk.hooks.has(expr.getText())) {
        for (const arg of node.getArguments()) {
          if (Node.isArrowFunction(arg) && arg.getParameters().length === 0) {
            const body = arg.getBody();
            // Body forms:
            //   () => ({...})   → ParenthesizedExpression containing ObjectLiteral
            //   () => ident     → Identifier
            //   () => 'string'  → StringLiteral / etc.
            // Unwrap to the inner expression text.
            let inner: string | null = null;
            if (Node.isParenthesizedExpression(body)) {
              inner = body.getExpression().getText();
            } else if (
              Node.isObjectLiteralExpression(body) ||
              Node.isIdentifier(body) ||
              Node.isStringLiteral(body) ||
              Node.isNumericLiteral(body) ||
              Node.isCallExpression(body) ||
              Node.isPropertyAccessExpression(body)
            ) {
              inner = body.getText();
            }
            if (inner !== null) {
              arg.replaceWithText(inner);
              changed = true;
            }
          }
        }
      }
    }
  });

  // ── 1.7. Reverse-fix: in .ts files, undo any prior `$prefix` from a
  // previous codemod run that incorrectly treated .ts the same as .svelte.
  // Convert `$varName.X` → `get(varName).X` text-level (regex sweep).
  let needsGetImport = false;
  if (useGetSubscribe) {
    let body = sf.getFullText();
    const before = body;
    const propsAlt = Array.from(STORE_PROPS).join('|');
    const reverseRe = new RegExp(`\\$([a-zA-Z_]\\w*)(\\??\\.)(?:${propsAlt})\\b`, 'g');
    body = body.replace(reverseRe, (match, varName, accessor) => {
      needsGetImport = true;
      // Reconstruct: `$query.data` → `get(query).data`
      return `get(${varName})${accessor}${match.slice(`$${varName}${accessor}`.length)}`;
    });
    if (body !== before) {
      sf.replaceWithText(body);
      changed = true;
    }
  }

  // ── 2. Identify hook variables ───────────────────────────────────
  // Find `const X = createYyy(...)` or `let X = createYyy(...)` where createYyy is in sdk.hooks.
  sf.forEachDescendant((node) => {
    if (Node.isVariableDeclaration(node)) {
      const init = node.getInitializer();
      if (!init) return;
      if (Node.isCallExpression(init)) {
        const expr = init.getExpression();
        if (Node.isIdentifier(expr) && sdk.hooks.has(expr.getText())) {
          const nameNode = node.getNameNode();
          if (Node.isIdentifier(nameNode)) {
            hookVars.add(nameNode.getText());
          }
        }
      }
    }
  });

  // ── 3. Store subscribe: $prefix (.svelte) or get() wrap (.ts) ────
  // .svelte: `foo.data` → `$foo.data` (Svelte store auto-subscribe rune)
  // .ts:     `foo.data` → `get(foo).data` (manual subscribe, requires import)
  sf.forEachDescendant((node) => {
    if (Node.isPropertyAccessExpression(node)) {
      const objExpr = node.getExpression();
      if (Node.isIdentifier(objExpr)) {
        const objName = objExpr.getText();
        if (hookVars.has(objName)) {
          const propName = node.getName();
          if (STORE_PROPS.has(propName)) {
            if (useGetSubscribe) {
              // Wrap in get(): `foo.data` → `get(foo).data`
              if (!objExpr.getText().startsWith('get(')) {
                objExpr.replaceWithText(`get(${objName})`);
                needsGetImport = true;
                changed = true;
              }
            } else if (!objName.startsWith('$')) {
              // Svelte: `foo.data` → `$foo.data`
              objExpr.replaceWithText(`$${objName}`);
              changed = true;
            }
          }
        }
      }
    }
  });

  // Insert `import { get } from 'svelte/store';` if any get() was added
  if (needsGetImport) {
    const existing = sf
      .getImportDeclarations()
      .find((d) => d.getModuleSpecifierValue() === 'svelte/store');
    if (existing) {
      const named = existing.getNamedImports().map((n) => n.getName());
      if (!named.includes('get')) {
        existing.addNamedImport('get');
      }
    } else {
      sf.insertImportDeclaration(0, {
        namedImports: ['get'],
        moduleSpecifier: 'svelte/store',
      });
    }
  }

  // ── 4. v5 breaking changes ───────────────────────────────────────
  // sourceText sweep for token-level renames.
  let body = sf.getFullText();
  const before = body;
  body = body.replace(/\bcacheTime\b/g, 'gcTime');
  body = body.replace(/\buseErrorBoundary\b/g, 'throwOnError');
  // keepPreviousData: true → placeholderData: keepPreviousData (also need import)
  if (/keepPreviousData\s*:\s*true/.test(body)) {
    body = body.replace(/keepPreviousData\s*:\s*true/g, 'placeholderData: keepPreviousData');
    // Ensure import { keepPreviousData } from '@tanstack/svelte-query'
    if (
      !/import\s*\{[^}]*\bkeepPreviousData\b[^}]*\}\s*from\s*['"]@tanstack\/svelte-query['"]/.test(
        body,
      )
    ) {
      // Insert/extend the import
      const stMatch = body.match(/import\s*\{([^}]+)\}\s*from\s*['"]@tanstack\/svelte-query['"]/);
      if (stMatch) {
        const merged = `${stMatch[1].trim()}, keepPreviousData`;
        body = body.replace(stMatch[0], `import { ${merged} } from '@tanstack/svelte-query'`);
      } else {
        body = `import { keepPreviousData } from '@tanstack/svelte-query';\n${body}`;
      }
    }
  }
  if (body !== before) changed = true;
  if (body !== sf.getFullText()) {
    sf.replaceWithText(body);
  }

  return { newText: sf.getFullText(), hookVars, changed };
}

function transformSvelteTemplate(
  svelteText: string,
  hookVars: Set<string>,
): { newText: string; changed: boolean } {
  if (hookVars.size === 0) return { newText: svelteText, changed: false };
  // Process only template portion (outside <script> tags).
  // Build a regex that finds bare identifier followed by member access of a STORE_PROP.
  // Example: `{summary.data}` → `{$summary.data}`. `{auth.data?.user}` → `{$auth.data?.user}`.
  const SCRIPT_RE = /<script\b[^>]*>[\s\S]*?<\/script>/g;
  const scripts: { start: number; end: number; text: string }[] = [];
  for (const m of svelteText.matchAll(SCRIPT_RE)) {
    const start = m.index ?? 0;
    scripts.push({ start, end: start + m[0].length, text: m[0] });
  }
  const inScript = (idx: number) => scripts.some((s) => idx >= s.start && idx < s.end);

  let changed = false;
  // For each hook var, replace `\b<var>(?=\.(data|isLoading|...))` → `$<var>` outside scripts.
  let result = svelteText;
  // Build alternation of STORE_PROPS for lookahead.
  const propsAlt = Array.from(STORE_PROPS).join('|');
  for (const v of hookVars) {
    const re = new RegExp(`(?<![\\w$.])${v}(?=\\??\\.(${propsAlt})\\b)`, 'g');
    result = result.replace(re, (match, _prop, offset) => {
      if (inScript(offset)) return match; // already handled by ts-morph in script block
      // Check we're not already prefixed
      const prev = result[offset - 1];
      if (prev === '$') return match;
      changed = true;
      return `$${v}`;
    });
  }
  return { newText: result, changed };
}

async function processFile(filePath: string, sdk: SdkExports): Promise<FileResult> {
  const ext = filePath.endsWith('.svelte') ? '.svelte' : '.ts';
  const original = await readFile(filePath, 'utf-8');

  if (ext === '.ts') {
    const { newText, hookVars, changed } = transformSource(original, filePath, sdk);
    if (changed && newText !== original) {
      await writeFile(filePath, newText);
    }
    return { path: filePath, changed, hookVars, notes: [] };
  }

  // .svelte: extract script blocks, transform each, replace, then template pass.
  const SCRIPT_RE = /(<script\b[^>]*>)([\s\S]*?)(<\/script>)/g;
  let svelteText = original;
  let scriptChanged = false;
  const allHookVars = new Set<string>();
  svelteText = svelteText.replace(SCRIPT_RE, (_full, openTag, body, closeTag) => {
    // Only transform TS scripts (with lang="ts" or no lang) — Svelte default is JS but app uses lang="ts" everywhere
    const virtualName = `${filePath.replace(/\.svelte$/, '')}__script.ts`;
    const { newText, hookVars, changed } = transformSource(body, virtualName, sdk, true);
    if (changed) scriptChanged = true;
    for (const v of hookVars) allHookVars.add(v);
    return `${openTag}${newText}${closeTag}`;
  });

  // Now process template (everything outside <script>).
  const { newText: templateProcessed, changed: templateChanged } = transformSvelteTemplate(
    svelteText,
    allHookVars,
  );

  const finalText = templateProcessed;
  const changed = scriptChanged || templateChanged;
  if (changed && finalText !== original) {
    await writeFile(filePath, finalText);
  }
  return { path: filePath, changed, hookVars: allHookVars, notes: [] };
}

async function main() {
  console.log('🔍 Collecting SDK exports...');
  const sdk = await collectSdkExports();
  console.log(`  hooks:           ${sdk.hooks.size}`);
  console.log(`  queryKey renames: ${sdk.queryKeyRenames.size}`);

  console.log('\n🔍 Walking apps/web/src...');
  const files = await walk(APPS_WEB_SRC, (p) => p.endsWith('.ts') || p.endsWith('.svelte'));
  console.log(`  files to scan: ${files.length}`);

  console.log('\n⚙️  Processing...');
  let changedCount = 0;
  for (const file of files) {
    const result = await processFile(file, sdk);
    if (result.changed) {
      changedCount++;
      console.log(`  ✓ ${relative(ROOT, file)}`);
    }
  }
  console.log(`\n✅ Done. ${changedCount}/${files.length} files modified.`);
}

await main();
