import type { GetV1OnboardingSessionQueryResponse } from "@patch-careers/api-client";

/**
 * The field descriptor that drives the section editor (text/date/select/…). Its
 * shape is the onboarding session's field contract — the same generated type the
 * wizard already feeds the editor — so the wizard's `OnboardingField[]` and the
 * Profile tab's `fieldsFromDefinition(...)` output are interchangeable here.
 */
type OnboardingSessionStep = GetV1OnboardingSessionQueryResponse["steps"][number];
export type SectionField = NonNullable<OnboardingSessionStep["fields"]>[number];

export type FormData = Record<string, string>;

export type SectionItem = {
  id?: string;
  content?: Record<string, unknown>;
};

/**
 * The minimal, session-free description a section editor needs. An onboarding
 * `OnboardingStep` is structurally assignable to it (it carries all of these),
 * and the Profile tab builds one from a resume section's definition.
 */
export type SectionDescriptor = {
  fields?: SectionField[] | null;
  sectionTypeKey?: string | null;
  addLabel?: string | null;
  noDataLabel?: string | null;
  required?: boolean | null;
};

/** What a host (onboarding = local batch, Profile = live API) is asked to persist. */
export type SectionPersistAction = {
  kind: "create" | "update" | "delete";
  item: SectionItem;
  index: number;
};
