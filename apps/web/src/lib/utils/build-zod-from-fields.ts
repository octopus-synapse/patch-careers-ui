import { type ZodTypeAny, z } from 'zod';

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
      schema = schema.regex(new RegExp(v.pattern), `${field.label} format is invalid`);
    }

    if (v.required) {
      shape[field.key] = schema.min(1, `${field.label} is required`);
    } else {
      shape[field.key] = z.union([schema, z.literal('')]).optional();
    }
  }

  return z.object(shape);
}
