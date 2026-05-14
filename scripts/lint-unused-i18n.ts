#!/usr/bin/env bun
// F3-PD-015 — Detect orphan i18n keys (keys present in dict but never
// referenced by a `t('...')` call in apps/web/src or packages/ui/src).
//
// Modes:
//   --check (default): exit 1 with a list of orphans.
//   --fix:             rewrite the dicts removing orphans (use with care;
//                      keys consumed via dynamic template like
//                      `t(\`errors.${code}\`)` are flagged as orphan but
//                      MUST be preserved — add them to ALLOW.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Glob } from 'bun';

const ROOT = process.cwd();
const DICTS = ['en.json', 'pt-BR.json'].map((f) => ({
  path: join(ROOT, 'packages/i18n/src/dictionaries', f),
  rel: `packages/i18n/src/dictionaries/${f}`,
}));

const SOURCES = ['apps/web/src/**/*.{ts,svelte}', 'packages/ui/src/**/*.{ts,svelte}'];

const STATIC_ALLOW: ReadonlySet<string> = new Set([
  // Single retained network fallback.
  'errors.network',
  // Admin sidebar labels are looked up via the dynamic
  // `t(link.labelKey)` indirection in `admin-nav-links.ts`; the
  // literal-text scanner can't follow that, so allowlist them
  // explicitly. The link table is the single source of truth — keep
  // these in sync with `ADMIN_NAV_LINKS`.
  'admin.nav.dashboard',
  'admin.nav.users',
  'admin.nav.analytics',
  'admin.nav.skills',
  'admin.nav.sections',
  'admin.nav.onboarding',
  'admin.nav.health',
  'admin.nav.performance',
  'admin.nav.chat',
  'admin.nav.audit',
  'admin.nav.featureFlags',
  'admin.nav.devTools',
  // Profile-badges: looked up via BADGE_LABEL_KEYS / BADGE_HINT_KEYS
  // const maps in `_components/profile-badges.svelte`. The literal-text
  // scanner can't follow the indirection.
  'ui.badgeIcon.firstBuild',
  'ui.badgeIcon.ats90Plus',
  'ui.badgeIcon.mentored10',
  'ui.badgeIcon.interviews5',
  'ui.badgeIcon.contributor',
  'ui.badgeIcon.eventSpeaker',
  'myProfile.public.badgeHint.firstBuild',
  'myProfile.public.badgeHint.ats90Plus',
  'myProfile.public.badgeHint.mentored10',
  'myProfile.public.badgeHint.interviews5',
  'myProfile.public.badgeHint.contributor',
  'myProfile.public.badgeHint.eventSpeaker',
]);

// Pending-sweep allowlist — keys added in preparation for the
// hardcoded-string sweep but not yet referenced via `t(...)` anywhere.
// Maintained in `scripts/i18n-pending-sweep.json`; an entry survives
// here until the sweep replaces the source literal with `t('<key>')`.
// On every commit, when a literal is replaced and the orphan check
// finds the key referenced, the dev runs the sweep refresher to drop
// it from the pending file.
const PENDING_SWEEP_PATH = join(ROOT, 'scripts/i18n-pending-sweep.json');
const PENDING_SWEEP_KEYS: ReadonlySet<string> = (() => {
  if (!existsSync(PENDING_SWEEP_PATH)) return new Set<string>();
  try {
    const raw = JSON.parse(readFileSync(PENDING_SWEEP_PATH, 'utf8')) as {
      entries?: { key: string }[];
    };
    return new Set(raw.entries?.map((e) => e.key) ?? []);
  } catch {
    return new Set<string>();
  }
})();

const ALLOW: ReadonlySet<string> = new Set([...STATIC_ALLOW, ...PENDING_SWEEP_KEYS]);

function flatten(obj: Record<string, unknown>, prefix = ''): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [kk, vv] of flatten(v as Record<string, unknown>, path)) out.set(kk, vv);
    } else {
      out.set(path, v);
    }
  }
  return out;
}

async function collectReferencedKeys(): Promise<Set<string>> {
  const refs = new Set<string>();
  const literalRe = /t\(\s*['"`]([a-zA-Z][a-zA-Z0-9_.-]+)['"`]/g;
  const dynamicPrefixRe = /t\(\s*`([a-zA-Z][a-zA-Z0-9_.-]+)\.\$\{/g;

  for (const pattern of SOURCES) {
    const glob = new Glob(pattern);
    for await (const rel of glob.scan({ cwd: ROOT, absolute: false })) {
      const text = readFileSync(join(ROOT, rel), 'utf8');
      for (const m of text.matchAll(literalRe)) refs.add(m[1] ?? '');
      // For dynamic keys (`t(\`namespace.${var}\`)`), keep every key under
      // that namespace by adding a wildcard tracker — handled below.
      for (const m of text.matchAll(dynamicPrefixRe)) refs.add(`${m[1] ?? ''}.*`);
    }
  }
  return refs;
}

function isReferenced(key: string, refs: Set<string>): boolean {
  if (refs.has(key)) return true;
  // Wildcard prefix match for dynamic keys.
  for (const ref of refs) {
    if (!ref.endsWith('.*')) continue;
    const prefix = ref.slice(0, -2);
    if (key === prefix || key.startsWith(`${prefix}.`)) return true;
  }
  return false;
}

async function main(): Promise<void> {
  const mode = process.argv.includes('--fix') ? 'fix' : 'check';
  const refs = await collectReferencedKeys();

  for (const { path, rel } of DICTS) {
    const dict = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    const flat = flatten(dict);

    const orphans: string[] = [];
    for (const key of flat.keys()) {
      if (ALLOW.has(key)) continue;
      if (!isReferenced(key, refs)) orphans.push(key);
    }

    if (orphans.length === 0) {
      console.log(`${rel}: OK (no orphans)`);
      continue;
    }

    if (mode === 'check') {
      console.error(`${rel}: ${orphans.length} orphan keys\n`);
      for (const k of orphans.slice(0, 25)) console.error(`  ${k}`);
      if (orphans.length > 25) console.error(`  ... ${orphans.length - 25} more`);
      process.exitCode = 1;
    } else {
      // Mode = fix: rebuild the dict skipping orphan leaves.
      const next = pruneOrphans(dict, orphans);
      writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`);
      console.log(`${rel}: removed ${orphans.length} orphan keys`);
    }
  }
}

function pruneOrphans(
  obj: Record<string, unknown>,
  orphans: string[],
  prefix = '',
): Record<string, unknown> {
  const orphanSet = new Set(orphans);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const nested = pruneOrphans(v as Record<string, unknown>, orphans, path);
      if (Object.keys(nested).length > 0) out[k] = nested;
    } else if (!orphanSet.has(path)) {
      out[k] = v;
    }
  }
  return out;
}

await main();
