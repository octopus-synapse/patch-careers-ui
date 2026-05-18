import { type ZodTypeAny, z } from 'zod';

// P2-#41: compile a server-supplied pattern into a RegExp without
// taking down the form render on a malformed value. Catastrophic
// patterns (`(a+)+$`) would still hang the main thread once the regex
// runs, but the backend onboarding-fields endpoint is the only writer
// of these strings — a follow-up to allowlist common formats is
// tracked under PD-009.
function safeCompileRegex(source: string): RegExp | null {
  try {
    return new RegExp(source);
  } catch {
    return null;
  }
}

/**
 * @deprecated F3 will move all field validation server-side. The backend
 * already returns `{validation:{minLength,maxLength,pattern,...}}` per
 * T11.6 — this helper accepts either the legacy flat shape or the
 * structured `validation` object so consumers don't need to change shape
 * during the transition. F3 deletes both this helper and its callsites.
 */

export interface FieldDescriptor {
  key: string;
  type: string;
  label: string;
  required: boolean;
  /** Legacy flat fields. */
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  /** New structured shape from `/v1/onboarding/session` (T11.6). */
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    required?: boolean;
    format?: 'email' | 'url' | 'cpf' | 'phone' | 'cep' | 'date';
  };
}

function effective(field: FieldDescriptor): {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  required: boolean;
  format?: string;
} {
  return {
    minLength: field.validation?.minLength ?? field.minLength,
    maxLength: field.validation?.maxLength ?? field.maxLength,
    pattern: field.validation?.pattern ?? field.pattern,
    required: field.validation?.required ?? field.required,
    format: field.validation?.format,
  };
}

export function buildZodFromFields(
  fields: FieldDescriptor[],
): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const field of fields) {
    const v = effective(field);
    let schema: z.ZodString;

    if (field.type === 'email' || v.format === 'email') {
      schema = z.string().email(`${field.label} must be a valid email`);
    } else if (field.type === 'url' || v.format === 'url') {
      schema = z.string().regex(/^https?:\/\/.+/, `${field.label} must be a valid URL`);
    } else {
      schema = z.string();
    }

    if (v.minLength !== undefined) {
      schema = schema.min(v.minLength, `${field.label} must be at least ${v.minLength} characters`);
    }
    if (v.maxLength !== undefined) {
      schema = schema.max(v.maxLength, `${field.label} must be at most ${v.maxLength} characters`);
    }
    if (v.pattern !== undefined) {
      // P2-#41: the pattern is supplied by the backend onboarding-fields
      // payload. A malformed value would `throw SyntaxError` synchronously
      // and kill the whole form render; a catastrophic regex (`(a+)+$`)
      // would hang the main thread on every keystroke. Guard with a parse
      // attempt + skip on failure — the field stays validated by its
      // type / length rules instead of by the bad pattern.
      const safe = safeCompileRegex(v.pattern);
      if (safe) schema = schema.regex(safe, `${field.label} format is invalid`);
    }

    if (v.required) {
      shape[field.key] = schema.min(1, `${field.label} is required`);
    } else {
      shape[field.key] = z.union([schema, z.literal('')]).optional();
    }
  }

  return z.object(shape);
}
