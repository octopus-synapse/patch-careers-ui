/**
 * Validation for backend-described dynamic fields (section items, onboarding
 * steps): the descriptor carries `required` / `minLength` / `maxLength` /
 * `type` / `pattern`, so one routine serves every dynamic form. Was
 * duplicated between the onboarding wizard and the section editor.
 */

import type { Translator } from "@patch-careers/i18n";
import { validationMessage } from "./messages";
import type { ValidationIssue } from "./rules";
import { validateLength } from "./validators";

export interface GenericFieldRule {
  readonly key: string;
  readonly required?: boolean | undefined;
  readonly minLength?: number | undefined;
  readonly maxLength?: number | undefined;
  readonly type?: string | undefined;
  readonly pattern?: string | undefined;
}

const URL_RE = /^https?:\/\/\S+/i;

export function genericFieldIssue(field: GenericFieldRule, value: string): ValidationIssue | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return field.required ? { code: "REQUIRED" } : null;
  const length = validateLength(trimmed, { min: field.minLength, max: field.maxLength });
  if (length) return length;
  if ((field.type === "url" || field.key === "website") && !URL_RE.test(trimmed)) {
    return { code: "URL_INVALID" };
  }
  if (field.pattern) {
    try {
      if (!new RegExp(field.pattern).test(trimmed)) return { code: "PATTERN_MISMATCH" };
    } catch {
      // Backend owns malformed dynamic patterns; keep the UI usable.
    }
  }
  return null;
}

/** Rendered variant — `null` when valid. */
export function validateGenericField(
  field: GenericFieldRule,
  value: string,
  t: Translator,
): string | null {
  const issue = genericFieldIssue(field, value);
  return issue ? validationMessage(issue, t) : null;
}
