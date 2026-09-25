import { fetcher } from "@patch-careers/api-client";
import { useQuery } from "@tanstack/react-query";

export type BillingOfferCode =
  | "go_card_month"
  | "max_card_month"
  | "go_pix_quarter"
  | "max_pix_quarter"
  | "go_pix_year"
  | "max_pix_year"
  | "max_pix_year_founder";

export type BillingOffer = {
  code: BillingOfferCode;
  plan: "go" | "max";
  paymentMethod: "card" | "pix";
  recurring: boolean;
  termMonths: 1 | 3 | 12;
  amountCents: number;
  listAmountCents: number;
  currency: "BRL";
  founderRemaining: number | null;
};

export const billingOffersKey = ["billing-offers"] as const;

/** Public catalogue used before account creation and on the plans page. */
export function useBillingOffers() {
  return useQuery({
    queryKey: billingOffersKey,
    queryFn: async () =>
      (
        await fetcher<{ items: BillingOffer[] }>({
          method: "GET",
          url: "/api/v1/billing/offers",
        })
      ).data.items,
    staleTime: 5 * 60_000,
  });
}
