import { fetcher } from "@patch-careers/api-client";
import type { Href } from "expo-router";
import type { BillingOfferCode } from "./use-billing-offers";

export async function createBillingCheckoutRoute(offerCode: BillingOfferCode): Promise<Href> {
  const response = await fetcher<{ id: string }>({
    method: "POST",
    url: "/api/v1/billing/checkouts",
    data: { offerCode },
  });
  return `/billing/checkout?checkout=${encodeURIComponent(response.data.id)}` as Href;
}
