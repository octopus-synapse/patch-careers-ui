#!/usr/bin/env bun
// F3-PD-016b — Guard against re-introduction of dead i18n key patterns.
// Fails if any key under packages/i18n/src/dictionaries/*.json matches
// `^errors\.(?!network$)` or `^auth\..*\.error[A-Z]`. The single
// retained error key is `errors.network` (fallback for non-Error errs).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const DICTS = ['en.json', 'pt-BR.json'].map((f) => join(ROOT, 'packages/i18n/src/dictionaries', f));

// Keys that paraphrase backend error responses. These were removed in
// Phase 4 (commit 1aa2b522). Block re-introduction. Frontend-owned
// messages like `errors.loadFailed` (network/render failure, no backend
// response to localize) stay allowed — only specific known-bad names.
const BAD_PATTERNS = [
  /^errors\.(generic|unauthorized|forbidden|notFound|conflict|validation|rateLimited|consentRequired|consentVersionMismatch|emailInUse|weakPassword|invalidCredentials|noPrimaryResume)$/,
  /^auth\.[^.]+\.error(InvalidCredentials|EmailInUse|EmailInvalid|PasswordTooShort|Generic|RateLimited)$/,
];

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flatten(v as Record<string, unknown>, path));
    } else {
      out.push(path);
    }
  }
  return out;
}

const offenders: Array<{ dict: string; key: string }> = [];
for (const file of DICTS) {
  const dict = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  for (const key of flatten(dict)) {
    if (BAD_PATTERNS.some((re) => re.test(key))) {
      offenders.push({ dict: file.replace(`${ROOT}/`, ''), key });
    }
  }
}

if (offenders.length > 0) {
  console.error(`F3-PD-016b — ${offenders.length} forbidden i18n key(s):\n`);
  for (const o of offenders) console.error(`  ${o.dict}: ${o.key}`);
  console.error(
    '\nPolicy: error messages come from the backend via Accept-Language. The frontend should never paraphrase them. Only `errors.network` is allowed as a non-Error fallback.',
  );
  process.exit(1);
}

console.log('i18n-keys: OK');
