import type { Translator } from "@patch-careers/i18n";
import { validateGenericField } from "@/lib/validation";
import type { FormData, SectionField } from "../types";

/**
 * Validate a section item's draft against its field descriptors — the same
 * generic routine (required + length + url + pattern) the onboarding wizard
 * applies to non-profile fields.
 */
export function validateSectionFields(
  fields: SectionField[],
  data: FormData,
  t: Translator,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const error = validateGenericField(field, data[field.key] ?? "", t);
    if (error) errors[field.key] = error;
  }
  return errors;
}
