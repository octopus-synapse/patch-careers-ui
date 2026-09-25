import { fetcher } from "@patch-careers/api-client";
import { useQuery } from "@tanstack/react-query";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";
import type { BillingOfferCode } from "./use-billing-offers";

export type PatchPlanStatus = {
  enabled: boolean;
  status: string;
  active: boolean;
  plan: "free" | "go" | "max";
  pendingPlan: "go" | "max" | null;
  used: number;
  limit: number;
  periodEnd: string | null;
  quotaPeriodEnd: string | null;
  renews: boolean;
  billingSource: string | null;
  paymentMode: "card_recurring" | "pix_prepaid" | null;
  creditBalanceCents: number;
  cancelAtPeriodEnd: boolean;
  freeTranslationsUsed: number;
  freeTranslationsLimit: number;
  openCheckout: {
    id: string;
    offerCode: BillingOfferCode;
    status: string;
    expiresAt: string;
  } | null;
};

export const patchPlanKey = ["patch-go-billing"] as const;

export function usePatchPlan(pollForActivation = false) {
  const { hasBootstrapped } = useAuthBootstrap();
  const { isAuthenticated, currentUser } = useAuthState();
  const query = useQuery({
    queryKey: [...patchPlanKey, currentUser?.userId],
    queryFn: async () =>
      (await fetcher<PatchPlanStatus>({ method: "GET", url: "/api/v1/billing/subscription" })).data,
    enabled: hasBootstrapped && isAuthenticated,
    staleTime: 60_000,
    refetchInterval: pollForActivation
      ? (query) => (query.state.data?.active ? false : 5_000)
      : false,
  });
  return {
    ...query,
    canUsePaid: query.data ? !query.data.enabled || query.data.active : false,
  };
}
