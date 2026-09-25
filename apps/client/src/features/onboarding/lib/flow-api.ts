import { fetcher } from "@patch-careers/api-client";
import type { BillingOfferCode } from "@/features/billing";
import type { FlowStepId } from "./flow-plan";

export type OnboardingPlan = "free" | "go" | "max";
export type PersistedFlow = {
  step: FlowStepId;
  resumeStep: FlowStepId;
  completedSteps: string[];
  selectedPlan: OnboardingPlan | null;
  selectedOfferCode: BillingOfferCode | null;
  selectedLocale: string | null;
  drafts: Record<string, unknown>;
};

export async function getPersistedFlow(): Promise<PersistedFlow> {
  return (await fetcher<PersistedFlow>({ method: "GET", url: "/api/v1/onboarding/flow" })).data;
}

export async function movePersistedFlow(input: {
  to: FlowStepId;
  locale?: "en" | "pt-BR";
  plan?: OnboardingPlan;
  offerCode?: BillingOfferCode;
}): Promise<PersistedFlow> {
  return (
    await fetcher<PersistedFlow>({
      method: "POST",
      url: "/api/v1/onboarding/flow/step",
      data: input,
    })
  ).data;
}

export async function savePersistedDraft(step: FlowStepId, draft: Record<string, unknown>) {
  await fetcher({ method: "PUT", url: "/api/v1/onboarding/flow/draft", data: { step, draft } });
}
