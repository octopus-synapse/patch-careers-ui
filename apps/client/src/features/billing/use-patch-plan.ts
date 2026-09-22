import { fetcher } from "@patch-careers/api-client";
import { useQuery } from "@tanstack/react-query";
import { useAuthBootstrap, useAuthState } from "@/providers/auth-provider";

export type PatchPlanStatus = {
  enabled: boolean;
  status: string;
  active: boolean;
  plan: "free" | "go" | "max";
  used: number;
  limit: number;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  freeTranslationsUsed: number;
  freeTranslationsLimit: number;
};

export const patchPlanKey = ["patch-go-billing"] as const;

export function usePatchPlan(pollForActivation = false) {
  const { hasBootstrapped } = useAuthBootstrap();
  const { isAuthenticated, currentUser } = useAuthState();
  const query = useQuery({
    queryKey: [...patchPlanKey, currentUser?.userId],
    queryFn: async () =>
      (await fetcher<PatchPlanStatus>({ method: "GET", url: "/api/v1/billing/patch-go" })).data,
    enabled: hasBootstrapped && isAuthenticated,
    staleTime: 60_000,
    refetchInterval: pollForActivation
      ? (query) =>
          query.state.data?.active || query.state.data?.status === "country_mismatch"
            ? false
            : 5_000
      : false,
  });
  return {
    ...query,
    canUsePaid: query.data ? !query.data.enabled || query.data.active : false,
  };
}
