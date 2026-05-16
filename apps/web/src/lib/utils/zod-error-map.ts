import { z, type ZodErrorMap } from 'zod';
import { locale } from '$lib/state/locale.svelte';

// Generated Zod schemas come from the OpenAPI envelope, which allows a
// single `pattern` per field. Kubb therefore emits `.regex(/combined/)`
// without a per-rule message, and Zod falls back to the literal
// "Invalid". Routing those issues through `locale.t` produces a real
// message without editing the generated `.ts` files (they're rewritten
// on every `bun run sdk:generate`).
const ZOD_ERROR_MAP: ZodErrorMap = (issue, ctx) => {
  const t = locale.t;
  const lastPath = issue.path[issue.path.length - 1];

  if (
    lastPath === 'password' &&
    issue.code === z.ZodIssueCode.invalid_string &&
    issue.validation === 'regex'
  ) {
    return { message: t('validation.passwordRequirements') };
  }

  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === 'undefined' || issue.received === 'null') {
        return { message: t('validation.required') };
      }
      return { message: t('validation.invalid') };
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === 'email') return { message: t('validation.email') };
      return { message: t('validation.invalid') };
    case z.ZodIssueCode.too_small:
      return { message: t('validation.tooShort', { min: Number(issue.minimum) }) };
    case z.ZodIssueCode.too_big:
      return { message: t('validation.tooLong', { max: Number(issue.maximum) }) };
    default:
      return { message: ctx.defaultError };
  }
};

let installed = false;

export function installZodErrorMap(): void {
  if (installed) return;
  z.setErrorMap(ZOD_ERROR_MAP);
  installed = true;
}
