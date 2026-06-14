import type { Translator } from "@patch-careers/i18n";
import type { FormData, SectionField } from "../types";

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
  t: Translator,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = data[field.key]?.trim() ?? "";
    if (field.required && value.length === 0) {
      errors[field.key] = t("sections.validation.required");
      continue;
    }
    if (value.length === 0) continue;
    if (field.minLength !== undefined && value.length < field.minLength) {
      errors[field.key] = t("sections.validation.minLength", { count: field.minLength });
      continue;
    }
    if (field.maxLength !== undefined && value.length > field.maxLength) {
      errors[field.key] = t("sections.validation.maxLength", { count: field.maxLength });
      continue;
    }
    if ((field.type === "url" || field.key === "website") && !/^https?:\/\/\S+/i.test(value)) {
      errors[field.key] = t("sections.validation.invalidUrl");
      continue;
    }
    if (field.pattern) {
      try {
        if (!new RegExp(field.pattern).test(value))
          errors[field.key] = t("sections.validation.invalidPattern");
      } catch {
        // Backend owns malformed dynamic patterns; keep the UI usable.
      }
    }
  }
  return errors;
}
