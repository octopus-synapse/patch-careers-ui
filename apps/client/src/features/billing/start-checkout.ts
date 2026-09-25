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

export async function cancelBillingCheckout(
  id: string,
): Promise<"canceled" | "approved" | "other"> {
  const response = await fetcher<{ status: string }>({
    method: "POST",
    url: `/api/v1/billing/checkouts/${encodeURIComponent(id)}/cancel`,
  });
  if (response.data.status === "canceled" || response.data.status === "approved")
    return response.data.status;
  return "other";
}
