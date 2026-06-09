import type { FormData, SectionField } from "../types";

const REQUIRED_MESSAGE = "Campo obrigatório";
const INVALID_URL_MESSAGE = "Informe uma URL válida";
const INVALID_PATTERN_MESSAGE = "Formato inválido";

/**
 * Validate a section item's draft against its field descriptors. This is the
 * generic tail of the wizard's `validateStepFields` (required + length + url +
 * pattern); section-item keys never match the profile-field rules, so the
 * profile-specific checks are intentionally omitted and the result is identical
 * to what onboarding produced for these same fields.
 */
export function validateSectionFields(
  fields: SectionField[],
  data: FormData,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = data[field.key]?.trim() ?? "";
    if (field.required && value.length === 0) {
      errors[field.key] = REQUIRED_MESSAGE;
      continue;
    }
    if (value.length === 0) continue;
    if (field.minLength !== undefined && value.length < field.minLength) {
      errors[field.key] = `Mínimo de ${field.minLength} caracteres`;
      continue;
    }
    if (field.maxLength !== undefined && value.length > field.maxLength) {
      errors[field.key] = `Máximo de ${field.maxLength} caracteres`;
      continue;
    }
    if ((field.type === "url" || field.key === "website") && !/^https?:\/\/\S+/i.test(value)) {
      errors[field.key] = INVALID_URL_MESSAGE;
      continue;
    }
    if (field.pattern) {
      try {
        if (!new RegExp(field.pattern).test(value)) errors[field.key] = INVALID_PATTERN_MESSAGE;
      } catch {
        // Backend owns malformed dynamic patterns; keep the UI usable.
      }
    }
  }
  return errors;
}
