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
  styleName?: string;
  stylePreviewUrl?: string | null;
};

export type ResumeStyleOption = {
  id: string;
  name: string;
  description?: string | null;
  category?: string;
  tags?: string[];
  atsScore?: number | null;
  thumbnailUrl?: string | null;
};
