import type { GetV1OnboardingSessionQueryResponse } from "@patch-careers/api-client";

export type OnboardingSession = GetV1OnboardingSessionQueryResponse;
export type OnboardingStep = OnboardingSession["steps"][number];
export type OnboardingField = NonNullable<OnboardingStep["fields"]>[number];

export type FormData = Record<string, string>;

export type SectionItem = {
  id?: string;
  content?: Record<string, unknown>;
};

export type ReviewSection = {
  label: string;
  stepId: string;
  entries: Array<{ label: string; value: string; long?: boolean }>;
  skipped?: boolean;
  /** Item count for multi-item sections (drives the checklist row value). */
  count?: number;
};
