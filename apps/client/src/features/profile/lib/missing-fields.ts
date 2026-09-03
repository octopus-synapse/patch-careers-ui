/**
 * Which identity fields are still blank.
 *
 * Nothing computed this before. `useProfileCompleteness()` returns the
 * backend's 0–100 and cannot say *what* is missing, and the old identity
 * screen answered the question by rendering every field as a row with an
 * "Adicionar" placeholder — which made an empty profile look as full as a
 * complete one.
 *
 * The predicate is EMPTY, not "required". Only `name` is required by
 * validation (`lib/validation/profile-fields.ts`), but a profile with no
 * headline and no phone is not finished in any sense a recruiter cares about,
 * so every blank field is worth naming.
 */

import type { Translator } from "@patch-careers/i18n";
import { type EditableProfile, type ProfileFieldDescriptor, profileFields } from "./profile-fields";

function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim().length === 0;
}

/** The fields that carry a value, in the order the form defines them. */
export function filledProfileFields(
  profile: EditableProfile | undefined,
  t: Translator,
): ProfileFieldDescriptor[] {
  return profileFields(t).filter((field) => !isBlank(profile?.[field.key]));
}

/** The blank ones — what the "Falta" list names. */
export function missingProfileFields(
  profile: EditableProfile | undefined,
  t: Translator,
): ProfileFieldDescriptor[] {
  return profileFields(t).filter((field) => isBlank(profile?.[field.key]));
}
