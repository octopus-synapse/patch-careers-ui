import { z, type ZodTypeAny } from 'zod';

export interface FieldDescriptor {
  key: string;
  type: string;
  label: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export function buildZodFromFields(fields: FieldDescriptor[]): z.ZodObject<Record<string, ZodTypeAny>> {
  const shape: Record<string, ZodTypeAny> = {};

  for (const field of fields) {
    let schema: z.ZodString;

    if (field.type === 'email') {
      schema = z.string().email(`${field.label} must be a valid email`);
    } else if (field.type === 'url') {
      schema = z.string().regex(/^https?:\/\/.+/, `${field.label} must be a valid URL`);
    } else {
      schema = z.string();
    }

    if (field.minLength !== undefined) {
      schema = schema.min(field.minLength, `${field.label} must be at least ${field.minLength} characters`);
    }
    if (field.maxLength !== undefined) {
      schema = schema.max(field.maxLength, `${field.label} must be at most ${field.maxLength} characters`);
    }
    if (field.pattern !== undefined) {
      schema = schema.regex(new RegExp(field.pattern), `${field.label} format is invalid`);
    }

    if (field.required) {
      shape[field.key] = schema.min(1, `${field.label} is required`);
    } else {
      shape[field.key] = z.union([schema, z.literal('')]).optional();
    }
  }

  return z.object(shape);
}
